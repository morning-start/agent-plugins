#!/usr/bin/env bash
# bump-version.sh — bump version across declared manifest files, with drift
# detection and repo-wide audit. Thin wrapper around scripts/version.mjs
# (single cross-platform implementation; no parsing logic in shell).
# Usage: bump-version.sh <X.Y.Z> | --check | --audit
set -eu
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

node_bin="${NODE:-}"
if [ -z "$node_bin" ]; then
  node_bin="$(command -v node 2>/dev/null || command -v node.exe 2>/dev/null || true)"
fi
if [ -z "$node_bin" ]; then
  echo "bump-version: node not found (set NODE or add node to PATH)" >&2
  exit 127
fi

cd "$root"
case "${1:-}" in
  --check) exec "$node_bin" scripts/version.mjs check ;;
  --audit) exec "$node_bin" scripts/version.mjs audit ;;
  -h|--help|"") echo "Usage: bump-version.sh <X.Y.Z> | --check | --audit"; exit 0 ;;
  *) exec "$node_bin" scripts/version.mjs bump "${1:-}" ;;
esac
