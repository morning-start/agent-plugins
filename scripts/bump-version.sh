#!/usr/bin/env bash
# bump-version.sh — bump version across all declared manifest files, with drift
# detection and repo-wide audit (pattern absorbed from superpowers).
# Usage: bump-version.sh <X.Y.Z> | --check | --audit
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CONFIG="$REPO_ROOT/.version-bump.json"
[ -f "$CONFIG" ] || { echo "error: $CONFIG not found" >&2; exit 1; }

declared() { jq -r '.files[] | "\(.path)\t\(.field)"' "$CONFIG"; }

current_versions() {
  while IFS=$'\t' read -r path field; do
    local f="$REPO_ROOT/$path"
    [ -f "$f" ] && jq -r "$field" "$f"
  done < <(declared)
}

cmd_check() {
  local drift=0
  echo "Version check:"
  while IFS=$'\t' read -r path field; do
    local f="$REPO_ROOT/$path"
    if [ ! -f "$f" ]; then
      printf "  %-42s MISSING\n" "$path ($field)"; drift=1; continue
    fi
    printf "  %-42s %s\n" "$path ($field)" "$(jq -r "$field" "$f")"
  done < <(declared)
  local unique
  unique=$( { current_versions; } | sort -u | wc -l | tr -d ' ')
  if [ "$unique" -gt 1 ]; then
    echo "DRIFT DETECTED — declared versions are not in sync."
    return 1
  fi
  echo "All declared files are in sync."
}

cmd_audit() {
  cmd_check || true
  local cur
  cur=$( { current_versions; } | sort | uniq -c | sort -rn | head -1 | awk '{print $2}')
  echo "Audit: scanning for '$cur' outside declared files..."
  local -a excl=()
  while IFS= read -r p; do excl+=(--exclude="$p" --exclude-dir="$p"); done \
    < <(jq -r '.audit.exclude[]' "$CONFIG")
  excl+=(--exclude-dir=.git --exclude-dir=node_modules --binary-files=without-match)
  local -a declared_paths=()
  while IFS=$'\t' read -r path _f; do declared_paths+=("$path"); done < <(declared)
  local found=0
  while IFS= read -r m; do
    local rel="${m#$REPO_ROOT/}"
    local skip=0 p
    for p in "${declared_paths[@]}"; do [ "$rel" = "$p" ] && skip=1; done
    [ "$skip" = 0 ] || continue
    [ "$found" = 0 ] && { echo "UNDECLARED files containing '$cur':"; found=1; }
    echo "  $rel"
  done < <(grep -rn "${excl[@]}" -F "$cur" "$REPO_ROOT" 2>/dev/null || true)
  [ "$found" = 0 ] && echo "No undeclared references. All clear."
}

cmd_bump() {
  local new="$1"
  echo "$new" | grep -qE '^[0-9]+\.[0-9]+\.[0-9]+' \
    || { echo "error: version must look like X.Y.Z" >&2; exit 1; }
  echo "Bumping declared files to $new..."
  while IFS=$'\t' read -r path field; do
    local f="$REPO_ROOT/$path"
    [ -f "$f" ] || { echo "  SKIP (missing): $path"; continue; }
    jq "$field = \"$new\"" "$f" > "$f.tmp" && mv "$f.tmp" "$f"
    echo "  $path ($field) -> $new"
  done < <(declared)
  echo ""; cmd_audit
}

case "${1:-}" in
  --check) cmd_check ;;
  --audit) cmd_audit ;;
  -h|--help|"") echo "Usage: bump-version.sh <X.Y.Z> | --check | --audit"; exit 0 ;;
  *) cmd_bump "$1" ;;
esac
