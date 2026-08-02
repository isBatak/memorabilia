import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import pLimit from 'p-limit';

const API_DIR = path.resolve(process.env.API_DIR ?? 'public/api');
const PUBLIC_DIR = path.resolve(process.env.PUBLIC_DIR ?? 'public');
const CONCURRENCY = Number(process.env.IMAGE_CONCURRENCY ?? 6);
const TIMEOUT_MS = Number(process.env.IMAGE_TIMEOUT_MS ?? 15000);
const USER_AGENT = process.env.USER_AGENT ?? 'MemorabiliaArchiveExporter/1.0 (personal archival project)';
const DEBUG = process.env.DEBUG === '1';
const PRUNE_EMOJIS = process.argv.includes('--prune-emojis');
const limit = pLimit(CONCURRENCY);
const downloads = new Map();
const filenamesBySlug = new Map();

const debug = (...args) => DEBUG && console.log('[debug]', ...args);

function rawArchiveUrl(url) {
  const parsed = new URL(url);
  if (parsed.hostname !== 'web.archive.org') return parsed.href;
  const match = parsed.pathname.match(/^\/web\/(\d+)(?:[a-z_]+)?\/(https?:\/\/.*)$/i);
  if (!match) return parsed.href;
  return `https://web.archive.org/web/${match[1]}id_/${match[2]}${parsed.search}`;
}

function detectedExtension(buffer, contentType) {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return '.jpg';
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return '.png';
  if (buffer.length >= 6 && /^GIF8[79]a$/.test(buffer.subarray(0, 6).toString('ascii'))) return '.gif';
  if (buffer.length >= 12 && buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP') return '.webp';
  if (buffer.length >= 4 && buffer[0] === 0x00 && buffer[1] === 0x00 && buffer[2] === 0x01 && buffer[3] === 0x00) return '.ico';
  if (buffer.length >= 2 && buffer.subarray(0, 2).toString('ascii') === 'BM') return '.bmp';

  const beginning = buffer.subarray(0, 1024).toString('utf8').replace(/^\uFEFF/, '').trimStart();
  if (contentType === 'image/svg+xml' && /^(?:<\?xml[^>]*>\s*)?<svg[\s>]/i.test(beginning)) return '.svg';
  return null;
}

function gifDimensions(buffer) {
  if (buffer.length < 10 || !/^GIF8[79]a$/.test(buffer.subarray(0, 6).toString('ascii'))) return null;
  return {
    width: buffer.readUInt16LE(6),
    height: buffer.readUInt16LE(8)
  };
}

function isEmojiGif(buffer) {
  const dimensions = gifDimensions(buffer);
  return Boolean(dimensions && dimensions.width <= 64 && dimensions.height <= 64);
}

async function fetchImage(url) {
  let requestUrl;
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) return null;
    requestUrl = rawArchiveUrl(parsed.href);
  } catch {
    return null;
  }

  if (!downloads.has(requestUrl)) {
    downloads.set(requestUrl, limit(async () => {
      try {
        const response = await fetch(requestUrl, {
          redirect: 'follow',
          signal: AbortSignal.timeout(TIMEOUT_MS),
          headers: { 'user-agent': USER_AGENT, accept: 'image/*' }
        });
        if (!response.ok) {
          debug(`HTTP ${response.status}`, requestUrl);
          return null;
        }

        const buffer = Buffer.from(await response.arrayBuffer());
        const contentType = (response.headers.get('content-type') ?? '').split(';', 1)[0].toLowerCase();
        const extension = detectedExtension(buffer, contentType);
        if (!extension) {
          debug('Response is not a recognized image', requestUrl, contentType);
          return null;
        }
        if (extension === '.gif' && isEmojiGif(buffer)) {
          debug('Filtering emoji GIF', requestUrl);
          return { filtered: true };
        }
        return { buffer, extension };
      } catch (error) {
        debug('Download failed', requestUrl, error.message);
        return null;
      }
    }));
  }
  return downloads.get(requestUrl);
}

function imageFilename(image, extension, index) {
  let basename = '';
  try {
    basename = decodeURIComponent(path.basename(new URL(image.url ?? image.archivedUrl).pathname));
  } catch {
    // Fall back to a numbered filename below.
  }
  const stem = path.basename(basename, path.extname(basename))
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^[.-]+|[.-]+$/g, '');
  return `${stem || `image-${index + 1}`}${extension}`;
}

function uniqueFilename(preferred, sourceKey, namesBySource, usedNames) {
  if (namesBySource.has(sourceKey)) return namesBySource.get(sourceKey);
  const extension = path.extname(preferred);
  const stem = path.basename(preferred, extension);
  let candidate = preferred;
  let suffix = 2;
  while (usedNames.has(candidate)) candidate = `${stem}-${suffix++}${extension}`;
  namesBySource.set(sourceKey, candidate);
  usedNames.add(candidate);
  return candidate;
}

