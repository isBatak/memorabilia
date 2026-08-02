import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';
import * as cheerio from 'cheerio';
import pLimit from 'p-limit';
import slugify from 'slugify';

const EXECUTED_DIRECTLY = process.argv[1]
  && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
const START_URL = process.env.START_URL
  ?? (EXECUTED_DIRECTLY ? process.argv[2] : undefined)
  ?? 'https://web.archive.org/web/20121107090850/http://memorabilia.blog.hr/2007/01/1622062333/bus-bus.html';
const DEFAULT_OUTPUT_DIR = process.env.DRY_RUN === '1' ? '.tmp/api' : 'public/api';
const OUTPUT_DIR = path.resolve(process.env.OUTPUT_DIR ?? (EXECUTED_DIRECTLY ? process.argv[3] : undefined) ?? DEFAULT_OUTPUT_DIR);
const CONCURRENCY = Number(process.env.CONCURRENCY ?? 3);
const DELAY_MS = Number(process.env.DELAY_MS ?? 800);
const MAX_RETRIES = Number(process.env.MAX_RETRIES ?? 4);
const USER_AGENT = process.env.USER_AGENT ?? 'MemorabiliaArchiveExporter/1.0 (personal archival project)';
const DEBUG = process.env.DEBUG === '1';

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const debug = (...args) => DEBUG && console.log('[debug]', ...args);
const clean = value => String(value ?? '').replace(/\u00a0/g, ' ').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
const filename = title => slugify(title, { lower: true, strict: true, locale: 'hr' }) || 'untitled';
const CATEGORIES = {
  series: { heading: /DRAGE\s+SERIJE/i, type: 'series-post' },
  cartoons: { heading: /DRAGI\s+CRTI/i, type: 'cartoon-post' },
  movies: { heading: /DRAGI\s+FILMOVI/i, type: 'movie-post' }
};

function toRawArchiveUrl(url) {
  const parsed = new URL(url, START_URL);
  if (parsed.hostname !== 'web.archive.org') return parsed.href;
  const match = parsed.pathname.match(/^\/web\/(\d+)(?:[a-z_]+)?\/(https?:\/\/.*)$/i);
  if (!match) return parsed.href;
  return `https://web.archive.org/web/${match[1]}id_/${match[2]}${parsed.search}`;
}

function canonicalOriginalUrl(url) {
  const decoded = decodeURIComponent(new URL(url, START_URL).href);
  const match = decoded.match(/\/web\/\d+(?:[a-z_]+)?\/(https?:\/\/.*)$/i);
  return match ? match[1] : decoded;
}

function archiveUrlFor(href, baseUrl) {
  if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:')) return null;
  const absolute = new URL(href, baseUrl).href;
  if (new URL(absolute).hostname === 'web.archive.org') return absolute;
  const timestamp = new URL(baseUrl).pathname.match(/^\/web\/(\d+)/)?.[1] ?? '20121107090850';
  return `https://web.archive.org/web/${timestamp}/${absolute}`;
}

