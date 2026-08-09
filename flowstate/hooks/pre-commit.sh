#!/usr/bin/env bash
# flowstate pre-commit gate (bash variant).
# Blocks commits that violate the workspace commit-boundary iron law:
#   - staged .agent-workplace/ content (private, must never be committed)
#   - obvious secrets in staged files (API keys, passwords, tokens)
# Dependency-free: uses only git + grep.
set -eu

staged="$(git diff --cached --name-only 2>/dev/null || true)"

if printf '%s\n' "$staged" | grep -q '^\.agent-workplace/'; then
  echo "[flowstate] BLOCKED: .agent-workplace/ is the agent's PRIVATE workspace and must never be committed." >&2
  echo "[flowstate] Remove it from the index: git reset .agent-workplace/ (content stays on disk)." >&2
  exit 1
fi

# Simple secrets scan on staged text files (best-effort, low noise).
secret_hits="$(git diff --cached 2>/dev/null | grep -nEi '(api[_-]?key|secret|password|token)[[:space:]]*[:=][[:space:]]*["'"'"'][A-Za-z0-9_\-]{16,}' || true)"
if [ -n "$secret_hits" ]; then
  echo "[flowstate] BLOCKED: possible secret in staged changes — check before committing." >&2
  printf '%s\n' "$secret_hits" | head -5 >&2
  exit 1
fi

exit 0