async function processArticle(file) {
  const articlePath = path.join(API_DIR, file);
  const article = JSON.parse(await fs.readFile(articlePath, 'utf8'));
  if (!Array.isArray(article.images) || article.images.length === 0) return { checked: 0, saved: 0, removed: 0 };

  const safeSlug = String(article.slug ?? path.basename(file, '.json'))
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^[.-]+|[.-]+$/g, '') || 'untitled';
  const outputDir = path.join(PUBLIC_DIR, 'images', safeSlug);
  const localImages = [];
  if (!filenamesBySlug.has(safeSlug)) filenamesBySlug.set(safeSlug, { namesBySource: new Map(), usedNames: new Set() });
  const { namesBySource, usedNames } = filenamesBySlug.get(safeSlug);

  const checkedImages = await Promise.all(article.images.map(async image => {
    const candidates = [...new Set([image.url, image.archivedUrl].filter(Boolean))];
    for (const candidate of candidates) {
      const downloaded = await fetchImage(candidate);
      if (downloaded?.filtered) return { image, downloaded: null, filtered: true };
      if (downloaded) return { image, downloaded, filtered: false };
    }
    return { image, downloaded: null, filtered: false };
  }));

  for (const [index, { image, downloaded, filtered }] of checkedImages.entries()) {
    if (filtered) {
      if (image.localUrl) {
        const localPath = path.resolve(path.dirname(articlePath), image.localUrl);
        if (localPath.startsWith(`${PUBLIC_DIR}${path.sep}`)) await fs.rm(localPath, { force: true });
      }
      continue;
    }
    if (!downloaded) {
      debug('Removing unavailable image', article.slug, image.url ?? image.archivedUrl);
      continue;
    }

    const sourceKey = `${file}\0${image.url ?? image.archivedUrl ?? index}`;
    const preferred = imageFilename(image, downloaded.extension, index);
    const filename = uniqueFilename(preferred, sourceKey, namesBySource, usedNames);
    await fs.mkdir(outputDir, { recursive: true });
    await fs.writeFile(path.join(outputDir, filename), downloaded.buffer);
    localImages.push({ ...image, localUrl: `../../images/${safeSlug}/${filename}` });
  }

  const removed = article.images.length - localImages.length;
  article.images = localImages;
  await fs.writeFile(articlePath, JSON.stringify(article, null, 2));
  return { checked: localImages.length + removed, saved: localImages.length, removed };
}

async function pruneArticleEmojiGifs(file) {
  const articlePath = path.join(API_DIR, file);
  const article = JSON.parse(await fs.readFile(articlePath, 'utf8'));
  if (!Array.isArray(article.images) || article.images.length === 0) return { checked: 0, removed: 0 };

  const kept = [];
  let removed = 0;
  for (const image of article.images) {
    if (!image.localUrl) {
      kept.push(image);
      continue;
    }
    const localPath = path.resolve(path.dirname(articlePath), image.localUrl);
    if (!localPath.startsWith(`${PUBLIC_DIR}${path.sep}`)) {
      kept.push(image);
      continue;
    }
    try {
      const buffer = await fs.readFile(localPath);
      if (!isEmojiGif(buffer)) {
        kept.push(image);
        continue;
      }
      await fs.rm(localPath);
      removed += 1;
      debug('Removed emoji GIF', path.relative(process.cwd(), localPath));
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      kept.push(image);
    }
  }

  if (removed) {
    article.images = kept;
    await fs.writeFile(articlePath, JSON.stringify(article, null, 2));
  }
  return { checked: article.images.length, removed };
}

async function main() {
  const index = JSON.parse(await fs.readFile(path.join(API_DIR, 'index.json'), 'utf8'));
  const files = [...new Set(Object.values(index)
    .filter(Array.isArray)
    .flat()
    .filter(item => item?.status === 'ok' && typeof item.file === 'string')
    .map(item => item.file))];

  if (PRUNE_EMOJIS) {
    let removed = 0;
    for (const file of files) {
      const result = await pruneArticleEmojiGifs(file);
      removed += result.removed;
    }
    console.log(`Removed ${removed} emoji GIFs and their API image references.`);
    return;
  }

  const totals = { checked: 0, saved: 0, removed: 0 };
  for (const [index, file] of files.entries()) {
    console.log(`[${index + 1}/${files.length}] ${file}`);
    const result = await processArticle(file);
    for (const key of Object.keys(totals)) totals[key] += result[key];
  }
  console.log(`Done: ${totals.checked} images checked, ${totals.saved} saved, ${totals.removed} unavailable entries removed.`);
}

main().catch(error => {
  console.error(`Image download failed: ${error.message}`);
  process.exitCode = 1;
});
