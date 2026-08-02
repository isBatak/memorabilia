import fs from 'node:fs/promises';
import { spawn } from 'node:child_process';
import process from 'node:process';

async function exists(file) {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  if (!(await exists('public/api/index.json'))) {
    throw new Error('public/api/index.json is missing. Run `npm run scrape` and commit the generated API.');
  }

  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['scripts/validate.mjs'], { stdio: 'inherit' });
    child.on('error', reject);
    child.on('exit', code => code === 0 ? resolve() : reject(new Error(`Validation exited with code ${code}`)));
  });

  console.log('Static deployment output is ready in public/.');
}

main().catch(error => {
  console.error(`Build failed: ${error.message}`);
  process.exitCode = 1;
});
