import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const API_DIR = path.resolve(process.env.API_DIR ?? 'public/api');
const PUBLIC_DIR = path.resolve(process.env.PUBLIC_DIR ?? path.dirname(API_DIR));
const CATEGORIES = {
  series: 'series-post',
  cartoons: 'cartoon-post',
  movies: 'movie-post'
};

async function readJson(file) {
  try {
    return JSON.parse(await fs.readFile(file, 'utf8'));
  } catch (error) {
    throw new Error(`${path.relative(process.cwd(), file)}: ${error.message}`);
  }
}

async function exists(file) {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function main() {
  const indexPath = path.join(API_DIR, 'index.json');
  const navigationPath = path.join(API_DIR, 'navigation.json');
  const index = await readJson(indexPath);
  const navigation = await readJson(navigationPath);

  assert(index.schemaVersion === 1, 'index.json must use schemaVersion 1');
  for (const category of Object.keys(CATEGORIES)) {
    assert(Array.isArray(index[category]), `index.json ${category} must be an array`);
    assert(Array.isArray(navigation[category]), `navigation.json ${category} must be an array`);
  }

  let checked = 0;
  for (const [category, expectedType] of Object.entries(CATEGORIES)) {
    for (const item of index[category]) {
      if (item.status !== 'ok') continue;
      assert(typeof item.file === 'string', `Missing file reference for ${item.title ?? 'unknown item'}`);
      const articlePath = path.join(API_DIR, item.file);
      const article = await readJson(articlePath);
      assert([1, 2].includes(article.schemaVersion), `${item.file} must use schemaVersion 1 or 2`);
      assert(article.type === expectedType, `${item.file} has an invalid type`);
      assert(article.category === category, `${item.file} has an invalid category`);
      assert(typeof article.title === 'string' && article.title.length > 0, `${item.file} is missing title`);
      assert(typeof article.slug === 'string' && article.slug.length > 0, `${item.file} is missing slug`);
      for (const image of article.images ?? []) {
        if (!image.localUrl) continue;
        assert(/^\.\.\/\.\.\/images\/[^/]+\/[^/]+$/.test(image.localUrl), `${item.file} has an invalid image localUrl`);
        const localPath = path.resolve(path.dirname(articlePath), image.localUrl);
        assert(localPath.startsWith(`${PUBLIC_DIR}${path.sep}`), `${item.file} image localUrl escapes public/`);
        assert(await exists(localPath), `${item.file} references missing ${image.localUrl}`);
      }
      for (const video of article.videos ?? []) {
        assert(article.schemaVersion === 2, `${item.file} with videos must use schemaVersion 2`);
        assert(typeof video.id === 'string' && video.id.length > 0, `${item.file} has an invalid video id`);
        assert(typeof video.embedUrl === 'string' && video.embedUrl.startsWith('https://'), `${item.file} has an invalid video embedUrl`);
        assert(/^[a-z0-9-]+$/.test(video.source?.type ?? ''), `${item.file} has an invalid video source`);
      }
      checked += 1;
    }
  }

  const indexed = Object.keys(CATEGORIES).reduce((total, category) => total + index[category].length, 0);
  console.log(`Valid static API: ${indexed} indexed, ${checked} entry files checked.`);
}

main().catch(error => {
  console.error(`Validation failed: ${error.message}`);
  process.exitCode = 1;
});
