#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';

export const normalize = (value) => value
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/\b(crtani film|cartoon|epizoda|episode|full)\b/g, ' ')
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

const OPENING_PATTERN = /\b(opening|intro|uvodna?|najavna?|špica|spica|theme song|naslovna špica)\b/i;
const CROATIAN_PATTERN = /\b(hrvatski|hrvatska|sinkroniziran[oa]?|sinhronizovan[oa]?|crtani|crtić|epizoda)\b/i;
const EPISODE_PATTERN = /\b(epizoda|episode|kolekcija|kompilacija|cijeli|ceo|full|remastered)\b/i;
const REJECT_PATTERN = /\b(reaction|reakcija|review|recenzija|gameplay|parody|parodija|shorts?|trailer)\b/i;
const PREFERRED_CHANNEL = '/@classiccartoons4976';

const SEARCH_NAMES = {
  bubimir: ['Beetlejuice animated series 1989'],
  ernest: ['Ernest Le Vampire'],
  'kako-je-grinch-ukrao-bozic': ['How the Grinch Stole Christmas 1966 cartoon'],
  'mala-sirena': ['The Little Mermaid 1989 Disney'],
  'mocni-max': ['Mighty Max animated series'],
  'moje-tijelo': ['Bilo jednom život', 'Once Upon a Time Life'],
  'pauk-nije-bauk': ['Spider 1991 animated series BBC']
};

const BLOCKED_VIDEO_IDS = new Set([
  'sel5Y6EM58c',
  'BZAcvfY-au8',
  'xy3pOaj43eg',
  'Qb-JTu0gl6k',
  '5T7TT_c65go',
  'RKCxrbuKNx8',
  '_879X68fBL4',
  'dIqVNxmdtPk'
]);

const CURATED_VIDEOS = {
  'dar-mar-holmes': [
    ['i3O_lTXB9io', 'Danger Mouse Pilot + Episode 1', 'Retro Rewind TV'],
    ['VLrHsGmQHUo', 'Danger Mouse (intro) 1981', 'YouTube']
  ],
  'korni-kornjaca': [
    ['_5ryN-ShL8A', 'Touché Turtle - Mr. Robot (full episode)', 'Canal Desenhos Top Clássicos'],
    ['usmJXGzjXBY', 'Touché Turtle intro', 'hewey1972']
  ],
  'kralj-lavova': [['zKtSE0ChkYA', 'The Lion King (1994) - Scar & Mufasa [Hrvatski]', 'Imani']],
  'mala-sirena': [['VEd_zq5BXFQ', 'The Little Mermaid (1989) [Hrvatski]', 'Disney Hrvatska']],
  'mis-filip': [['Bb8sTTYcX-g', 'Philip Mouse - Episode 1', 'Rabe']],
  'orson-i-prijatelji': [['JlcjH_metd0', "Garfield and Friends - Unidentified Flying Orson - Orson's Farm", 'katula']],
  'pauk-nije-bauk': [['lrWtjlmnsFI', 'Spider (1991) - all episodes', 'Tooned - Animated Movies for Kids']],
  'srebrni-pastuh': [
    ['HuhuXJar6bw', 'The Silver Brumby - A Bothersome Nuisance (full episode)', 'The Silver Brumby'],
    ['KntqBmrwxCA', 'The Silver Brumby - intro', 'YouTube']
  ],
  'todor-i-fedor': [['svzfd34cokw', 'Piggeldy and Frederick - episode', 'YouTube']],
  'vitezovi-orijenta': [['Jxrt5-0OB_Q', 'Arabian Knights 01 - Joining of the Knights', 'NewWaveToons']]
};

export const isOpeningTitle = (title) => OPENING_PATTERN.test(title);

export function matchEntry(title, entries) {
  const normalizedTitle = ` ${normalize(title)} `;
  return entries
    .filter((entry) => normalizedTitle.includes(` ${normalize(entry.title)} `))
    .sort((a, b) => b.title.length - a.title.length)[0] ?? null;
}

function jsonAfter(html, marker) {
  const markerIndex = html.indexOf(marker);
  if (markerIndex < 0) throw new Error(`YouTube marker not found: ${marker}`);
  const start = html.indexOf('{', markerIndex);
  let depth = 0;
  let quoted = false;
  let escaped = false;

  for (let index = start; index < html.length; index++) {
    const character = html[index];
    if (quoted) {
      if (escaped) escaped = false;
      else if (character === '\\') escaped = true;
      else if (character === '"') quoted = false;
    } else if (character === '"') quoted = true;
    else if (character === '{') depth++;
    else if (character === '}' && --depth === 0) return JSON.parse(html.slice(start, index + 1));
  }

  throw new Error('YouTube data not found');
}

function walk(value, visit) {
  if (!value || typeof value !== 'object') return;
  visit(value);
  Object.values(value).forEach((child) => walk(child, visit));
}

