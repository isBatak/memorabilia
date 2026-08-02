import fs from 'node:fs/promises';

await Promise.all([
  fs.rm('public/api', { recursive: true, force: true }),
  fs.rm('.tmp', { recursive: true, force: true })
]);

console.log('Removed generated API data.');
