#!/usr/bin/env bash
# flowstate session-start bootstrap (bash variant).
# Emits Claude-compatible hook JSON with the canonical using-flowstate entry
# context (frontmatter stripped, single FLOWSTATE_BOOTSTRAP marker).
# Lightweight and dependency-free: reads the SKILL.md directly, no node needed.
set -eu

# Resolve the plugin root from this script's own location (not $PWD).
plugin_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
entry="$plugin_root/skills/using-flowstate/SKILL.md"

if [ ! -f "$entry" ]; then
  echo '{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":"[flowstate] entry skill not found — check skills/using-flowstate/SKILL.md."}}'
  exit 0
fi

# Strip YAML frontmatter (--- ... ---) and leading blank lines; prepend marker.
# Keep regex in sync with .pi/extensions/fst-bootstrap.ts, .opencode/plugins/fst-bootstrap.ts,
# and hooks/session-start.ps1.
body="$(
  awk '
    BEGIN { infront = 0; started = 0 }
    /^---[[:space:]]*$/ { if (!started) { infront = 1; started = 1; next } }
    { if (infront && $0 !~ /^[[:space:]]*$/) infront = 0 }
    !infront { print }
  ' "$entry"
)"
# Escape for a JSON string literal: backslash, double quote, then convert
# newlines to \n via awk (control chars are illegal raw inside JSON strings).
body="$(printf '%s' "$body" | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g' | awk '{ printf "%s\\n", $0 }' | sed -e 's/\r//g')"

printf '{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":"FLOWSTATE_BOOTSTRAP:flowstate\\n\\n%s"}}\n' "$body"
exit 0
