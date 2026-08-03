#!/usr/bin/env bash
set -euo pipefail

: "${GITHUB_REPOSITORY:?GITHUB_REPOSITORY is required}"

readonly deploy_mode="${DEPLOY_MODE:-production}"
readonly pr_number="${PR_NUMBER:-}"
if [[ "$deploy_mode" != "production" ]]; then
  if [[ ! "$pr_number" =~ ^[0-9]+$ ]]; then
    echo "PR_NUMBER must be numeric for ${deploy_mode} deployments." >&2
    exit 1
  fi
  readonly preview_path="previews/pr-${pr_number}"
else
  readonly preview_path=""
fi

if [[ -n "${PAGES_REMOTE:-}" ]]; then
  readonly remote="$PAGES_REMOTE"
else
  : "${GITHUB_TOKEN:?GITHUB_TOKEN is required}"
  readonly remote="https://x-access-token:${GITHUB_TOKEN}@github.com/${GITHUB_REPOSITORY}.git"
fi
readonly deploy_dir="$(mktemp -d)"
trap 'rm -rf "$deploy_dir"' EXIT

retry() {
  local attempt=1
  local maximum=5

  until "$@"; do
    if (( attempt == maximum )); then
      echo "Command failed after ${maximum} attempts: $1" >&2
      return 1
    fi

    echo "Command failed (attempt ${attempt}/${maximum}); retrying in $((attempt * 5)) seconds…" >&2
    sleep $((attempt * 5))
    ((attempt += 1))
  done
}

branch_ref="$(retry git ls-remote --heads "$remote" refs/heads/gh-pages)"
if [[ -n "$branch_ref" ]]; then
  retry git clone --quiet --branch gh-pages --single-branch "$remote" "$deploy_dir"
else
  git init --quiet --initial-branch=gh-pages "$deploy_dir"
  git -C "$deploy_dir" remote add origin "$remote"
fi

case "$deploy_mode" in
  preview)
    mkdir -p "$deploy_dir/$preview_path"
    rsync -a --delete out/ "$deploy_dir/$preview_path"/
    ;;
  cleanup)
    rm -rf "$deploy_dir/$preview_path"
    ;;
  production)
    # Refresh production while retaining every active pull-request preview.
    rsync -a --delete --exclude=.git --exclude=previews out/ "$deploy_dir"/
    ;;
  *)
    echo "Unknown DEPLOY_MODE: $deploy_mode" >&2
    exit 1
    ;;
esac

git -C "$deploy_dir" config user.name "github-actions[bot]"
git -C "$deploy_dir" config user.email "41898282+github-actions[bot]@users.noreply.github.com"
git -C "$deploy_dir" add --all

if git -C "$deploy_dir" diff --cached --quiet; then
  echo "The ${deploy_mode} deployment is already up to date."
  exit 0
fi

git -C "$deploy_dir" commit --quiet -m "Deploy ${preview_path:-production} from ${GITHUB_SHA:-unknown}"

# Another deployment may update the branch between clone and push. Rebase before
# retrying; retries also cover temporary GitHub 5xx errors.
for attempt in {1..5}; do
  if git -C "$deploy_dir" push --quiet origin HEAD:gh-pages; then
    echo "${deploy_mode^} site deployed to gh-pages."
    exit 0
  fi

  if (( attempt == 5 )); then
    echo "Deployment failed after 5 push attempts." >&2
    exit 1
  fi

  echo "Push failed (attempt ${attempt}/5); fetching and retrying…" >&2
  sleep $((attempt * 5))
  retry git -C "$deploy_dir" pull --rebase origin gh-pages
done
