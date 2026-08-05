#!/usr/bin/env bash
# lifecycle-probes.sh — lifecycle/orchestration probes (wrapper around scripts/verify.mjs).
# Emits severity-ranked findings; exit 1 on any FAIL finding.
# Runs node from the repo root with a relative script path so the engine's
# process.cwd() and module resolution stay correct on MSYS/WSL mixed mounts.
set -eu
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

node_bin="${NODE:-}"
if [ -z "$node_bin" ]; then
  node_bin="$(command -v node 2>/dev/null || command -v node.exe 2>/dev/null || true)"
fi
if [ -z "$node_bin" ]; then
  echo "lifecycle-probes: node not found (set NODE or add node to PATH)" >&2
  exit 127
fi

cd "$root"
exec "$node_bin" scripts/verify.mjs lifecycle --root .