function makeVideo({id, title, durationText = null, publishedText = null}, source) {
  if (!id || !title) return null;
  return {
    id,
    title,
    url: `https://www.youtube.com/watch?v=${id}`,
    embedUrl: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`,
    thumbnailUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    durationText,
    publishedText,
    source: {type: 'youtube', name: source.name, url: source.url}
  };
}

function curatedVideo([id, title, channel]) {
  const url = `https://www.youtube.com/watch?v=${id}`;
  return makeVideo({id, title}, {name: channel, url});
}

function sourceFromRenderer(renderer, fallback) {
  const run = renderer.longBylineText?.runs?.[0] ?? renderer.ownerText?.runs?.[0];
  if (!run?.text) return fallback;
  const relativeUrl = run.navigationEndpoint?.browseEndpoint?.canonicalBaseUrl
    ?? run.navigationEndpoint?.commandMetadata?.webCommandMetadata?.url;
  return {
    name: run.text,
    url: relativeUrl ? new URL(relativeUrl, 'https://www.youtube.com').href : fallback.url
  };
}

export function videoFromNode(node, source) {
  const renderer = node.videoRenderer ?? node.gridVideoRenderer;
  if (renderer?.videoId) {
    const title = renderer.title?.runs?.map((part) => part.text).join('') ?? renderer.title?.simpleText;
    return makeVideo({
      id: renderer.videoId,
      title,
      durationText: renderer.lengthText?.simpleText ?? null,
      publishedText: renderer.publishedTimeText?.simpleText ?? null
    }, sourceFromRenderer(renderer, source));
  }

  const lockup = node.lockupViewModel;
  if (!lockup || lockup.contentType !== 'LOCKUP_CONTENT_TYPE_VIDEO') return null;
  const metadata = lockup.metadata?.lockupMetadataViewModel;
  const badges = lockup.contentImage?.thumbnailViewModel?.overlays
    ?.flatMap((overlay) => overlay.thumbnailBottomOverlayViewModel?.badges ?? []) ?? [];
  const metadataParts = metadata?.metadata?.contentMetadataViewModel?.metadataRows
    ?.flatMap((row) => row.metadataParts ?? []) ?? [];

  return makeVideo({
    id: lockup.contentId,
    title: metadata?.title?.content,
    durationText: badges.map((badge) => badge.thumbnailBadgeViewModel?.text).find(Boolean) ?? null,
    publishedText: metadataParts
      .map((part) => part.text?.content)
      .find((text) => text && !/pregleda|views?/i.test(text)) ?? null
  }, source);
}

function durationSeconds(value) {
  if (!value) return 0;
  return value.split(':').reduce((total, part) => total * 60 + Number(part), 0);
}

function entryNames(entry) {
  if (SEARCH_NAMES[entry.slug]) return SEARCH_NAMES[entry.slug];
  const names = [entry.title];
  for (const match of (entry.content ?? '').matchAll(/Originaln(?:o ime|i naziv):\s*["“]?([^\n"”]+)/gi)) {
    const name = match[1].trim().replace(/[.,;:]$/, '');
    if (name && !names.includes(name)) names.push(name);
  }
  return names;
}

export function chooseVideo(videos, names, kind) {
  return videos
    .map((video, index) => {
      const title = video.title ?? '';
      const normalizedTitle = ` ${normalize(title)} `;
      const matchesName = names.some((name) => normalizedTitle.includes(` ${normalize(name)} `));
      if (!matchesName || REJECT_PATTERN.test(title)) return {...video, score: -Infinity};
      const opening = isOpeningTitle(title);
      if ((kind === 'opening') !== opening) return {...video, score: -Infinity};
      let score = 100 - index;
      if (video.source.url.includes(PREFERRED_CHANNEL)) score += 80;
      if (CROATIAN_PATTERN.test(title)) score += 35;
      if (kind === 'primary' && EPISODE_PATTERN.test(title)) score += 20;
      if (kind === 'primary' && durationSeconds(video.durationText) >= 180) score += 15;
      if (kind === 'opening' && durationSeconds(video.durationText) > 0 && durationSeconds(video.durationText) <= 180) score += 10;
      return {...video, score};
    })
    .filter((video) => Number.isFinite(video.score))
    .sort((a, b) => b.score - a.score)[0] ?? null;
}

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function fetchYoutube(url) {
  let lastError;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {'user-agent': 'Mozilla/5.0', 'accept-language': 'hr-HR,hr;q=0.9,en;q=0.7'},
        signal: AbortSignal.timeout(20_000)
      });
      if (!response.ok) throw new Error(`${response.status} ${url}`);
      return response.text();
    } catch (error) {
      lastError = error;
      if (attempt < 2) await wait(1_500 * (attempt + 1));
    }
  }
  throw lastError;
}

