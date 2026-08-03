import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import dictionary from 'dictionary-hr';
import { createHunspellFromStrings } from 'hunspell-wasm';

const REPLACEMENT = '\uFFFD';
const API_DIR = path.resolve(process.env.API_DIR ?? 'public/api/v1');
const REPORT_FILE = path.resolve(process.env.CORRECTION_REPORT ?? '.tmp/croatian-character-report.json');
const LOWERCASE_LETTERS = ['č', 'ć', 'đ', 'š', 'ž'];
const UPPERCASE_LETTERS = LOWERCASE_LETTERS.map(letter => letter.toLocaleUpperCase('hr'));
const MAX_VARIANTS = Number(process.env.MAX_VARIANTS ?? 15_625); // 5^6
const WORD_PATTERN = /[\p{L}\uFFFD]+/gu;
const WRITE = process.argv.includes('--write');
const HELP = process.argv.includes('--help') || process.argv.includes('-h');
const KNOWN_ARGS = new Set(['--write', '--report-only', '--help', '-h']);
let spell;

function usage() {
  console.log(`Usage: node scripts/fix-croatian-characters.mjs [options]

Restore Croatian letters hidden by U+FFFD using a Hunspell dictionary.
Only words with exactly one valid candidate are corrected automatically.
rawArticleHtml and URL fields are never changed.

Options:
  --write        Write unambiguous corrections (default is a dry run)
  --report-only  Deprecated alias for the default dry run
  --help, -h     Show this help

Environment:
  API_DIR              JSON root (default: public/api/v1)
  CORRECTION_REPORT    Review report path (default: .tmp/croatian-character-report.json)
  MAX_VARIANTS         Candidate limit per word (default: ${MAX_VARIANTS})`);
}

async function listJsonFiles(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async entry => {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return listJsonFiles(target);
    return entry.isFile() && entry.name.endsWith('.json') ? [target] : [];
  }));
  return nested.flat().sort();
}

function visitStrings(value, visitor, keys = []) {
  if (typeof value === 'string') return visitor(value, keys);
  if (Array.isArray(value)) return value.map((item, index) => visitStrings(item, visitor, [...keys, index]));
  if (!value || typeof value !== 'object') return value;

  return Object.fromEntries(Object.entries(value).map(([key, item]) => [
    key,
    key === 'rawArticleHtml' ? item : visitStrings(item, visitor, [...keys, key])
  ]));
}

function isUrlField(keys) {
  return /url$/i.test(String(keys.at(-1) ?? ''));
}

function countReplacements(text) {
  return [...text].filter(character => character === REPLACEMENT).length;
}

function isSentenceStart(text, wordStart) {
  const prefix = text.slice(0, wordStart).trimEnd();
  return prefix.length === 0 || /[.!?\n]\s*$/u.test(prefix);
}

function replacementLetters(word, text, wordStart) {
  const existingLetters = [...word].filter(character => character !== REPLACEMENT);
  const allUppercase = existingLetters.some(character => /\p{Lu}/u.test(character))
    && existingLetters.every(character => !/\p{Ll}/u.test(character));
  const uppercaseFirst = word.startsWith(REPLACEMENT) && isSentenceStart(text, wordStart);
  return [...word].map((character, index) => {
    if (character !== REPLACEMENT) return [character];
    return allUppercase || (index === 0 && uppercaseFirst) ? UPPERCASE_LETTERS : LOWERCASE_LETTERS;
  });
}

function generateCandidates(word, text, wordStart) {
  const damagedCount = countReplacements(word);
  const variants = LOWERCASE_LETTERS.length ** damagedCount;
  if (variants > MAX_VARIANTS) return { candidates: [], reason: 'candidate-limit' };

  let candidates = [''];
  for (const choices of replacementLetters(word, text, wordStart)) {
    candidates = candidates.flatMap(prefix => choices.map(character => prefix + character));
  }
  return {
    candidates: [...new Set(candidates.filter(candidate => spell.testSpelling(candidate)))],
    reason: null
  };
}

function contextSnippet(text, start, length) {
  const radius = 90;
  const from = Math.max(0, start - radius);
  const to = Math.min(text.length, start + length + radius);
  return `${from > 0 ? '…' : ''}${text.slice(from, to).replaceAll(/\s+/g, ' ')}${to < text.length ? '…' : ''}`;
}

