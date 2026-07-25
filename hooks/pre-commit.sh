#!/usr/bin/env bash
# Pre-commit hook for MoonBit projects — fast checks only (fmt + type check)
# Heavy checks (test + audit) are in pre-push.sh
set -euo pipefail

echo "=== MoonBit Pre-Commit ==="

if [ ! -f moon.mod.json ] && [ ! -f moon.mod ]; then
  echo "Not a MoonBit project, skipping hooks"
  exit 0
fi

echo "-> moon fmt --check"
moon fmt --check
echo "OK Format check passed"

echo "-> moon check --target native --warn-list +73"
moon check --target native --warn-list +73
echo "OK Type check passed"

echo "=== Pre-commit passed ==="