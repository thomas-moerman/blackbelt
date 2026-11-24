#!/usr/bin/env bash
# Render README.md the way GitHub does (GitHub's own HTML + github-markdown-css) into an HTML file.
# Usage: scripts/render-readme.sh <git-ref> <out.html>   (ref must be pushed; needs gh auth)
set -euo pipefail
ref="$1"; out="$2"; dir=$(dirname "$out")
repo=$(gh repo view --json nameWithOwner --jq .nameWithOwner)
body=$(gh api "repos/$repo/readme?ref=$ref" -H "Accept: application/vnd.github.html")
ln -sfn "$(git rev-parse --show-toplevel)/assets" "$dir/assets"
{
  echo '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
  echo '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/github-markdown-css@5.8.1/github-markdown.css">'
  echo '<style>body{margin:0}.markdown-body{box-sizing:border-box;max-width:1012px;margin:0 auto;padding:32px 16px}.markdown-body .anchor{display:none}</style>'
  echo '</head><body><article class="markdown-body">'
  printf '%s\n' "$body"
  echo '</article></body></html>'
} > "$out"
