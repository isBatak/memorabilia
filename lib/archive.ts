import fs from 'node:fs';
import path from 'node:path';

export const categories = ['cartoons', 'series', 'movies'] as const;
export type Category = (typeof categories)[number];

type IndexItem = {
  title: string;
  file: string;
  contentStatus: 'scraped' | 'title-only';
};

export type ArchiveImage = {
  alt: string | null;
  localUrl: string | null;
  archivedUrl: string | null;
};
export type ArchiveVideo = {id: string; title: string; url: string; embedUrl: string; thumbnailUrl: string; durationText: string | null; publishedText: string | null; source: {type: string; name: string | null; url: string}};

export type ArchiveEntry = {
  title: string;
  slug: string;
  category: Category;
  publishedAt: string | null;
  content: string;
  paragraphs: string[];
  images: ArchiveImage[];
  videos?: ArchiveVideo[];
  source?: {resolvedArchiveUrl?: string | null; originalUrl?: string | null};
  contentStatus?: 'scraped' | 'title-only';
};

export type ArchiveCard = {
  title: string;
  slug: string;
  category: Category;
  contentStatus: 'scraped' | 'title-only';
  image: string | null;
  summary: string;
};

const apiRoot = path.join(process.cwd(), 'public', 'api', 'v1');

function readJson<T>(file: string): T {
  return JSON.parse(fs.readFileSync(file, 'utf8')) as T;
}

export function getAllVideoParams() {
  return getAllParams().flatMap(({category, slug}) => (getEntry(category, slug)?.videos ?? []).map((video) => ({category, slug, source: video.source.type, videoId: video.id})));
}

function publicImage(localUrl?: string | null) {
  if (!localUrl) return null;
  return `/${localUrl.replace(/^(?:\.\.\/)+/, '')}`;
}

function excerpt(entry: ArchiveEntry) {
  const text = entry.paragraphs?.[0] || entry.content || '';
  const cleaned = text.replace(/\s+/g, ' ').replace(/^[^\n]{0,180}(?=\n\n)/, '').trim();
  return cleaned.length > 190 ? `${cleaned.slice(0, 187).trim()}…` : cleaned;
}

export function getArchiveIndex() {
  const index = readJson<Record<Category, IndexItem[]> & {counts: {byCategory: Record<Category, number>}}>(
    path.join(apiRoot, 'index.json')
  );

  const collections = Object.fromEntries(
    categories.map((category) => [
      category,
      index[category].map((item): ArchiveCard => {
        const entry = readJson<ArchiveEntry>(path.join(apiRoot, item.file));
        return {
          title: item.title,
          slug: entry.slug || path.basename(item.file, '.json'),
          category,
          contentStatus: item.contentStatus,
          image: publicImage(entry.images?.find((image) => image.localUrl)?.localUrl),
          summary: excerpt(entry)
        };
      })
    ])
  ) as Record<Category, ArchiveCard[]>;

  const imageCount = fs.readdirSync(path.join(process.cwd(), 'public', 'images'), {recursive: true})
    .filter((file) => /\.(jpe?g|png|gif|webp)$/i.test(String(file))).length;

  return {collections, counts: index.counts.byCategory, imageCount};
}

export function getEntry(category: Category, slug: string): ArchiveEntry | null {
  const file = path.join(apiRoot, category, `${slug}.json`);
  if (!fs.existsSync(file)) return null;
  const entry = readJson<ArchiveEntry>(file);
  return {
    ...entry,
    category,
    images: (entry.images || []).map((image) => ({...image, localUrl: publicImage(image.localUrl)}))
  };
}

export function getAllParams() {
  return categories.flatMap((category) =>
    fs.readdirSync(path.join(apiRoot, category))
      .filter((file) => file.endsWith('.json'))
      .map((file) => ({category, slug: path.basename(file, '.json')}))
  );
}