function decodeHtml(buffer, contentType = '') {
  const bytes = Buffer.from(buffer);
  const headerCharset = contentType.match(/charset\s*=\s*["']?([^;"'\s]+)/i)?.[1];
  const beginning = bytes.subarray(0, 8192).toString('latin1');
  const metaCharset = beginning.match(/<meta[^>]+charset\s*=\s*["']?([^;"'\s/>]+)/i)?.[1];
  const encoding = (headerCharset ?? metaCharset ?? 'utf-8').toLowerCase();
  try {
    return new TextDecoder(encoding).decode(bytes);
  } catch {
    console.warn(`Unsupported HTML charset ${encoding}; falling back to UTF-8.`);
    return new TextDecoder('utf-8').decode(bytes);
  }
}

export async function fetchHtml(url) {
  let lastError;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(toRawArchiveUrl(url), {
        redirect: 'follow',
        headers: { 'user-agent': USER_AGENT, accept: 'text/html,application/xhtml+xml' }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);
      const html = decodeHtml(await response.arrayBuffer(), response.headers.get('content-type') ?? '');
      debug('Fetched', response.url, response.status, `${html.length} bytes`);
      if (!html || html.length < 500) throw new Error('Archive returned an unexpectedly small document');
      await sleep(DELAY_MS);
      return { html, finalUrl: response.url.replace(/id_\//, '/') };
    } catch (error) {
      lastError = error;
      const wait = DELAY_MS * 2 ** (attempt - 1);
      console.warn(`Fetch failed (${attempt}/${MAX_RETRIES}) ${url}: ${error.message}`);
      await sleep(wait);
    }
  }
  throw lastError;
}

function removeWaybackChrome($) {
  $('#wm-ipp-base, #wm-ipp-print, .wb-autocomplete-suggestions').remove();
  $('script[src*="archive.org"], link[href*="archive.org/_static/"]').remove();
}

function findSidebarSection($, headingPattern) {
  const heading = $('h1,h2,h3,h4,strong,b').filter((_, el) => headingPattern.test(clean($(el).text()))).first();
  if (!heading.length) return [];

  const result = [];
  let current = { titleParts: [], href: null };
  const appendTitle = value => {
    const text = clean(value);
    if (text) current.titleParts.push(text);
  };
  const flush = () => {
    const title = clean(current.titleParts.join(' '));
    if (title && !/^image$/i.test(title)) result.push({ title, href: current.href });
    current = { titleParts: [], href: null };
  };
  const visit = node => {
    const $node = $(node);
    if (node.type === 'text') return appendTitle($node.text());
    if ($node.is('br')) return flush();
    if ($node.is('img')) return;
    if ($node.is('a')) {
      appendTitle($node.text());
      current.href ??= $node.attr('href') ?? null;
      return;
    }
    $node.contents().each((_, child) => visit(child));
  };

  let node = heading[0];
  while ((node = node.nextSibling)) {
    const $node = $(node);
    if ($node.is('h1,h2,h3,h4')) break;
    visit(node);
  }
  flush();
  return result;
}

export function parseNavigation(html, pageUrl) {
  const $ = cheerio.load(html);
  removeWaybackChrome($);
  return Object.fromEntries(Object.entries(CATEGORIES).map(([category, config]) => {
    const seen = new Set();
    const entries = findSidebarSection($, config.heading)
      .map(item => ({
        title: item.title,
        archiveUrl: item.href ? archiveUrlFor(item.href, pageUrl) : null,
        originalUrl: item.href ? canonicalOriginalUrl(item.href) : null
      }))
      .filter(item => {
        const key = item.originalUrl ?? item.title.toLocaleLowerCase('hr');
        return !seen.has(key) && seen.add(key);
      });
    debug(`Found ${entries.length} ${category} entries`);
    return [category, entries];
  }));
}

function inferMainContainer($) {
  const title = $('h1,h2,h3').filter((_, el) => /^\s*["“]?.+["”]?\s*$/.test(clean($(el).text()))).first();
  if (!title.length) return $('body');
  let parent = title.parent();
  while (parent.length && parent[0].tagName !== 'body') {
    const text = clean(parent.text());
    if (/\d{2}\.\d{2}\.\d{4}\.\s+u\s+\d{1,2}:\d{2}/.test(text) && text.length > 250) return parent;
    parent = parent.parent();
  }
  return title.parent();
}

function parseMetadata(lines) {
  const metadata = {};
  const remaining = [];
  for (const line of lines) {
    const match = line.match(/^([^:]{2,40}):\s*(.+)$/);
    if (match && !/^https?$/i.test(match[1])) metadata[clean(match[1])] = clean(match[2]);
    else remaining.push(line);
  }
  return { metadata, remaining };
}

export function parseArticle(html, requestedUrl, finalUrl, category) {
  const $ = cheerio.load(html);
  removeWaybackChrome($);
  $('script,style,noscript,iframe,form').remove();

  const titleEl = $('h1,h2,h3').filter((_, el) => {
    const t = clean($(el).text());
    return t && !/^Memorabilia$/i.test(t) && !/DRAGI|Opis bloga|Zahvale/i.test(t);
  }).first();
  const title = clean(titleEl.text()).replace(/^["“]|["”]$/g, '') || 'Untitled';
  const container = inferMainContainer($).clone();

  container.find('h1,h2,h3,h4').each((_, el) => {
    if (/Opis bloga|DRAGE SERIJE|DRAGI CRTIĆI|DRAGI FILMOVI|Zahvale/i.test(clean($(el).text()))) {
      $(el).nextAll().remove();
      $(el).remove();
    }
  });

  const fullText = clean(container.text());
  const dateMatch = fullText.match(/(\d{2}\.\d{2}\.\d{4}\.)\s+u\s+(\d{1,2}:\d{2})/);
  const publishedAt = dateMatch ? `${dateMatch[1]} ${dateMatch[2]}` : null;

  const links = [];
  container.find('a[href]').each((_, a) => {
    const text = clean($(a).text());
    const href = $(a).attr('href');
    if (!href || !text || /Komentar|Print|Arhiva/i.test(text)) return;
    links.push({ text, url: canonicalOriginalUrl(new URL(href, finalUrl).href), archivedUrl: archiveUrlFor(href, finalUrl) });
  });

  const images = [];
  container.find('img[src]').each((_, img) => {
    const src = $(img).attr('src');
    if (!src) return;
    images.push({
      alt: clean($(img).attr('alt')) || null,
      url: canonicalOriginalUrl(new URL(src, finalUrl).href),
      archivedUrl: archiveUrlFor(src, finalUrl)
    });
  });

  const paragraphs = container.find('p,div,li').map((_, el) => clean($(el).clone().children('div,p,ul,ol').remove().end().text())).get()
    .filter(text => text.length > 1 && !/^Memorabilia$/i.test(text) && !/Komentara|Print|Arhiva|Opis bloga/i.test(text));

  let contentLines = [...new Set(paragraphs)];
  if (!contentLines.length) contentLines = fullText.split('\n').map(clean).filter(Boolean);
  const cutoff = contentLines.findIndex(line => /\d{2}\.\d{2}\.\d{4}\.\s+u\s+\d{1,2}:\d{2}/.test(line));
  if (cutoff >= 0) contentLines = contentLines.slice(0, cutoff);
  contentLines = contentLines.filter(line => line !== title);

  const { metadata, remaining } = parseMetadata(contentLines.slice(0, 12));
  const metadataCount = Object.keys(metadata).length;
  const body = metadataCount ? [...remaining, ...contentLines.slice(12)] : contentLines;

  return {
    schemaVersion: 1,
    type: CATEGORIES[category].type,
    category,
    title,
    slug: filename(title),
    publishedAt,
    metadata,
    content: clean(body.join('\n\n')),
    paragraphs: body,
    links,
    images,
    source: {
      requestedArchiveUrl: requestedUrl,
      resolvedArchiveUrl: finalUrl,
      originalUrl: canonicalOriginalUrl(finalUrl),
      scrapedAt: new Date().toISOString()
    },
    rawArticleHtml: clean(container.html())
  };
}

function titleOnlyArticle(item, category) {
  return {
    schemaVersion: 1,
    type: CATEGORIES[category].type,
    category,
    title: item.title,
    slug: filename(item.title),
    publishedAt: null,
    metadata: {},
    content: '',
    paragraphs: [],
    links: [],
    images: [],
    source: {
      requestedArchiveUrl: null,
      resolvedArchiveUrl: null,
      originalUrl: null,
      scrapedAt: new Date().toISOString()
    },
    rawArticleHtml: null
  };
}

async function main() {
  console.log(`Output: ${OUTPUT_DIR}`);
  await fs.rm(OUTPUT_DIR, { recursive: true, force: true });
  await Promise.all(Object.keys(CATEGORIES).map(category => fs.mkdir(path.join(OUTPUT_DIR, category), { recursive: true })));
  const start = await fetchHtml(START_URL);
  const navigation = parseNavigation(start.html, start.finalUrl);
  const discovered = Object.values(navigation).reduce((total, entries) => total + entries.length, 0);
  console.log(`Found ${discovered} entries: ${Object.entries(navigation).map(([category, entries]) => `${entries.length} ${category}`).join(', ')}.`);

  await fs.writeFile(path.join(OUTPUT_DIR, 'navigation.json'), JSON.stringify({
    schemaVersion: 1,
    source: START_URL,
    generatedAt: new Date().toISOString(),
    ...navigation
  }, null, 2));

  const limit = pLimit(CONCURRENCY);
  let current = 0;
  const scrapeCategory = async (category, entries) => Promise.all(entries.map(item => limit(async () => {
    current += 1;
    console.log(`[${current}/${discovered}] [${category}] ${item.title}`);
    try {
      const hasSourcePage = Boolean(item.archiveUrl);
      const page = hasSourcePage
        ? (item.originalUrl === canonicalOriginalUrl(start.finalUrl) ? start : await fetchHtml(item.archiveUrl))
        : null;
      const article = page
        ? parseArticle(page.html, item.archiveUrl, page.finalUrl, category)
        : titleOnlyArticle(item, category);
      const file = `${article.slug}.json`;
      await fs.writeFile(path.join(OUTPUT_DIR, category, file), JSON.stringify(article, null, 2));
      return { ...item, status: 'ok', contentStatus: hasSourcePage ? 'scraped' : 'title-only', file: `${category}/${file}`, title: article.title };
    } catch (error) {
      return { ...item, status: 'error', error: error.message };
    }
  })));
  const results = Object.fromEntries(await Promise.all(Object.entries(navigation).map(async ([category, entries]) => [
    category,
    await scrapeCategory(category, entries)
  ])));

  const allResults = Object.values(results).flat();
  const successful = allResults.filter(x => x.status === 'ok');
  const failed = allResults.filter(x => x.status === 'error');
  await fs.writeFile(path.join(OUTPUT_DIR, 'index.json'), JSON.stringify({
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    counts: {
      discovered: allResults.length,
      successful: successful.length,
      failed: failed.length,
      byCategory: Object.fromEntries(Object.entries(results).map(([category, entries]) => [category, entries.length]))
    },
    ...results
  }, null, 2));
  console.log(`Done: ${successful.length} exported, ${failed.length} failed.`);
  if (failed.length) process.exitCode = 2;
}

if (EXECUTED_DIRECTLY) {
  main().catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
}
