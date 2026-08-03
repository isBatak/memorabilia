#!/usr/bin/env bash

set -euo pipefail

repo_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

pnpm run build

if [[ ! -d out ]]; then
  echo "GitHub Pages build did not create $repo_root/out" >&2
  exit 1
fi

touch out/.nojekyll
