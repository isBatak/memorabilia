# Memorabilia

**Memorabilia** is an effort to revive the original Memorabilia blog and
modernize its content for the web today. It preserves articles about cartoons,
television series, and films while turning them into structured data that can be
maintained, corrected, and expanded over time.

The initial dataset was recovered from snapshots of the original blog in the
Wayback Machine. That import was a one-time starting point—not the final state of
the project. The intent is to continue maintaining the database, improve the
preserved content, restore missing media, and add new information where useful.

## Static API

All content is stored as static JSON under `public/api/v1`. There is no application
server or database required to read it, so the complete archive can be hosted on
any static file service and consumed directly by websites, applications, or
other preservation projects.

The API separates the archive into three collections:

- `series` — television series
- `cartoons` — animated series and cartoons
- `movies` — films from childhood

Entries can include the original article text, metadata, images, source
information, and locally preserved media. Entries for which only a title has
been recovered remain in the database as title-only records so they can be
completed later.

## Open

- `http://localhost:3000`
- `http://localhost:3000/api/v1/index.json`
- `http://localhost:3000/api/v1/navigation.json`
- `http://localhost:3000/api/v1/cartoons/bus-bus.json`

## Web archive

The repository also includes a Croatian-first, bilingual Next.js interface for
browsing the complete archive. It is statically exported, searches entirely in
the browser, and uses only locally preserved media, so it remains deployable to
GitHub Pages and other static hosts.

```text
pnpm dev      # local site
pnpm build    # validate data and export the site to out/
pnpm preview  # serve the finished static export
```

## GitHub Pages deployment

The GitHub Actions workflows publish the production site from `main`. Pull
requests from branches in this repository deploy their preview to that same
GitHub Pages URL—for this repository, `https://isBatak.github.io/memorabilia/`.
Closing a pull request rebuilds and redeploys the default branch.

To enable both production and preview deployments, open **Settings → Pages** in
the GitHub repository and set **Build and deployment → Source** to **Deploy from
a branch**, using the `gh-pages` branch and the `/ (root)` folder. The branch is
created by the first successful deployment workflow run.

GitHub Pages does not provide isolated pull-request preview deployments out of
the box: a repository has one Pages site and URL. Consequently, a PR preview
temporarily replaces the production site, and the most recently deployed PR is
the version at that URL. For security, previews are published only for branches
in this repository; forked pull requests retain GitHub's read-only token.

Publishing is performed by `scripts/deploy-pages.sh` rather than a JavaScript
action. The script retries temporary GitHub network failures while pushing the
`gh-pages` branch.

## API endpoints

```text
GET /api/v1/index.json
GET /api/v1/navigation.json
GET /api/v1/series/:slug.json
GET /api/v1/cartoons/:slug.json
GET /api/v1/movies/:slug.json
```

`index.json` provides the complete categorized index and references every entry
file. `navigation.json` preserves the categorized navigation recovered from the
original site. Individual entry files contain the structured content and media
references for each title.

## Data layout

```text
public/
├── api/
│   └── v1/
│       ├── index.json
│       ├── navigation.json
│       ├── series/
│       ├── cartoons/
│       └── movies/
└── images/
```
