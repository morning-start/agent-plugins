#!/usr/bin/env bash
# Pre-commit hook for MoonBit projects
# Hard condition: blocks commit if moon fmt --check or moon check fails
set -euo pipefail

echo "=== MoonBit Pre-Commit ==="

# Check if we're in a MoonBit project
if [ ! -f moon.mod.json ] && [ ! -f moon.mod ]; then
  echo "⚠️  Not a MoonBit project, skipping hooks"
  exit 0
fi

# 1. Format check
echo "→ moon fmt --check..."
if ! moon fmt --check 2>/dev/null; then
  echo "❌ Format check failed. Run 'moon fmt' to fix."
  exit 1
fi
echo "✅ Format check passed"

# 2. Type check
echo "→ moon check --target native..."
if ! moon check --target native 2>/dev/null; then
  echo "❌ Type check failed. Run 'moon check --explain E####' to diagnose."
  exit 1
fi
echo "✅ Type check passed"

# 3. Security audit (if available)
if command -v moon-audit &>/dev/null; then
  echo "→ moon-audit pipeline..."
  if ! moon-audit --fail-on-error . 2>/dev/null; then
    echo "❌ Security audit found errors. Run 'moon-audit .' for details."
    exit 1
  fi
  echo "✅ Security audit passed"
else
  echo "⚠️  moon-audit not installed, skipping security audit"
  echo "   Install: https://github.com/I3eg1nner/moon-audit"
fi

echo "=== All checks passed ==="