---
name: pf-githooks
description: Use when a plugin project needs local git quality gates, when setting up commit-msg hooks to enforce Conventional Commits, when adding pre-commit hooks for lint or structure checks, when deciding where hooks live (core.hooksPath vs .git/hooks), when generated plugins should install their portable bash+PowerShell hook pairs, or when routed from /pf-githooks, pf-git, or using-pf.
tags: [pf, pf-githooks, git, hook, commit-msg, pre-commit, githooks]
metadata:
  prefix: pf
  lifecycle:
    status: active
    version: 0.1.0
    created: 2026-08-09
    updated: 2026-08-09
  keywords_zh: "git 钩子, commit-msg, pre-commit, 质量门, 提交规范, githooks"
---

# pf-githooks — Git Hooks (Local Quality Gates)

## Overview

Hooks make commit conventions **mechanical**: `commit-msg` enforces the
Conventional Commits subject format, `pre-commit` runs lint / structure checks
before anything is committed. They are local to each clone (not shared
automatically) — install them per repo.

## When to Use

- Setting up `commit-msg` / `pre-commit` hooks for a plugin project.
- Deciding where hooks live (tracked `githooks/` via `core.hooksPath` vs
  untracked `.git/hooks/`).
- Generated plugins carry portable hooks (bash + PowerShell pairs) — the user
  decides per-repo whether to install them.
- Routed from `/pf-githooks`, `pf-git`, or `using-pf`.

Do **not** use for general git discipline (branching / worktrees / commit
messages) — that is `pf-git`. Do not use for version management — that is
`pf-version`.

## Workflow

### 1. Where hooks live

- Default: git looks up hooks in `.git/hooks/` (untracked, per-clone).
- Tracked alternative: keep hook scripts in the repo (e.g. `githooks/`) and
  point git at them so every clone gets the same gates:
  `git config core.hooksPath githooks`.
- The scaffolded plugin keeps hooks portable: commit-msg/pre-commit are
  **bash + PowerShell pairs**; git runs hooks from `core.hooksPath`, so either
  place works.

### 2. commit-msg hook — Conventional Commits validation

Gate the commit **subject** format `type(scope)!: subject`:

```bash
#!/usr/bin/env bash
# githooks/commit-msg — reject non-Conventional-Commit subjects.
set -eu
msg="$(cat "$1")"
subject="$(printf '%s' "$msg" | head -n1)"
if ! printf '%s' "$subject" | grep -qE '^(feat|fix|docs|test|refactor|chore|perf)(\([a-z0-9-]+\))?!?: '; then
  echo "commit-msg: subject must match 'type(scope)!: subject'" >&2
  echo "  got: $subject" >&2
  exit 1
fi
```

- A `!` after the scope (or a `BREAKING CHANGE:` footer) marks breaking
  changes — the hook may additionally require a footer when the subject
  carries `!`.
- Keep the hook permissive on the body: only the subject is machine-checked
  here.

### 3. pre-commit hook — lint / structure gate

Run the project's fast checks before committing; fail the commit on any break:

```bash
#!/usr/bin/env bash
# githooks/pre-commit — structural gate before commit.
set -eu
npm run validate     # structure audit (Agent Skills standard)
```

- Prefer the fastest meaningful check (structure/lint), not the full suite —
  leave `npm test` to CI / the release gate unless the project explicitly
  wants it pre-commit.
- If a check is intentionally skipped on some commits (e.g. docs-only), gate
  it on the changed files (`git diff --cached --name-only`) rather than
  disabling the hook.
- Generated plugins include `hooks/pre-commit.sh` / `.ps1` (structural
  validation + basic secrets scan) — written but **not installed**
  automatically; the user decides per-repo.
  Reference: `references/hooks/claude-code.md` for installation.

### 4. Rules

- **Never install hooks implicitly** — the user decides whether a repo gets
  `commit-msg` / `pre-commit` hooks (per-repo config, may collide with their
  existing hooks).
- Always make hooks **non-destructive**: they reject, they never rewrite or
  amend. Let the developer fix the message / the code.
- Document the hooks in the repo (`githooks/README.md` or the project's
  `AGENTS.md` validation section) so the gates are discoverable.
- Hooks enforce, they do not replace: the same quality bars stay in `npm run
  validate` / `npm test` for CI regardless of local hooks.

## Outputs

- A `githooks/` (or `.git/hooks/`) directory with `commit-msg` + `pre-commit`
  hooks (bash + PowerShell pairs).
- `git config core.hooksPath githooks` set where hooks are tracked.
- Hook documentation in the repo (discoverable gates).

## Acceptance

- Commit subjects are machine-enforced to `type(scope)!: subject`.
- Pre-commit runs the fast structural gate and rejects on break.
- Hooks are non-destructive and never installed implicitly.
- Hooks are documented so the gates are discoverable.

## Status

New (2026-08-09) — split out of `pf-git` (§6) when git hooks grew into a
standalone concern.

## Iron Law

```
Never install hooks implicitly; hooks reject, they never rewrite.
```

## Red Flags — STOP and Rethink

- Installing hooks into a repo without asking
- A hook that rewrites / amends instead of rejecting
- Shipping hooks without documenting them

## 自检清单 (Post-routing Self-Check)

- [ ] Hooks installed only with user consent (per-repo)
- [ ] commit-msg enforces the subject format; pre-commit runs the fast gate
- [ ] Hooks are non-destructive and documented
