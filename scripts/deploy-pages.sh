#!/usr/bin/env bash

set -euo pipefail

# Always resolve the repository from this script's location so the workflow also
# works when a runner invokes it from a different working directory.
repo_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

pnpm run build

if [[ ! -d out ]]; then
  echo "GitHub Pages build did not create $repo_root/out" >&2
  exit 1
fi

# Keep GitHub Pages from treating Next.js' generated asset directories as Jekyll
# input. prepare-pages.mjs normally creates this; touching it here makes the
# deploy contract explicit and keeps this wrapper safe if the build changes.
touch out/.nojekyll
