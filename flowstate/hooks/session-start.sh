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
body="$(
  awk '
    BEGIN { infront = 0; started = 0 }
    /^---[[:space:]]*$/ { if (!started) { infront = 1; started = 1; next } }
    { if (infront && $0 !~ /^[[:space:]]*$/) infront = 0 }
    !infront { print }
  ' "$entry"
)"

printf '%s\n' '{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":"FLOWSTATE_BOOTSTRAP:flowstate\n\n'"$body"'"}}'
exit 0