function videosFromHtml(html, source) {
  const data = jsonAfter(html, 'ytInitialData');
  const found = new Map();
  walk(data, (node) => {
    const video = videoFromNode(node, source);
    if (!video) return;
    const existing = found.get(video.id);
    const hasChannel = /youtube\.com\/@/.test(video.source.url);
    const existingHasChannel = existing && /youtube\.com\/@/.test(existing.source.url);
    if (!existing || (hasChannel && !existingHasChannel)) found.set(video.id, video);
  });
  return [...found.values()];
}

async function searchYoutube(query) {
  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  const source = {name: 'YouTube', url};
  return videosFromHtml(await fetchYoutube(url), source);
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const sourcesOnly = process.argv.includes('--sources-only');
  const searchOnly = process.argv.includes('--search-only');
  const requestedSlugs = new Set(process.argv.slice(2).filter((argument) => argument !== '--' && !argument.startsWith('--')));
  const sources = JSON.parse(await fs.readFile('scripts/youtube-sources.json'));
  const index = JSON.parse(await fs.readFile('public/api/v1/index.json'));
  const selectedEntries = requestedSlugs.size
    ? index.cartoons.filter((entry) => requestedSlugs.has(path.basename(entry.file, '.json')))
    : index.cartoons;
  const entries = await Promise.all(selectedEntries.map(async (entry) => {
    const filePath = path.join('public/api/v1', entry.file);
    return {...entry, path: filePath, data: JSON.parse(await fs.readFile(filePath))};
  }));
  let parsedTotal = 0;
  let matchedTotal = 0;
  const changed = new Set();

  for (const meta of entries) {
    const videos = meta.data.videos ?? [];
    const filtered = videos.filter((video) => !BLOCKED_VIDEO_IDS.has(video.id));
    if (filtered.length !== videos.length) {
      meta.data.videos = filtered;
      changed.add(meta.path);
    }
  }

  function mergeVideo(meta, video) {
    const videos = new Map((meta.data.videos ?? []).map((item) => [`${item.source.type}:${item.id}`, item]));
    const key = `${video.source.type}:${video.id}`;
    if (JSON.stringify(videos.get(key)) === JSON.stringify(video)) return false;
    videos.set(key, video);
    meta.data.videos = [...videos.values()];
    changed.add(meta.path);
    return true;
  }

  for (const meta of entries) {
    for (const definition of CURATED_VIDEOS[meta.data.slug] ?? []) {
      const video = curatedVideo(definition);
      if (mergeVideo(meta, video)) {
        matchedTotal++;
        console.log(`${dryRun ? 'Would add' : 'Found'} curated video for ${meta.title} ← ${video.title}`);
      }
    }
  }

  for (const source of searchOnly ? [] : sources) {
    const found = videosFromHtml(await fetchYoutube(source.url), source);

    parsedTotal += found.length;
    let sourceMatches = 0;
    for (const video of found) {
      const meta = matchEntry(video.title, entries);
      if (!meta) continue;
      sourceMatches++;
      matchedTotal++;
      if (mergeVideo(meta, video)) console.log(`${dryRun ? 'Would update' : 'Found'} ${meta.path} ← ${video.title}`);
    }

    console.log(`${source.name}: parsed ${found.length} videos, matched ${sourceMatches} archive entries.`);
  }

  if (!sourcesOnly) {
    for (const meta of entries) {
      const names = entryNames(meta.data);
      const videos = meta.data.videos ?? [];
      const needsPrimary = !videos.some((video) => !isOpeningTitle(video.title));
      const needsOpening = !videos.some((video) => isOpeningTitle(video.title));
      if (!needsPrimary && !needsOpening) continue;

      for (const kind of ['primary', 'opening']) {
        if ((kind === 'primary' && !needsPrimary) || (kind === 'opening' && !needsOpening)) continue;
        let selected = null;
        for (const name of names) {
          const query = kind === 'opening'
            ? `"${name}" uvodna špica intro opening`
            : `"${name}" crtani hrvatski sinkronizirano`;
          try {
            const found = await searchYoutube(query);
            parsedTotal += found.length;
            selected = chooseVideo(found, names, kind);
          } catch (error) {
            console.warn(`Search failed for ${meta.title} (${kind}): ${error.message}`);
          }
          await wait(650);
          if (selected) break;
        }
        if (!selected) continue;
        delete selected.score;
        if (mergeVideo(meta, selected)) {
          matchedTotal++;
          console.log(`${dryRun ? 'Would add' : 'Found'} ${kind} for ${meta.title} ← ${selected.title} [${selected.source.name}]`);
        }
      }
    }
  }

  if (!dryRun) {
    for (const meta of entries.filter((entry) => changed.has(entry.path))) {
      await fs.writeFile(meta.path, `${JSON.stringify(meta.data, null, 2)}\n`);
    }
  }

  console.log(`${dryRun ? 'Dry run complete' : 'Sync complete'}: parsed ${parsedTotal}, matched ${matchedTotal}, ${dryRun ? 'would update' : 'updated'} ${changed.size} cartoon entries.`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
