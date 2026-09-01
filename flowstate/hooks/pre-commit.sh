#!/usr/bin/env bash
# flowstate pre-commit gate (bash variant).
# Blocks commits that violate the workspace commit-boundary iron law:
#   - staged .agent-workplace/ content (private, must never be committed)
#   - obvious secrets in staged files (API keys, passwords, tokens)
#   - P3 back-door writes: staged docs/ files with no APPROVED record in
#     .agent-workplace/state/document-status.json (they bypassed fst-promote)
# Dependency-free: uses only git + grep + jq (jq only for the P3 reverse check).
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

# --- P3 reverse-authorization gate ----------------------------------------
# Every finalized doc (docs/*.md) being committed must be backed by an APPROVED
# record in the workspace index, proving it passed /fst-promote + HITL.
status_path=".agent-workplace/state/document-status.json"

# Skip the reverse check when there is no workspace (not a flowstate project).
# Also skip when jq is unavailable: the SessionEnd gate + tests still enforce it.
if [ -f "$status_path" ] && command -v jq &> /dev/null; then
  approved_targets="$(jq -r '.documents[] | select(.type=="APPROVED" and .promoted_to) | .promoted_to' "$status_path" 2>/dev/null || true)"

  unapproved=""
  while IFS= read -r f; do
    case "$f" in
      docs/*.md)
        if ! printf '%s\n' "$approved_targets" | grep -qxF "$f"; then
          unapproved="$unapproved$f"$'\n'
        fi
        ;;
    esac
  done <<< "$staged"

  if [ -n "$unapproved" ]; then
    echo "[flowstate] BLOCKED: docs/ files have no APPROVED record — they bypassed the fst-promote gate:" >&2
    printf '%s\n' "$unapproved" | sed '/^$/d' | sed 's/^/  - /' >&2
    echo "[flowstate] Run /fst-promote to authorize them, then re-stage and commit." >&2
    exit 1
  fi
fi

exit 0
