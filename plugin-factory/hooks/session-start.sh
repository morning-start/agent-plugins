#!/usr/bin/env bash
# plugin-factory session-start bootstrap (bash variant).
# Emits Claude-compatible hook JSON with the canonical using-pf entry context.
# The renderer (scripts/render-bootstrap.mjs) owns marker/body generation; this
# hook only wires lifecycle and serializes the result.
set -eu
# Resolve the plugin root from this script's own location (not $PWD).
plugin_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

node_bin="${NODE:-}"
if [ -z "$node_bin" ]; then
  node_bin="$(command -v node 2>/dev/null || command -v node.exe 2>/dev/null || true)"
fi
if [ -z "$node_bin" ]; then
  echo '{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":"[plugin-factory] node not found — entry skill not bootstrapped."}}'
  exit 0
fi

cd "$plugin_root"
"$node_bin" scripts/render-bootstrap.mjs --root . --plugin-name plugin-factory --harness claude 2>/dev/null \
  || echo '{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":"[plugin-factory] entry skill not found — check skills/using-pf/SKILL.md."}}'
exit 0
