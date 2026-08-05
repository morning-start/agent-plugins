#!/usr/bin/env bash
# commit-msg hook for MoonBit projects — enforces Conventional Commits format
# Installed by moonbit-ci, consumed by git commit
set -euo pipefail

COMMIT_MSG="$(cat "$1")"

# Skip merge commits
case "$COMMIT_MSG" in
  Merge*) exit 0 ;;
esac

# Pattern: type(scope): subject  or  type: subject
# ! after scope indicates breaking change
ALLOWED_TYPES="feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert"
PATTERN="^(${ALLOWED_TYPES})(\(.+\))?!?: .+"

if ! printf '%s\n' "$COMMIT_MSG" | head -1 | grep -qE "$PATTERN"; then
  echo ""
  echo "ERROR: Commit message must follow Conventional Commits format."
  echo ""
  echo "  Expected: type(scope): subject"
  echo "  Example:  feat(core): add Dijkstra algorithm"
  echo "            fix: handle empty graph edge case"
  echo "            ci: add deprecation warning gate"
  echo ""
  echo "  Allowed types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert"
  echo ""
  echo "  Your message: $(printf '%s\n' "$COMMIT_MSG" | head -1)"
  echo ""
  exit 1
fi

exit 0
