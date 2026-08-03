#!/usr/bin/env bash
set -euo pipefail

: "${GITHUB_REPOSITORY:?GITHUB_REPOSITORY is required}"

readonly owner="${GITHUB_REPOSITORY%%/*}"
readonly repository="${GITHUB_REPOSITORY#*/}"
pr_number="${PR_NUMBER:-}"
if [[ -z "$pr_number" && "${GITHUB_REF:-}" =~ ^refs/pull/([0-9]+)/ ]]; then
  pr_number="${BASH_REMATCH[1]}"
fi

if [[ -n "$pr_number" ]]; then
  if [[ ! "$pr_number" =~ ^[0-9]+$ ]]; then
    echo "Invalid pull request number: $pr_number" >&2
    exit 1
  fi
  readonly deploy_path="previews/pr-${pr_number}"
  readonly pages_base_path="/${repository}/${deploy_path}"
  readonly page_url="https://${owner}.github.io/${repository}/${deploy_path}/"
  PAGES_BASE_PATH="$pages_base_path" pnpm run build
else
  readonly deploy_path=""
fi

report_preview() {
  [[ -n "$deploy_path" ]] || return 0
  echo "Preview deployed to ${page_url}"
  if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
    echo "page_url=${page_url}" >> "$GITHUB_OUTPUT"
  fi
  if [[ -n "${GITHUB_STEP_SUMMARY:-}" ]]; then
    echo "### [Open preview](${page_url})" >> "$GITHUB_STEP_SUMMARY"
  fi
}

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

if [[ -n "$deploy_path" ]]; then
  # Keep production intact and publish each pull request in an isolated folder.
  mkdir -p "$deploy_dir/$deploy_path"
  rsync -a --delete out/ "$deploy_dir/$deploy_path"/
else
  # Production refreshes the branch root but retains active preview folders.
  rsync -a --delete --exclude=.git --exclude=previews out/ "$deploy_dir"/
fi

git -C "$deploy_dir" config user.name "github-actions[bot]"
git -C "$deploy_dir" config user.email "41898282+github-actions[bot]@users.noreply.github.com"
git -C "$deploy_dir" add --all

if git -C "$deploy_dir" diff --cached --quiet; then
  echo "The deployed production site is already up to date."
  report_preview
  exit 0
fi

git -C "$deploy_dir" commit --quiet -m "Deploy ${deploy_path:-production} from ${GITHUB_SHA:-unknown}"

# Another deployment may update the branch between clone and push. Rebase before
# retrying; retries also cover temporary GitHub 5xx errors.
for attempt in {1..5}; do
  if git -C "$deploy_dir" push --quiet origin HEAD:gh-pages; then
    if [[ -n "$deploy_path" ]]; then
      report_preview
    else
      echo "Production site deployed to gh-pages."
    fi
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
