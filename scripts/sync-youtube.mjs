#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const API_ROOT = path.resolve('public/api');
const DEFAULT_SOURCES = path.resolve('scripts/youtube-sources.json');
const USER_AGENT = 'Mozilla/5.0 (compatible; MemorabiliaArchive/1.0; +https://github.com/)';

function args(argv) {
  const result = {sources: [], config: DEFAULT_SOURCES, dryRun: false};
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--source') result.sources.push({url: argv[++index]});
    else if (argv[index] === '--config') result.config = path.resolve(argv[++index]);
    else if (argv[index] === '--dry-run') result.dryRun = true;
    else if (argv[index] === '--help') result.help = true;
    else throw new Error(`Unknown option: ${argv[index]}`);
  }
  return result;
}

function jsonAfter(html, marker) {
  const markerIndex = html.indexOf(marker);
  if (markerIndex < 0) return null;
  const start = html.indexOf('{', markerIndex + marker.length);
  if (start < 0) return null;
  let depth = 0;
  let quoted = false;
  let escaped = false;
  for (let index = start; index < html.length; index += 1) {
    const char = html[index];
    if (quoted) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === '"') quoted = false;
    } else if (char === '"') quoted = true;
    else if (char === '{') depth += 1;
    else if (char === '}' && --depth === 0) return JSON.parse(html.slice(start, index + 1));
  }
  return null;
}

function text(value) {
  return value?.simpleText ?? value?.runs?.map((run) => run.text).join('') ?? null;
}

function walk(value, visit) {
  if (!value || typeof value !== 'object') return;
  visit(value);
  for (const child of Object.values(value)) walk(child, visit);
}

function videoFromRenderer(renderer, source) {
  const videoId = renderer.videoId;
  const title = text(renderer.title);
  if (!videoId || !title) return null;
  const thumbnails = renderer.thumbnail?.thumbnails ?? [];
  return {
    id: videoId,
    title,
    url: `https://www.youtube.com/watch?v=${videoId}`,
    embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`,
    thumbnailUrl: thumbnails.at(-1)?.url ?? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    durationText: text(renderer.lengthText),
    publishedText: text(renderer.publishedTimeText),
    source: {type: 'youtube', name: source.name ?? null, url: source.url}
  };
}

function extract(data, source) {
  const videos = [];
  const continuations = new Set();
  walk(data, (node) => {
    const renderer = node.videoRenderer ?? node.gridVideoRenderer;
    if (renderer) {
      const video = videoFromRenderer(renderer, source);
      if (video) videos.push(video);
    }
    const token = node.continuationCommand?.token ?? node.continuationEndpoint?.continuationCommand?.token;
    if (token) continuations.add(token);
  });
  return {videos, continuations: [...continuations]};
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, {...options, headers: {'user-agent': USER_AGENT, ...options.headers}});
  if (!response.ok) throw new Error(`${response.status} ${response.statusText} from ${url}`);
  return response.json();
}

async function scanSource(source) {
  const response = await fetch(source.url, {headers: {'user-agent': USER_AGENT, 'accept-language': 'en'}});
  if (!response.ok) throw new Error(`${response.status} ${response.statusText} from ${source.url}`);
  const html = await response.text();
  const initialData = jsonAfter(html, 'var ytInitialData =') ?? jsonAfter(html, 'ytInitialData =');
  if (!initialData) throw new Error(`YouTube data was not found at ${source.url}`);
  const apiKey = html.match(/"INNERTUBE_API_KEY":"([^"]+)"/)?.[1];
  const clientVersion = html.match(/"INNERTUBE_CLIENT_VERSION":"([^"]+)"/)?.[1];
  const found = extract(initialData, source);
  const videos = [...found.videos];
  const queue = [...found.continuations];
  const seen = new Set(queue);
  while (queue.length && apiKey && clientVersion) {
    const continuation = queue.shift();
    const data = await requestJson(`https://www.youtube.com/youtubei/v1/browse?key=${apiKey}`, {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify({context: {client: {clientName: 'WEB', clientVersion}}, continuation})
    });
    const page = extract(data, source);
    videos.push(...page.videos);
    for (const token of page.continuations) if (!seen.has(token)) { seen.add(token); queue.push(token); }
  }
  return [...new Map(videos.map((video) => [`${video.source.type}:${video.id}`, video])).values()];
}

export function normalize(value) {
  return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\b(crtani film|cartoon|epizoda|episode|full)\b/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim();
}

export function matchEntry(videoTitle, entries) {
  const candidate = ` ${normalize(videoTitle)} `;
  return entries
    .map((entry) => ({entry, normalized: normalize(entry.title)}))
    .filter(({normalized}) => normalized.length >= 3 && candidate.includes(` ${normalized} `))
    .sort((a, b) => b.normalized.length - a.normalized.length)[0]?.entry ?? null;
}

export function linkMatchesVideo(link, video) {
  if (!link?.url) return false;
  if (link.url === video.url) return true;
  if (video.source.type !== 'youtube') return false;
  const linkedId = link.url.match(/(?:youtu\.be\/|[?&]v=)([\w-]{6,})/)?.[1];
  return linkedId === video.id;
}

async function main() {
  const options = args(process.argv.slice(2));
  if (options.help) {
    console.log('Usage: pnpm youtube:sync [--config FILE] [--source URL ...] [--dry-run]');
    return;
  }
  const configured = JSON.parse(await fs.readFile(options.config, 'utf8'));
  const sources = [...configured, ...options.sources];
  if (!sources.length) throw new Error('Add at least one YouTube source.');
  const index = JSON.parse(await fs.readFile(path.join(API_ROOT, 'index.json'), 'utf8'));
  const entries = (index.cartoons ?? []).filter((item) => item.file).map((item) => ({...item, filePath: path.join(API_ROOT, item.file)}));
  const matches = new Map();
  for (const source of sources) {
    console.log(`Scanning ${source.url} …`);
    for (const video of await scanSource(source)) {
      const entry = matchEntry(video.title, entries);
      if (entry) matches.set(entry.filePath, [...(matches.get(entry.filePath) ?? []), video]);
    }
  }
  let changed = 0;
  for (const [file, videos] of matches) {
    const entry = JSON.parse(await fs.readFile(file, 'utf8'));
    const mergedVideos = [...new Map([...(entry.videos ?? []), ...videos].map((video) => [`${video.source.type}:${video.id}`, video])).values()];
    const links = (entry.links ?? []).filter((link) => !mergedVideos.some((video) => linkMatchesVideo(link, video)));
    if (JSON.stringify(entry.videos ?? []) === JSON.stringify(mergedVideos) && JSON.stringify(entry.links ?? []) === JSON.stringify(links)) continue;
    changed += 1;
    if (!options.dryRun) await fs.writeFile(file, `${JSON.stringify({...entry, schemaVersion: 2, links, videos: mergedVideos}, null, 2)}\n`);
    console.log(`${options.dryRun ? 'Would update' : 'Updated'} ${path.relative(process.cwd(), file)} (${mergedVideos.length} videos)`);
  }
  console.log(`${options.dryRun ? 'Would update' : 'Updated'} ${changed} cartoon entries.`);
}

if (import.meta.url === `file://${process.argv[1]}`) main().catch((error) => { console.error(`YouTube sync failed: ${error.message}`); process.exitCode = 1; });
