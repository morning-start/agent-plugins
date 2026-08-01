#!/usr/bin/env bash
# validate-structure.sh — structural checks for plugin-factory (M0).
# Mirrors scripts/validate-structure.ps1. Exit 1 on any failure.
set -u
fail=0
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
name_re='^[a-z0-9]+(-[a-z0-9]+)*$'

# --- skills ---
for dir in "$root"/skills/*/; do
  [ -d "$dir" ] || continue
  name="$(basename "$dir")"
  skill="$dir/SKILL.md"
  if [ ! -f "$skill" ]; then
    echo "FAIL: missing $skill"; fail=1; continue
  fi
  fm_name="$(awk 'NR<=15 && /^name:[[:space:]]*/{sub(/^name:[[:space:]]*/,""); print; exit}' "$skill")"
  fm_desc="$(awk 'NR<=15 && /^description:[[:space:]]*/{sub(/^description:[[:space:]]*/,""); print; exit}' "$skill")"
  if [ -z "$fm_name" ]; then
    echo "FAIL: $skill missing 'name' in frontmatter"; fail=1
  else
    if [ "$fm_name" != "$name" ]; then
      echo "FAIL: $skill name '$fm_name' != directory '$name'"; fail=1
    fi
    if ! printf '%s' "$fm_name" | grep -Eq "$name_re"; then
      echo "FAIL: $skill name '$fm_name' violates name regex"; fail=1
    fi
  fi
  if [ -z "$fm_desc" ]; then
    echo "FAIL: $skill missing 'description' in frontmatter"; fail=1
  else
    len="${#fm_desc}"
    if [ "$len" -gt 1024 ]; then
      echo "FAIL: $skill description too long ($len > 1024)"; fail=1
    fi
    case "$fm_desc" in
      "Use when"*) ;;
      *) echo "FAIL: $skill description must start with 'Use when'"; fail=1 ;;
    esac
  fi
done

# --- commands ---
for f in "$root"/commands/*.md; do
  [ -f "$f" ] || continue
  if ! head -5 "$f" | grep -q '^description:'; then
    echo "FAIL: $f missing frontmatter 'description'"; fail=1
  fi
done

# --- hooks: multi-shell pairs ---
for f in "$root"/hooks/*.sh; do
  [ -f "$f" ] || continue
  base="${f%.sh}"
  if [ ! -f "$base.ps1" ]; then
    echo "FAIL: $base.ps1 missing (hooks need bash + PowerShell pairs)"; fail=1
  fi
done

if [ "$fail" -eq 1 ]; then
  echo "Validation FAILED"
  exit 1
fi
echo "Validation OK"
