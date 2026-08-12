#!/usr/bin/env bash
# MoonBit Skills — Shared Post-Tool Verification (Shell)
#
# Called by Claude Code / Kimi Code / Codex CLI / Cursor / Gemini CLI
# PostToolUse / afterFileEdit / AfterTool hooks.
#
# Receives tool event JSON on stdin, runs lightweight MoonBit verification
# if the tool modified a .mbt/.mbti file, and outputs result as JSON.
#
# DESIGN PRINCIPLE (from skills/verify/SKILL.md):
#   "NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE"
#   — acceptable warnings, never acceptable errors.
#
# CANONICAL SOURCE: hooks/shared/verify-moonbit.ts
# This shell script reimplements the same logic for platforms that cannot
# run TypeScript directly. When updating verification logic, keep both
# implementations in sync — same error regex, same warning regex, same
# exit-code semantics (2 = block, 0 = allow).
#
# Output format (stdout JSON):
#   Claude Code/Codex/Kimi: exit code 2 = block, 0 = allow; stderr shown to model
#   Gemini CLI: JSON with hookSpecificOutput.additionalContext
#   Cursor: JSON on stdout
#
# To keep it simple and cross-platform: output JSON to stdout with both
# "additionalContext" (Gemini) and "reason" (generic), and use exit code
# 2 for errors (Claude Code/Kimi/Codex block model).
set -euo pipefail

# Parse stdin JSON to get tool name and file path
# Uses python3 for JSON parsing (available on all platforms with moon installed)
INPUT=$(cat)

# Extract tool_name and file_path from JSON
TOOL_NAME=$(echo "$INPUT" | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    tool = data.get('tool_name', data.get('toolName', data.get('tool', '')))
    print(tool)
except: print('')
" 2>/dev/null || echo "")

FILE_PATH=$(echo "$INPUT" | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    ti = data.get('tool_input', data.get('toolInput', data.get('input', {})))
    fp = ti.get('file_path', ti.get('path', ti.get('filePath', '')))
    print(fp)
except: print('')
" 2>/dev/null || echo "")

# Only check after write/edit operations on MoonBit files
case "$TOOL_NAME" in
  write|edit|Write|Edit|write_file|edit_file|str_replace_editor|create_file)
    ;;
  *)
    exit 0
    ;;
esac

# Check if file is a MoonBit source file
case "$FILE_PATH" in
  *.mbt|*.mbti)
    ;;
  *)
    exit 0
    ;;
esac

# Find MoonBit project root
PROJECT_ROOT=""
DIR=$(dirname "$FILE_PATH" 2>/dev/null || echo ".")
for i in $(seq 1 20); do
  if [ -f "$DIR/moon.mod.json" ] || [ -f "$DIR/moon.mod" ]; then
    PROJECT_ROOT="$DIR"
    break
  fi
  PARENT=$(dirname "$DIR")
  [ "$PARENT" = "$DIR" ] && break
  DIR="$PARENT"
done

[ -z "$PROJECT_ROOT" ] && exit 0

cd "$PROJECT_ROOT"

# Run verification
ERRORS=""
WARNINGS=""
HAS_ERRORS=0

# 1. Format check (warning — auto-fixable)
if ! moon fmt --check 2>/dev/null; then
  WARNINGS="${WARNINGS}Format check failed — run \`moon fmt\` to auto-fix\n"
fi

# 2. Type check (error — must be zero errors)
# NOTE: Do NOT use || true here — we need the real exit code
CHECK_OUTPUT=$(moon check --target native --warn-list +73 2>&1)
CHECK_EXIT=$?
if [ "$CHECK_EXIT" -ne 0 ]; then
  HAS_ERRORS=1
  # Parse output for errors vs warnings
  while IFS= read -r line; do
    line=$(echo "$line" | tr -d '\r')
    [ -z "$line" ] && continue
    if echo "$line" | grep -qiE "error" && ! echo "$line" | grep -qiE "warning"; then
      ERRORS="${ERRORS}❌ ${line}\n"
    elif echo "$line" | grep -qiE "warning"; then
      WARNINGS="${WARNINGS}⚠️  ${line}\n"
    elif echo "$line" | grep -qE "^E[0-9]{4}"; then
      ERRORS="${ERRORS}❌ ${line}\n"
    fi
  done <<< "$CHECK_OUTPUT"

  # If no specific lines parsed, report whole output as error
  if [ -z "$ERRORS" ] && [ -z "$WARNINGS" ]; then
    ERRORS="❌ moon check failed — see output below\n"
    ERRORS="${ERRORS}$(echo "$CHECK_OUTPUT" | head -10 | sed 's/^/❌ /')\n"
  fi
fi

# Build result message
if [ "$HAS_ERRORS" -eq 1 ]; then
  MSG=$(printf "--- MoonBit Verification ---\n${ERRORS}${WARNINGS}Fix all errors above before presenting to the user.")
  # Output JSON for platforms that parse stdout (Gemini CLI, Cursor)
  python3 -c "
import json, sys
msg = sys.argv[1]
print(json.dumps({
    'hookSpecificOutput': {
        'additionalContext': msg
    },
    'reason': msg
}))
" "$MSG" 2>/dev/null || echo "{\"reason\":\"$MSG\"}"
  # Exit code 2 = block (Claude Code, Kimi Code, Codex CLI)
  exit 2
else
  if [ -n "$WARNINGS" ]; then
    MSG=$(printf "--- MoonBit Verification ---\n✅ No errors\n${WARNINGS}")
  else
    MSG="✅ MoonBit verification passed (fmt + check)"
  fi
  python3 -c "
import json, sys
msg = sys.argv[1]
print(json.dumps({
    'hookSpecificOutput': {
        'additionalContext': msg
    },
    'reason': msg
}))
" "$MSG" 2>/dev/null || echo "{\"reason\":\"$MSG\"}"
  exit 0
fi
