#!/usr/bin/env bash
# scaffold.sh — generate a standalone multi-harness plugin project.
# Thin wrapper around tools/scaffold/scaffold.mjs (single cross-platform renderer).
# Usage: scaffold.sh <plugin-name> <prefix> <target-dir> [description] [user-lang] [--harnesses a,b,c]
set -eu
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

node_bin="${NODE:-}"
if [ -z "$node_bin" ]; then
  node_bin="$(command -v node 2>/dev/null || command -v node.exe 2>/dev/null || true)"
fi
if [ -z "$node_bin" ]; then
  echo "scaffold: node not found (set NODE or add node to PATH)" >&2
  exit 127
fi

"$node_bin" "$root/tools/scaffold/scaffold.mjs" "$@"
exit $?
