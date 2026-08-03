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

export function videoFromNode(node, source) {
  const renderer = node.videoRenderer ?? node.gridVideoRenderer;
  if (renderer?.videoId) {
    const title = renderer.title?.runs?.map((part) => part.text).join('') ?? renderer.title?.simpleText;
    return makeVideo({
      id: renderer.videoId,
      title,
      durationText: renderer.lengthText?.simpleText ?? null,
      publishedText: renderer.publishedTimeText?.simpleText ?? null
    }, source);
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

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const sources = JSON.parse(await fs.readFile('scripts/youtube-sources.json'));
  const index = JSON.parse(await fs.readFile('public/api/v1/index.json'));
  const entries = index.cartoons.map((entry) => ({...entry, path: path.join('public/api/v1', entry.file)}));
  let parsedTotal = 0;
  let matchedTotal = 0;
  let updatedTotal = 0;

  for (const source of sources) {
    const response = await fetch(source.url, {headers: {'user-agent': 'Mozilla/5.0'}});
    if (!response.ok) throw new Error(`${response.status} ${source.url}`);
    const data = jsonAfter(await response.text(), 'ytInitialData');
    const found = new Map();
    walk(data, (node) => {
      const video = videoFromNode(node, source);
      if (video) found.set(video.id, video);
    });

    parsedTotal += found.size;
    let sourceMatches = 0;
    for (const video of found.values()) {
      const meta = matchEntry(video.title, entries);
      if (!meta) continue;
      sourceMatches++;
      matchedTotal++;

      const entry = JSON.parse(await fs.readFile(meta.path));
      const videos = new Map((entry.videos ?? []).map((item) => [`${item.source.type}:${item.id}`, item]));
      const key = `${video.source.type}:${video.id}`;
      const changed = JSON.stringify(videos.get(key)) !== JSON.stringify(video);
      videos.set(key, video);
      if (!changed) continue;

      updatedTotal++;
      entry.videos = [...videos.values()];
      if (!dryRun) await fs.writeFile(meta.path, `${JSON.stringify(entry, null, 2)}\n`);
      console.log(`${dryRun ? 'Would update' : 'Updated'} ${meta.path} ← ${video.title}`);
    }

    console.log(`${source.name}: parsed ${found.size} videos, matched ${sourceMatches} archive entries.`);
  }

  console.log(`${dryRun ? 'Dry run complete' : 'Sync complete'}: parsed ${parsedTotal}, matched ${matchedTotal}, ${dryRun ? 'would update' : 'updated'} ${updatedTotal}.`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
