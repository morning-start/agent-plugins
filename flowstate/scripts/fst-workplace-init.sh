#!/usr/bin/env bash
# flowstate — .agent-workplace initializer (idempotent).
#
# Usage:
#   fst-workplace-init.sh [--root DIR] [--iteration NNN] [--force] [--no-link]
#                         [--quiet] [--json]
#
# Contract (see skills/fst-workplace/SKILL.md):
#   1. copy templates/agent-workplace/ -> <root>/.agent-workplace/
#   2. copy templates/iteration/       -> .agent-workplace/iterations/iteration-NNN/
#   3. point .agent-workplace/iterations/current at the active iteration
#   4. ensure <root>/.gitignore contains the `.agent-workplace/` entry
#   5. ensure iterations/ + scratch/ exist (empty dirs do not survive git)
#
# The plugin root is resolved from this script's own location, so the script
# works regardless of where the plugin is installed (marketplace cache,
# ~/.claude/plugins/flowstate, a vendored copy, ...). No plugin-root env var
# is required — that indirection was the reason init used to be done by hand.
#
# Safe to run repeatedly: existing files are never overwritten unless --force.

set -eu

PLUGIN_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TPL_WP="$PLUGIN_ROOT/templates/agent-workplace"
TPL_IT="$PLUGIN_ROOT/templates/iteration"

ROOT="${FLOWSTATE_PROJECT_ROOT:-}"
ITER=""
FORCE=0
NO_LINK=0
QUIET=0
JSON=0
CONTEXT=0

usage() {
  cat <<'USAGE'
fst-workplace-init.sh — initialize .agent-workplace/ (idempotent)

  --root DIR        project root (default: $FLOWSTATE_PROJECT_ROOT or cwd)
  --iteration NNN   iteration to create/point at (default: latest, else 001)
  --force           overwrite existing files and re-point `current`
  --no-link         never create a symlink/junction; use explicit paths only
  --quiet           suppress human-readable output
  --json            emit a single-line JSON result (implies --quiet)
  --context         emit a one-line notice for hook additionalContext
                    (implies --quiet; used by hooks/session-start.sh)
  -h, --help        show this help
USAGE
}

while [ $# -gt 0 ]; do
  case "$1" in
    --root) ROOT="$2"; shift 2 ;;
    --root=*) ROOT="${1#*=}"; shift ;;
    --iteration) ITER="$2"; shift 2 ;;
    --iteration=*) ITER="${1#*=}"; shift ;;
    --force) FORCE=1; shift ;;
    --no-link) NO_LINK=1; shift ;;
    --quiet) QUIET=1; shift ;;
    --json) JSON=1; QUIET=1; shift ;;
    --context) CONTEXT=1; QUIET=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) printf 'fst-workplace-init: unknown option: %s\n' "$1" >&2; exit 2 ;;
  esac
done

[ -n "$ROOT" ] || ROOT="$PWD"
if [ ! -d "$ROOT" ]; then
  printf 'fst-workplace-init: project root does not exist: %s\n' "$ROOT" >&2
  exit 2
fi
ROOT="$(cd "$ROOT" && pwd)"

# --- helpers ---------------------------------------------------------------

WARNINGS=""
CREATED=""
note_warn() { WARNINGS="$WARNINGS|$1"; }
note_created() { CREATED="$CREATED|$1"; }

# JSON string escape: collapse newlines, escape backslash and double quote.
jstr() {
  printf '%s' "$1" | tr '\n' ' ' | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g'
}

# JSON array from a |-separated list.
jarr() {
  local list="$1" out="" IFS='|' item first=1
  for item in $list; do
    [ -n "$item" ] || continue
    if [ "$first" -eq 1 ]; then first=0; else out="$out,"; fi
    out="$out\"$(jstr "$item")\""
  done
  printf '[%s]' "$out"
}

sect() { [ "$QUIET" -eq 1 ] || printf '%s\n' "$1"; }

