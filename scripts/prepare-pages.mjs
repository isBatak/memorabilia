import fs from 'node:fs/promises';
import i18nConfig from '../i18n/config.json' with {type: 'json'};

await fs.writeFile('out/.nojekyll', '');

const defaultLocale = i18nConfig.defaultLocale;
const defaultLocalePath = `./${defaultLocale}/`;
const rootEntry = `<!doctype html>
<html lang="${defaultLocale}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta http-equiv="refresh" content="0; url=${defaultLocalePath}">
    <title>Memorabilia</title>
    <script>location.replace(${JSON.stringify(defaultLocalePath)} + location.search + location.hash)</script>
  </head>
  <body>
    <a href="${defaultLocalePath}">Continue to Memorabilia</a>
  </body>
</html>
`;

await fs.writeFile('out/index.html', rootEntry);
console.log(`GitHub Pages root entry written for default locale "${defaultLocale}".`);
