# YouTube discovery

Add channel video URLs to `scripts/youtube-sources.json`, then review and apply matches with `pnpm youtube:sync --dry-run` and `pnpm youtube:sync`. Matches are stored in the provider-neutral `videos` property and retain their source metadata.
