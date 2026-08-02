import fs from 'node:fs/promises';

await fs.writeFile('out/.nojekyll', '');
console.log('GitHub Pages marker written to out/.nojekyll.');
