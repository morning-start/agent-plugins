#!/usr/bin/env bash
# Pre-commit hook for MoonBit projects — fast checks only
# Steps:
#   0. Security scan    — detect secrets/credentials in staged files
#   1. moon fmt         — format .mbt code (auto-fix + re-stage)
#   2. moon info        — update .mbti interface files (auto-fix + re-stage)
#   3. moon check       — compile check (fail on warnings/deprecations)
#
# Heavy checks (test + audit) are in pre-push.sh
set -euo pipefail

echo "=== MoonBit Pre-Commit ==="

if [ ! -f moon.mod.json ] && [ ! -f moon.mod ]; then
  echo "Not a MoonBit project, skipping hooks"
  exit 0
fi

# ============================================================
# Step 0: Security Scan
# ============================================================

extract_added_lines() {
  git diff-index --cached -p HEAD -- . ':(exclude).githooks/' 2>/dev/null \
    | grep "^+" | grep -v "^+++" || true
}

if git diff-index --cached --name-only --diff-filter=ACM HEAD 2>/dev/null \
   | grep -qv '^\.githooks/'; then

  DIFF_LINES="$(extract_added_lines)"
  FOUND=0
  MATCHES=""

  check_pattern() {
    local pattern="$1"
    local label="$2"
    if printf '%s\n' "$DIFF_LINES" | grep -qE "$pattern" 2>/dev/null; then
      FOUND=1
      MATCHES="${MATCHES}  - ${label}
"
    fi
  }

  check_pattern 'AKIA[0-9A-Z]{16}'                        'AWS Access Key ID'
  check_pattern '-----BEGIN (RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----' 'Private Key (PEM)'
  check_pattern "(password|passwd|pwd)\s*[:=]\s*['\"][^'\" ]{4,}['\"]" 'Hardcoded password'
  check_pattern "(secret|api_key|apikey|access_token|auth_token|private_token)\s*[:=]\s*['\"][A-Za-z0-9]{15,}['\"]" 'Hardcoded secret/API key'
  check_pattern 'gh[pouhs]_[A-Za-z0-9]{30,}'              'GitHub token'
  check_pattern 'sk_live_|pk_live_'                       'Stripe live key'
  check_pattern '(mongodb(\+srv)?|mysql|postgres|redis)://[^/ ]+:[^/ ]+@' 'DB connection string with password'
  check_pattern 'AIza[0-9A-Z_-]{35}'                      'Google API key'
  check_pattern 'xox[baprs]-'                             'Slack token'
  check_pattern 'eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+'      'JWT token'

  if [ "$FOUND" = "1" ]; then
    echo ""
    echo "============================================"
    echo "  SECURITY WARNING: Potential secrets detected!"
    echo "============================================"
    echo "The following patterns were found in staged changes:"
    printf '%s' "$MATCHES"
    echo ""
    echo "  Please:"
    echo "  1. Remove or replace secrets with environment variables"
    echo "  2. Use .gitignore to exclude credential files (.env etc.)"
    echo "  3. If false positive, use --no-verify to bypass"
    echo "============================================"
    exit 1
  fi
fi

# ============================================================
# Step 1-3: MoonBit toolchain checks (only when .mbt/.mbti staged)
# ============================================================

STAGED_MBT="$(git diff-index --cached --name-only --diff-filter=ACM HEAD 2>/dev/null \
  | grep -E '\.(mbt|mbti)$' || true)"

if [ -z "$STAGED_MBT" ]; then
  # No MoonBit files staged, but security scan already ran above
  echo "OK No MoonBit files staged, skipping fmt/info/check"
  exit 0
fi

# --- Step 1: Format ---
echo "-> moon fmt (auto-fix)"
if ! moon fmt; then
  echo "ERROR: moon fmt failed!" >&2
  exit 1
fi

# Re-stage formatted files
FORMAT_CHANGED="$(git diff --name-only -- '*.mbt' 2>/dev/null || true)"
if [ -n "$FORMAT_CHANGED" ]; then
  echo "   Re-staging formatted files..."
  git add -- "$FORMAT_CHANGED"
fi
echo "OK Format passed"

# --- Step 2: Update interfaces ---
echo "-> moon info (sync .mbti)"
if ! moon info; then
  echo "ERROR: moon info failed!" >&2
  exit 1
fi

# Re-stage updated interface files
MBTI_CHANGED="$(git diff --name-only -- '*.mbti' 2>/dev/null || true)"
if [ -n "$MBTI_CHANGED" ]; then
  echo "   Staging updated .mbti files..."
  git add -- "$MBTI_CHANGED"
fi
echo "OK Interface files synced"

# --- Step 3: Compile check ---
echo "-> moon check --target native --warn-list +73"
if CHECK_OUTPUT="$(moon check --target native --warn-list +73 2>&1)"; then
  :
else
  echo "ERROR: moon check failed!" >&2
  echo "$CHECK_OUTPUT" >&2
  exit 1
fi
echo "OK Type check passed"

echo "=== Pre-commit passed (security + fmt + info + check) ==="
