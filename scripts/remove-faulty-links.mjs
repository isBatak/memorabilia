#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';

const apiDirectory = path.resolve('public/api/v1');
const index = JSON.parse(await fs.readFile(path.join(apiDirectory, 'index.json')));
let updated = 0;
let removed = 0;

for (const category of ['cartoons', 'series', 'movies', 'commercials']) {
  for (const item of index[category]) {
    if (item.status !== 'ok' || !item.file) continue;
    const file = path.join(apiDirectory, item.file);
    const entry = JSON.parse(await fs.readFile(file));
    if (Array.isArray(entry.links)) removed += entry.links.length;
    delete entry.links;
    await fs.writeFile(file, `${JSON.stringify(entry, null, 2)}\n`);
    updated++;
  }
}

console.log(`Removed ${removed} faulty links from ${updated} API entries.`);
