# YouTube discovery

Cartoon entries can be enriched with currently available YouTube videos without
changing or removing unrelated archived links. Add channel video-page URLs to
`scripts/youtube-sources.json`, then run:

```text
pnpm youtube:sync --dry-run
pnpm youtube:sync
pnpm youtube:sync --source https://www.youtube.com/@another-channel/videos
```

The scanner follows paginated channel results, matches normalized video titles
against cartoon titles, and writes matches to the source-agnostic `videos`
property. Each video identifies its provider in `source.type`; matching URLs are
removed from the legacy `links` array to avoid duplication. Review a dry run
before writing generated data because channel owners can rename videos over
time.

Cartoon thumbnails and their playback surfaces share Panda CSS v2
`viewTransition` styles, allowing supported browsers to morph the selected
thumbnail into the cinematic player while preserving a normal navigation
fallback everywhere else.
