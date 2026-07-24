#!/usr/bin/env bash
# Pre-completion hook for MoonBit projects
# Hard condition: runs before agent claims completion
# Executes: fmt --check + check + test + moon-audit
set -euo pipefail

echo "=== MoonBit Pre-Completion ==="

PROJECT_DIR="${1:-.}"
cd "$PROJECT_DIR"

# Check if we're in a MoonBit project
if [ ! -f moon.mod.json ] && [ ! -f moon.mod ]; then
  echo "Not a MoonBit project: $PROJECT_DIR"
  echo "Skipping MoonBit completion gate"
  exit 0
fi

STRICT_AUDIT="${MOONBIT_STRICT_AUDIT:-1}"

FAILED=0

# 1. Format check
echo "→ moon fmt --check..."
if moon fmt --check 2>/dev/null; then
  echo "✅ Format check passed"
else
  echo "❌ Format check failed. Run: moon fmt"
  FAILED=1
fi

# 2. Type check with warnings
echo "→ moon check --target native --warn-list +73..."
if moon check --target native --warn-list +73 2>/dev/null; then
  echo "✅ Type check passed"
else
  echo "❌ Type check failed. Run: moon check --explain E####"
  FAILED=1
fi

# 3. Test
echo "→ moon test --target native..."
if moon test --target native 2>/dev/null; then
  echo "✅ Tests passed"
else
  echo "❌ Tests failed. Run: moon test --target native -- --show-output"
  FAILED=1
fi

# 4. Security audit
if command -v moon-audit &>/dev/null; then
  echo "→ moon-audit pipeline..."
  if moon-audit --fail-on-error . 2>/dev/null; then
    echo "✅ Security audit passed"
  else
    echo "❌ Security audit found issues. Run: moon-audit ."
    FAILED=1
  fi
else
  echo "⚠️  moon-audit not installed, skipping"
fi

# 5. Package info
if moon info --target native 2>/dev/null; then
  echo "✅ Package info OK"
else
  echo "⚠️  moon info failed (non-fatal)"
fi

echo "=== Summary ==="
if [ "$FAILED" -eq 0 ]; then
  echo "✅ All checks passed"
  exit 0
else
  echo "❌ Some checks failed. Fix the issues above before completing."
  exit 1
fi