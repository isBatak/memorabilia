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

All content is stored as static JSON under `public/api`. There is no application
server or database required to read it, so the complete archive can be hosted on
any static file service and consumed directly by websites, applications, or
other preservation projects.

The API separates the archive into three collections:

- `series` — television series
- `cartoons` — animated series and cartoons
- `movies` — films from childhood

Entries can include the original article text, metadata, links, images, source
information, and locally preserved media. Entries for which only a title has
been recovered remain in the database as title-only records so they can be
completed later.

## Open

- `http://localhost:3000/api`
- `http://localhost:3000/api/navigation.json`
- `http://localhost:3000/api/cartoons/bus-bus.json`

## API endpoints

```text
GET /api/index.json
GET /api/navigation.json
GET /api/series/:slug.json
GET /api/cartoons/:slug.json
GET /api/movies/:slug.json
```

`index.json` provides the complete categorized index and references every entry
file. `navigation.json` preserves the categorized navigation recovered from the
original site. Individual entry files contain the structured content and media
references for each title.

## Data layout

```text
public/
├── api/
│   ├── index.json
│   ├── navigation.json
│   ├── series/
│   ├── cartoons/
│   └── movies/
└── images/
```