function addReview(reviews, word, candidates, reason, sample) {
  const key = JSON.stringify([word, candidates, reason]);
  const review = reviews.get(key) ?? { word, occurrences: 0, candidates, reason, samples: [] };
  review.occurrences += 1;
  if (review.samples.length < 3 && !review.samples.includes(sample)) review.samples.push(sample);
  reviews.set(key, review);
}

function correctText(text, reviews, analysisCache) {
  let correctedCharacters = 0;
  const corrected = text.replace(WORD_PATTERN, (word, wordStart) => {
    if (!word.includes(REPLACEMENT)) return word;

    const capitalization = replacementLetters(word, text, wordStart)
      .filter(choices => choices.length > 1)
      .map(choices => choices === UPPERCASE_LETTERS ? 'upper' : 'lower')
      .join(',');
    const cacheKey = `${capitalization}:${word}`;
    let analysis = analysisCache.get(cacheKey);
    if (!analysis) {
      analysis = generateCandidates(word, text, wordStart);
      analysisCache.set(cacheKey, analysis);
    }

    if (analysis.candidates.length === 1) {
      correctedCharacters += countReplacements(word);
      return analysis.candidates[0];
    }

    addReview(
      reviews,
      word,
      analysis.candidates,
      analysis.reason ?? (analysis.candidates.length ? 'ambiguous' : 'not-in-dictionary'),
      contextSnippet(text, wordStart, word.length)
    );
    return word;
  });
  return { corrected, correctedCharacters };
}

async function writeJsonAtomic(file, value) {
  const temporary = `${file}.fix-characters-${process.pid}.tmp`;
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`);
  await fs.rename(temporary, file);
}

async function main() {
  if (HELP) return usage();
  const unknownArgs = process.argv.slice(2).filter(argument => !KNOWN_ARGS.has(argument));
  if (unknownArgs.length) throw new Error(`Unknown option: ${unknownArgs.join(', ')}`);
  if (!Number.isInteger(MAX_VARIANTS) || MAX_VARIANTS < 5) throw new Error('MAX_VARIANTS must be an integer of at least 5');
  spell = await createHunspellFromStrings(dictionary.aff.toString(), dictionary.dic.toString());

  try {
    const files = await listJsonFiles(API_DIR);
    const reviews = new Map();
    const analysisCache = new Map();
    let affectedFiles = 0;
    let changedFiles = 0;
    let totalCharacters = 0;
    let correctedCharacters = 0;

    for (const file of files) {
      const document = JSON.parse(await fs.readFile(file, 'utf8'));
      let fileAffected = false;
      let fileCorrected = 0;
      const corrected = visitStrings(document, (text, keys) => {
        if (!text.includes(REPLACEMENT) || isUrlField(keys)) return text;
        fileAffected = true;
        totalCharacters += countReplacements(text);
        const result = correctText(text, reviews, analysisCache);
        fileCorrected += result.correctedCharacters;
        return result.corrected;
      });

      if (fileAffected) affectedFiles += 1;
      if (!fileCorrected) continue;
      changedFiles += 1;
      correctedCharacters += fileCorrected;
      if (WRITE) await writeJsonAtomic(file, corrected);
    }

    const unresolved = totalCharacters - correctedCharacters;
    const reviewItems = [...reviews.values()].sort((left, right) =>
      right.occurrences - left.occurrences || left.word.localeCompare(right.word, 'hr')
    );
    const report = {
      generatedAt: new Date().toISOString(),
      mode: WRITE ? 'write' : 'dry-run',
      apiDirectory: API_DIR,
      totals: {
        jsonFiles: files.length,
        affectedFiles,
        changedFiles,
        replacementCharacters: totalCharacters,
        unambiguousCorrections: correctedCharacters,
        unresolvedCharacters: unresolved,
        reviewItems: reviewItems.length
      },
      review: reviewItems
    };
    await writeJsonAtomic(REPORT_FILE, report);

    console.log(`Found ${totalCharacters.toLocaleString()} replacement characters in ${affectedFiles} of ${files.length} JSON files.`);
    console.log(`${WRITE ? 'Wrote' : 'Would write'} ${correctedCharacters.toLocaleString()} dictionary-confirmed corrections across ${changedFiles} files.`);
    console.log(`${unresolved.toLocaleString()} characters remain for review in ${path.relative(process.cwd(), REPORT_FILE)}.`);
    console.log('Excluded rawArticleHtml and URL fields.');
    if (!WRITE) console.log('Dry run only. Review the report, then rerun with --write.');
  } finally {
    spell.dispose();
  }
}

main().catch(error => {
  console.error(`Character correction failed: ${error.message}`);
  process.exitCode = 1;
});
