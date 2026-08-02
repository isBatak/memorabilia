# Codex project notes

## Goal
Preserve the archived Memorabilia blog as structured static JSON.

## Conventions
- Put executable maintenance code in `scripts/`.
- Keep deployable data in `public/api/`.
- Do not fetch the Wayback Machine during a Vercel build.
- Preserve `rawArticleHtml` when changing parsers so content can be reprocessed later.
- Keep JSON backward-compatible or increment `schemaVersion`.
- Run `npm run validate` before committing generated files.

## Useful commands
- `npm run scrape` — crawl linked cartoons and write `public/api`.
- `npm run scrape:dry` — discover and parse without replacing output.
- `npm run validate` — validate generated JSON and references.
- `npm run build` — validate and prepare static deployment.
- `npm run dev` — serve `public/` locally.