# Is the directory a plausible project root?
has_project_marker() {
  local d="$1" m
  for m in .git package.json pyproject.toml Cargo.toml go.mod pom.xml \
           build.gradle build.gradle.kts CMakeLists.txt README.md .claude; do
    [ -e "$d/$m" ] && return 0
  done
  case "$d" in
    *.sln) return 0 ;;
  esac
  for m in "$d"/*.sln; do [ -e "$m" ] && return 0; done
  return 1
}

count_files() { if [ -d "$1" ]; then find "$1" -type f | wc -l | tr -d ' '; else printf '0'; fi; }

copy_tree() { # src -> dst, never clobbering unless FORCE
  local src="$1" dst="$2"
  mkdir -p "$dst"
  if [ "$FORCE" -eq 1 ]; then
    cp -R "$src/." "$dst/"
  else
    cp -Rn "$src/." "$dst/" 2>/dev/null || cp -R "$src/." "$dst/"
  fi
}

ensure_gitignore() {
  local gi="$ROOT/.gitignore" line='.agent-workplace/'
  if [ ! -f "$gi" ]; then
    printf '# Agent 私有工作区（全部内容不提交，见 flowstate fst-workplace）\n%s\n' "$line" > "$gi"
    note_created ".gitignore"
    return 0
  fi
  if grep -Fqx "$line" "$gi" 2>/dev/null; then return 0; fi
  # Guard against a file with no trailing newline.
  local last
  last="$(tail -c 1 "$gi" 2>/dev/null || true)"
  if [ -n "$last" ]; then printf '\n' >> "$gi"; fi
  printf '# Agent 私有工作区（全部内容不提交，见 flowstate fst-workplace）\n%s\n' "$line" >> "$gi"
  note_created ".gitignore(+entry)"
}

latest_iteration() {
  local d="$1"
  [ -d "$d" ] || return 0
  ( cd "$d" 2>/dev/null || exit 0
    for x in iteration-*; do [ -d "$x" ] && printf '%s\n' "$x"; done ) \
    | sort | tail -n 1
}

# True when the path is an NTFS reparse point (symlink or junction).
is_reparse() {
  [ -d "$1" ] || return 1
  command -v fsutil >/dev/null 2>&1 || return 1
  local w
  w="$(cygpath -w "$1" 2>/dev/null || printf '%s' "$1")"
  fsutil reparsepoint query "$w" >/dev/null 2>&1
}

classify_pointer() {
  local p="$1"
  if [ -L "$p" ]; then printf 'symlink'
  elif [ -d "$p" ]; then
    if is_reparse "$p"; then printf 'junction'; else printf 'directory'; fi
  elif [ -e "$p" ]; then printf 'file'
  else printf 'missing'; fi
}

create_pointer() { # $1=link abs path  $2=target abs path  $3=relative target
  local link="$1" target="$2" rel="$3"
  [ "$NO_LINK" -eq 1 ] && return 1

  # 1) Native symlink with a *relative* target so the link survives a project
  #    move. Git Bash degrades `ln -s` to a recursive copy unless MSYS is told
  #    to use native links, hence the env override.
  if MSYS=winsymlinks:nativestrict ln -sfn "$rel" "$link" 2>/dev/null \
     && [ -L "$link" ]; then
    return 0
  fi
  rm -f "$link" 2>/dev/null || true
  rm -rf "$link" 2>/dev/null || true

  # 2) NTFS junction — no elevation required, directories only.
  if command -v cmd >/dev/null 2>&1 && command -v cygpath >/dev/null 2>&1; then
    local wl wt
    wl="$(cygpath -w "$link")" ; wt="$(cygpath -w "$target")"
    if cmd //c mklink /J "$wl" "$wt" >/dev/null 2>&1 && [ -d "$link" ]; then
      return 0
    fi
  fi
  return 1
}

# --- 0. preflight ----------------------------------------------------------

if [ ! -d "$TPL_WP" ]; then
  printf 'fst-workplace-init: template missing: %s\n' "$TPL_WP" >&2
  exit 3
fi

if [ "$FORCE" -eq 0 ] && ! has_project_marker "$ROOT"; then
  if [ "$CONTEXT" -eq 1 ]; then
    printf '[flowstate] workspace: 当前目录未检出项目标记，未自动初始化。需要时执行 flowstate/scripts/fst-workplace-init.sh --root <项目根> --force。\n'
  elif [ "$JSON" -eq 1 ]; then
    printf '{"status":"skipped","reason":"no_project_marker","project_root":"%s","next":"fst-workplace"}\n' "$(jstr "$ROOT")"
  else
    sect "flowstate: 未在项目根中检出到项目标记（.git / package.json / Cargo.toml / ...），跳过工作区初始化。如需强制初始化请加 --force。"
  fi
  exit 0
fi

# --- 1..5. initialize ------------------------------------------------------

WP="$ROOT/.agent-workplace"
STATUS="present"
if [ ! -d "$WP" ]; then
  mkdir -p "$WP"
  STATUS="initialized"
fi

# Detect genuine repairs (a template file that went missing) rather than
# reporting "present" whenever the directory merely exists.
BEFORE="$(count_files "$WP")"
copy_tree "$TPL_WP" "$WP"
AFTER="$(count_files "$WP")"
if [ "$AFTER" -gt "$BEFORE" ] && [ "$STATUS" = "present" ]; then STATUS="repaired"; fi

# Empty directories do not survive a git checkout, so recreate them defensively
# even when the template ships .gitkeep files.
for d in iterations shared shared/adr scratch state; do
  if [ ! -d "$WP/$d" ]; then mkdir -p "$WP/$d"; note_created ".agent-workplace/$d"; fi
done

ITERS="$WP/iterations"
if [ -n "$ITER" ]; then
  case "$ITER" in iteration-*) ITER_NAME="$ITER" ;; *) ITER_NAME="iteration-$ITER" ;; esac
else
  ITER_NAME="$(latest_iteration "$ITERS")"
  [ -n "$ITER_NAME" ] || ITER_NAME="iteration-001"
fi
ITER_DIR="$ITERS/$ITER_NAME"

if [ ! -d "$ITER_DIR" ]; then
  copy_tree "$TPL_IT" "$ITER_DIR"
  note_created ".agent-workplace/iterations/$ITER_NAME"
  [ "$STATUS" = "present" ] && STATUS="repaired"
fi

# `current` lives inside iterations/ (see fst-workplace §3 directory tree).
CURRENT="$ITERS/current"
POINTER_MODE="$(classify_pointer "$CURRENT")"

case "$POINTER_MODE" in
  symlink|junction)
    # Already a redirect — leave it alone unless --force asks to re-point.
    if [ "$FORCE" -eq 1 ]; then
      rm -f "$CURRENT" 2>/dev/null || true
      rm -rf "$CURRENT" 2>/dev/null || true
      if create_pointer "$CURRENT" "$ITER_DIR" "$ITER_NAME"; then
        POINTER_MODE="$(classify_pointer "$CURRENT")"
      else
        POINTER_MODE="explicit"
        note_warn "current 指针创建失败，请直接使用 iterations/$ITER_NAME 显式路径"
      fi
    fi
    ;;
  directory)
    if [ "$FORCE" -eq 1 ]; then
      rm -rf "$CURRENT" 2>/dev/null || true
      if create_pointer "$CURRENT" "$ITER_DIR" "$ITER_NAME"; then
        POINTER_MODE="$(classify_pointer "$CURRENT")"
      else
        POINTER_MODE="explicit"
      fi
    else
      note_warn "iterations/current 是真实目录（旧版 ln 退化产物），未自动替换；加 --force 可重建为链接（会先删除该目录下的现有内容，请先确认其中无未迁移产物）"
    fi
    ;;
  file)
    note_warn "iterations/current 是普通文件而非链接，请手动检查"
    ;;
  missing)
    if create_pointer "$CURRENT" "$ITER_DIR" "$ITER_NAME"; then
      POINTER_MODE="$(classify_pointer "$CURRENT")"
    else
      POINTER_MODE="explicit"
      note_warn "无法创建 current 链接（Windows 需开发者模式或管理员权限），已降级为显式路径模式"
    fi
    ;;
esac

ensure_gitignore

# Pointer metadata — durable source of truth for skills that need to resolve
# `current` without calling stat/classify logic themselves.
NOW="$(date -u +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || printf '')"
mkdir -p "$WP/state"
cat > "$WP/state/workspace.json" <<EOF
{
  "schema": "flowstate-workspace/1",
  "workspace": ".agent-workplace",
  "initialized_at": "$NOW",
  "current_iteration": "$ITER_NAME",
  "current_pointer": {
    "mode": "$POINTER_MODE",
    "path": "iterations/current",
    "target": "iterations/$ITER_NAME"
  },
  "gitignore_entry": true
}
EOF

# --- output ----------------------------------------------------------------

if [ "$CONTEXT" -eq 1 ]; then
  case "$STATUS" in
    initialized) printf '[flowstate] workspace: 已自动初始化 .agent-workplace/（迭代 %s，iterations/current = %s）。' "$ITER_NAME" "$POINTER_MODE" ;;
    repaired)    printf '[flowstate] workspace: 已修复 .agent-workplace/ 的缺失项（迭代 %s，iterations/current = %s）。' "$ITER_NAME" "$POINTER_MODE" ;;
    *)           printf '[flowstate] workspace: 已就绪（迭代 %s，iterations/current = %s）。' "$ITER_NAME" "$POINTER_MODE" ;;
  esac
  IFS='|'
  for w in $WARNINGS; do [ -n "$w" ] && printf ' 警告：%s。' "$w"; done
  unset IFS
  if [ "$POINTER_MODE" = "explicit" ] || [ "$POINTER_MODE" = "directory" ]; then
    printf ' 落点请用显式路径 .agent-workplace/iterations/%s/' "$ITER_NAME"
  fi
  printf '\n'
elif [ "$JSON" -eq 1 ]; then
  printf '{"status":"%s","project_root":"%s","workspace":".agent-workplace","current_iteration":"%s","pointer":{"mode":"%s","path":"iterations/current"},"gitignore_entry":true,"created":%s,"warnings":%s,"next":"fst-workplace"}\n' \
    "$STATUS" "$(jstr "$ROOT")" "$ITER_NAME" "$POINTER_MODE" \
    "$(jarr "$CREATED")" "$(jarr "$WARNINGS")"
else
  case "$STATUS" in
    initialized) sect "flowstate: 已初始化 .agent-workplace/（迭代 $ITER_NAME，current 模式 $POINTER_MODE）" ;;
    repaired)    sect "flowstate: 已修复 .agent-workplace/（补齐缺失项，迭代 $ITER_NAME，current 模式 $POINTER_MODE）" ;;
    *)           sect "flowstate: .agent-workplace/ 已就绪（迭代 $ITER_NAME，current 模式 $POINTER_MODE）" ;;
  esac
  IFS='|'
  for w in $WARNINGS; do
    [ -n "$w" ] && printf 'flowstate: 警告 — %s\n' "$w"
  done
  unset IFS
fi

exit 0
