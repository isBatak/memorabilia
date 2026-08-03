import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import pLimit from 'p-limit';
import { fetchHtml, parseArticle, parseNavigation } from './scrape.mjs';

const REPLACEMENT = '\uFFFD';
const API_DIR = path.resolve(process.env.API_DIR ?? 'public/api/v1');
const CONCURRENCY = Number(process.env.CONCURRENCY ?? 3);
const WRITE = process.argv.includes('--write');
const HELP = process.argv.includes('--help') || process.argv.includes('-h');
const KNOWN_ARGS = new Set(['--write', '--help', '-h']);

function usage() {
  console.log(`Usage: node scripts/repair-encoding.mjs [options]

Restore characters from the original Wayback bytes and merge them into existing
API JSON. Only U+FFFD positions are changed; filenames, slugs, local image URLs,
and all other existing values are preserved.

Options:
  --write     Write verified repairs (default is a dry run)
  --help, -h  Show this help

Environment:
  API_DIR      JSON root (default: public/api/v1)
  CONCURRENCY  Concurrent archive requests (default: 3)`);
}

function countReplacements(value) {
  return typeof value === 'string' ? value.split(REPLACEMENT).length - 1 : 0;
}

function matchesExceptReplacements(damaged, restored) {
  const asciiSkeleton = value => [...value]
    .filter(character => character.codePointAt(0) <= 127)
    .join('');
  return asciiSkeleton(damaged) === asciiSkeleton(restored);
}

function mergeRestored(current, restored, location, stats) {
  if (typeof current === 'string') {
    if (!current.includes(REPLACEMENT)) return current;
    if (typeof restored === 'string' && matchesExceptReplacements(current, restored)) {
      stats.repaired += countReplacements(current) - countReplacements(restored);
      return restored;
    }
    stats.unmatched.push({
      location,
      damaged: current.slice(0, 240),
      restored: typeof restored === 'string' ? restored.slice(0, 240) : null
    });
    return current;
  }

  if (Array.isArray(current)) {
    return current.map((item, index) => mergeRestored(item, restored?.[index], `${location}[${index}]`, stats));
  }

  if (!current || typeof current !== 'object') return current;
  return Object.fromEntries(Object.entries(current).map(([key, value]) => [
    key,
    mergeRestored(value, restored?.[key], location ? `${location}.${key}` : key, stats)
  ]));
}

async function writeJsonAtomic(file, value) {
  const temporary = `${file}.repair-encoding-${process.pid}.tmp`;
  await fs.writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`);
  await fs.rename(temporary, file);
}

async function readJson(file) {
  return JSON.parse(await fs.readFile(file, 'utf8'));
}

async function main() {
  if (HELP) return usage();
  const unknownArgs = process.argv.slice(2).filter(argument => !KNOWN_ARGS.has(argument));
  if (unknownArgs.length) throw new Error(`Unknown option: ${unknownArgs.join(', ')}`);
  if (!Number.isInteger(CONCURRENCY) || CONCURRENCY < 1) throw new Error('CONCURRENCY must be a positive integer');

  const indexPath = path.join(API_DIR, 'index.json');
  const navigationPath = path.join(API_DIR, 'navigation.json');
  const index = await readJson(indexPath);
  const navigation = await readJson(navigationPath);
  const startUrl = navigation.source;
  if (!startUrl) throw new Error('navigation.json is missing its source URL');

  console.log('Fetching navigation with the source page charset…');
  const startPage = await fetchHtml(startUrl);
  const restoredNavigation = parseNavigation(startPage.html, startPage.finalUrl);
  const stats = { repaired: 0, unmatched: [], failed: [] };
  const mergedNavigation = mergeRestored(navigation, restoredNavigation, 'navigation', stats);
  const mergedIndex = structuredClone(index);

  for (const category of Object.keys(restoredNavigation)) {
    mergedIndex[category] = index[category].map((item, itemIndex) =>
      mergeRestored(item, restoredNavigation[category][itemIndex], `index.${category}[${itemIndex}]`, stats)
    );
  }

  const entries = Object.entries(restoredNavigation).flatMap(([category, items]) =>
    items.map((restoredItem, itemIndex) => ({
      category,
      itemIndex,
      restoredItem,
      indexedItem: mergedIndex[category][itemIndex]
    }))
  );
  const limit = pLimit(CONCURRENCY);
  let completed = 0;

  await Promise.all(entries.map(entry => limit(async () => {
    const { category, itemIndex, restoredItem, indexedItem } = entry;
    const label = `${category}[${itemIndex}] ${restoredItem.title}`;
    try {
      if (!indexedItem?.file) throw new Error('missing file reference');
      const articlePath = path.join(API_DIR, indexedItem.file);
      const currentArticle = await readJson(articlePath);
      let restoredArticle;
      if (restoredItem.archiveUrl) {
        const page = restoredItem.originalUrl === startPage.finalUrl
          ? startPage
          : await fetchHtml(restoredItem.archiveUrl);
        restoredArticle = parseArticle(page.html, restoredItem.archiveUrl, page.finalUrl, category);
      } else {
        restoredArticle = { title: restoredItem.title };
      }
      const mergedArticle = mergeRestored(currentArticle, restoredArticle, indexedItem.file, stats);
      if (WRITE) await writeJsonAtomic(articlePath, mergedArticle);
    } catch (error) {
      stats.failed.push({ entry: label, error: error.message });
    } finally {
      completed += 1;
      console.log(`[${completed}/${entries.length}] ${label}`);
    }
  })));

  if (WRITE) {
    await writeJsonAtomic(navigationPath, mergedNavigation);
    await writeJsonAtomic(indexPath, mergedIndex);
  }

  console.log(`${WRITE ? 'Repaired' : 'Would repair'} ${stats.repaired.toLocaleString()} replacement characters.`);
  console.log(`${stats.unmatched.length} values could not be matched; ${stats.failed.length} entries failed.`);
  if (stats.unmatched.length) console.log(JSON.stringify(stats.unmatched.slice(0, 10), null, 2));
  if (stats.failed.length) console.log(JSON.stringify(stats.failed, null, 2));
  if (!WRITE) console.log('Dry run only. Rerun with --write after reviewing the summary.');
  if (stats.unmatched.length || stats.failed.length) process.exitCode = 2;
}

main().catch(error => {
  console.error(`Encoding repair failed: ${error.message}`);
  process.exitCode = 1;
});
