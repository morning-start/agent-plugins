#!/usr/bin/env bash
# plugin-factory pre-completion hook (bash variant).
# Runs before a session/task completes (PreCompletion): full gate — structure
# + harness + orchestration verify, then the test suite. Emits Claude-
# compatible hook JSON; non-zero exit on any FAIL so the harness blocks
# claiming completion without evidence.
set -eu
plugin_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

node_bin="${NODE:-}"
if [ -z "$node_bin" ]; then
  node_bin="$(command -v node 2>/dev/null || command -v node.exe 2>/dev/null || true)"
fi
if [ -z "$node_bin" ]; then
  echo '{"hookSpecificOutput":{"hookEventName":"PreCompletion","additionalContext":"[plugin-factory] node not found - completion gate skipped."}}'
  exit 0
fi

cd "$plugin_root"
vout="$("$node_bin" scripts/verify.mjs --format table 2>/dev/null || true)"
if printf '%s' "$vout" | grep -q "FAIL"; then
  echo "{\"hookSpecificOutput\":{\"hookEventName\":\"PreCompletion\",\"additionalContext\":\"[plugin-factory] verify FAILED - do not claim completion:\\n$vout\"}}"
  exit 1
fi
tout="$("$node_bin" --test \"tests/**/*.test.mjs\" 2>&1 || true)"
if printf '%s' "$tout" | grep -qE "fail [1-9]"; then
  echo "{\"hookSpecificOutput\":{\"hookEventName\":\"PreCompletion\",\"additionalContext\":\"[plugin-factory] tests FAILED - do not claim completion:\\n$tout\"}}"
  exit 1
fi
echo '{"hookSpecificOutput":{"hookEventName":"PreCompletion","additionalContext":"[plugin-factory] completion gate passed (verify + tests)."}}'
exit 0
