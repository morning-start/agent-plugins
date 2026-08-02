#!/usr/bin/env bash
# scaffold.sh — generate a standalone multi-harness plugin project.
# Thin wrapper around scripts/scaffold.mjs (single cross-platform renderer).
# Usage: scaffold.sh <plugin-name> <prefix> <target-dir> [description] [user-lang] [--harnesses a,b,c]
set -eu
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
node "$root/scripts/scaffold.mjs" "$@"
exit $?
