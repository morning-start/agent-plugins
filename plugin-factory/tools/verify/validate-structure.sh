#!/usr/bin/env bash
# validate-structure.sh — structural checks (wrapper around tools/verify/verify.mjs).
# Single cross-platform engine; exit 1 on any FAIL finding.
# Runs node from the repo root with a relative script path so the engine's
# process.cwd() and module resolution stay correct on MSYS/WSL mixed mounts.
set -eu
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

node_bin="${NODE:-}"
if [ -z "$node_bin" ]; then
  node_bin="$(command -v node 2>/dev/null || command -v node.exe 2>/dev/null || true)"
fi
if [ -z "$node_bin" ]; then
  echo "validate-structure: node not found (set NODE or add node to PATH)" >&2
  exit 127
fi

cd "$root"
exec "$node_bin" tools/verify/verify.mjs structure --root .
