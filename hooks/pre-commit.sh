#!/usr/bin/env bash
# Pre-commit hook for MoonBit projects.
set -euo pipefail

echo "=== MoonBit Pre-Commit ==="

if [ ! -f moon.mod.json ] && [ ! -f moon.mod ]; then
  echo "Not a MoonBit project, skipping hooks"
  exit 0
fi

echo "-> moon fmt --check"
moon fmt --check
echo "OK Format check passed"

echo "-> moon check --target native"
moon check --target native
echo "OK Type check passed"

if command -v moon-audit >/dev/null 2>&1; then
  echo "-> moon-audit --fail-on-error ."
  moon-audit --fail-on-error .
  echo "OK Security audit passed"
else
  echo "! moon-audit not installed, skipping security audit"
fi

echo "=== All checks passed ==="
