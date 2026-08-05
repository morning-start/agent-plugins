#!/usr/bin/env bash
# Pre-push hook for MoonBit projects — heavy checks (test + security audit)
# Fast checks (fmt + type check) are in pre-commit.sh
set -euo pipefail

echo "=== MoonBit Pre-Push ==="

if [ ! -f moon.mod.json ] && [ ! -f moon.mod ]; then
  echo "Not a MoonBit project, skipping hooks"
  exit 0
fi

STRICT_AUDIT="${MOONBIT_STRICT_AUDIT:-0}"

echo "-> moon test --target native"
moon test --target native
echo "OK Tests passed"

if command -v moon-audit >/dev/null 2>&1; then
  echo "-> moon-audit --fail-on-error ."
  moon-audit --fail-on-error .
  echo "OK Security audit passed"
else
  if [ "$STRICT_AUDIT" = "1" ]; then
    echo "Security audit unavailable and MOONBIT_STRICT_AUDIT=1"
    exit 1
  fi
  echo "! moon-audit not installed, skipping security audit"
  echo "  Install: moon add minie135/moon-audit"
fi

echo "=== Pre-push passed ==="