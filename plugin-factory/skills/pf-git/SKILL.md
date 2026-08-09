---
name: pf-git
description: Use when a plugin project needs git engineering discipline, when creating or merging feature branches, when using git worktrees for parallel development, when writing or enforcing commit messages, when setting up git hooks for commit/merge quality gates, when managing version updates and feature changelogs from git history, when deciding the next SemVer from commits, when bumping declared manifest versions, when tagging a release, or when routed from /pf-git, /pf-release, or using-pf.
tags: [pf, pf-git, git, branch, worktree, semver, changelog, release, version]
metadata:
  prefix: pf
  lifecycle:
    status: active
    version: 0.1.0
    created: 2026-08-01
    updated: 2026-08-02
  keywords_zh: "git, 分支, worktree, 并行开发, 提交规范, 版本管理, 语义化版本, CHANGELOG, 发布"
---

# pf-git — Git Engineering Discipline

## Overview

The plugin-factory git engineering skill: feature-branch workflows, git
worktrees for parallel development, commit-message conventions, and
**version management driven by git history** (SemVer → manifest bump →
CHANGELOG → release gate → explicit tag), shared across plugin-factory
workflows (`pf-build`, `using-pf` S9, future engineering plugins).

Version arithmetic and manifest sync are **delegated to the existing engine**
(`scripts/version.mjs` via `scripts/bump-version.sh` / `.ps1`); never hand-edit
versions or re-parse manifests in shell.

## When to Use

- The user asks to branch, merge, work in parallel, or follow a consistent
  commit convention.
- A feature needs parallel development without blocking the main line
  (worktree).
- The user asks "bump the version" / "what should the next version be".
- A release is being prepared and the version + CHANGELOG entry must be decided
  from git history.
- Routed from `/pf-git`, `/pf-release`, or `using-pf` (S9).

Do **not** use for structural-only verification (`pf-verify`) or single-skill
lifecycle decisions (`pf-lifecycle`). Do not create a worktree/branch without a
clear feature scope — branch per feature, not per whim.

## Workflow

### 1. Branch workflow

- Confirm the repo: `git rev-parse --is-inside-work-tree`.
- Work on a **feature branch** per feature, never directly on the main line:
  `git switch -c feat/<scope>-<short-name>` (or `fix/`, `docs/`, `chore/`).
- Keep commits **atomic**: one logical change per commit; the commit message
  explains WHY, not just what.
- Merge back via the project's flow: `git switch <main>` →
  `git merge --no-ff feat/<name>` (keeps history) or rebase when the project
  prefers linear history. Delete the branch after merge
  (`git branch -d feat/<name>`).

### 2. Worktree — parallel development

Use `git worktree` when multiple features or tasks must proceed in parallel
without blocking each other:

- Add a worktree for a feature: `git worktree add ../<plugin>-<feat> -b feat/<name>`.
- Each worktree is an independent checkout sharing the same repo; develop,
  test, and commit there without disturbing the main worktree.
- Merge the feature back from its worktree (`git switch <main>` in the primary
  checkout → `git merge --no-ff feat/<name>`).
- Clean up when done: `git worktree remove <path>` (and prune:
  `git worktree prune`).
- Rules:
  - Do **not** create a worktree without a feature scope; name it after the
    feature.
  - Never leave stale worktrees lying around — remove them after the branch is
    merged.
  - The worktree path must not collide with the plugin root or the generated
    target directory.

### 3. Commit message convention (Conventional Commits)

Every commit subject follows `type(scope)!: subject`:

| Type | Meaning | Example |
|------|---------|---------|
| `feat` | new capability | `feat(release): add pre-release checklist` |
| `fix` | bug fix | `fix(bump): handle missing manifest` |
| `docs` / `test` / `refactor` / `chore` / `perf` | non-behavioral | `docs(glossary): add pf-git terms` |
| `!` or `BREAKING CHANGE:` footer | breaking | `feat!(api): rename scaffold entry` |

- The `!` or a `BREAKING CHANGE:` footer marks breaking changes — these drive
  the major-version decision below.
- Atomic commits with honest types keep the version/CHANGELOG evidence
  truthful.

### 4. Version management (from git history)

### 4.1 Establish the git baseline

- Find the last release tag: `git describe --tags --abbrev=0` (fallback: none).
- Inspect the range since that tag: `git log <last-tag>..HEAD --oneline`.
- Check the worktree: `git status --porcelain` — dirty worktree is recorded as
  context for the release gate (it blocks publication, not version planning).

### 4.2 Classify changes (Conventional Commits)

Read the commit subjects and group them:

| Type | SemVer effect |
|------|---------------|
| `feat!` / breaking change (footer `BREAKING CHANGE:`) | **major** |
| `feat` | **minor** |
| `fix` / `perf` / `refactor` / `chore` / `docs` / `test` | **patch** |
| mixed / ambiguous | ask the user |

Rules:

- Parse the conventional-commit type from each subject; `!` or a
  `BREAKING CHANGE:` footer marks breaking.
- When the last tag is missing (first release), the plugin is still pre-1.0:
  breaking or feature work may stay `0.x` — propose a patch/minor and let the
  user confirm.
- Never invent a version bump from desire alone — every bump must be
  **supported by commits**.

### 4.3 Decide the next SemVer

- `current = node scripts/version.mjs check` (exit 0 → read `version`).
- Apply the table above; default proposal = highest effect present
  (breaking > feature > fix).
- Present the proposal with its commit evidence; **the user confirms** the
  final version (key decision — Iron Law 4).

### 4.4 Bump every declared manifest

```text
node scripts/version.mjs bump <X.Y.Z>      # or:
bash scripts/bump-version.sh <X.Y.Z>       # or:
powershell -File scripts/bump-version.ps1 <X.Y.Z>
```

- Do **not** hand-edit versions. The engine writes every field declared in
  `.version-bump.json`.
- Confirm with `npm run version:check` (all manifests in sync) and
  `npm run version:audit` (no undeclared references).

### 4.5 Write the CHANGELOG entry (feature comments)

Add a section under `## [<version>] - <date>` in `CHANGELOG.md`:

- **Bold one-line conclusion** of what changed.
- A list of user-visible feature comments grouped by type
  (`feat`, `fix`, `breaking`), each **grounded in the commits** from step 4.2.
- Evidence narrative for non-trivial changes: problem → root cause → fix →
  evidence (test/eval result or issue ref).
- Record which lifecycle action drove the change (split / merge / reorganize /
  port / retire) when applicable.

The CHANGELOG is the release evidence — `scripts/release-check.mjs` fails when
the current version has no entry.

### 4.6 Verify and hand off to publication

- Run `npm run verify` (structure + harness + orchestration; exit 0).
- Run the release gate: `node scripts/release-check.mjs --root . --json`.
- **Publication is explicit**: tagging (`git tag v<version>`) and pushing
  happen only when the user asks — this skill never tags or pushes implicitly.

### 5. One-time authorization commit protocol

For task-based development in the **target project** (git repo), ask once,
then automate — never nag per commit:

1. Check the target project's `AGENTS.md` for a recorded authorization
   (`auto-commit` / `auto-merge` grant).
2. **Already recorded** → automatically run, per accepted task:
   feature branch → single commit (one task per commit, Conventional Commits)
   → merge back to the main branch → delete the branch.
3. **Not recorded** → ask the user once; on approval, record the grant in the
   target project's `AGENTS.md` and apply the same flow from then on.
4. **User explicitly says "don't auto-commit / don't auto-merge"** in the
   current conversation → show the diff only, run no git commands.
5. Non-git target projects: show changes, never execute git commands.

Batch discipline: run at most **5 consecutive tasks** per batch, then stop,
report, and reach a **commit checkpoint** (verify + commit) before continuing
(≤3 if the platform cannot compact sessions). Run at most 5 tasks per batch.

### 6. Git hooks — local quality gates

Hooks make the conventions mechanical: **commit-msg** enforces Conventional
Commits, **pre-commit** runs lint / structure checks before anything is committed.
They are local to each clone (not shared automatically) — install them per repo.

### 6.1 Where hooks live

- Default: `git hooks` are looked up in `.git/hooks/` (untracked, per-clone).
- Tracked alternative: keep hook scripts in the repo (e.g. `githooks/`) and point
  git at them so every clone gets the same gates:
  `git config core.hooksPath githooks`.
- The scaffolded plugin keeps hooks portable: commit-msg/pre-commit are **bash +
  PowerShell pairs**; git runs hooks from `core.hooksPath`, so either place works.

### 6.2 commit-msg hook — Conventional Commits validation

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

- A `!` after the scope (or a `BREAKING CHANGE:` footer) marks breaking changes —
  the hook may additionally require a footer when the subject carries `!`.
- Keep the hook permissive on the body: only the subject is machine-checked here.

### 6.3 pre-commit hook — lint / structure gate

Run the project's fast checks before committing; fail the commit on any break:

```bash
#!/usr/bin/env bash
# githooks/pre-commit — structural gate before commit.
set -eu
npm run validate     # structure audit (Agent Skills standard)
```

- Prefer the fastest meaningful check (structure/lint), not the full suite —
  leave `npm test` to CI / the release gate unless the project explicitly wants
  it pre-commit.
- If a check is intentionally skipped on some commits (e.g. docs-only), gate it
  on the changed files (`git diff --cached --name-only`) rather than disabling
  the hook.
- Generated plugins include `hooks/pre-commit.sh` / `.ps1` (structural
  validation + basic secrets scan) — written but **not installed**
  automatically; the user decides per-repo.
  Reference: `references/hooks/claude-code.md` for installation.

### 6.4 Rules

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

- Consistent branch/worktree usage for parallel development.
- Conventional-Commit message discipline across changes.
- Next-version decision backed by commit evidence.
- All declared manifests bumped to the same version.
- CHANGELOG entry (feature comments) for the new version.
- Verification + release-gate status.

## Acceptance

- Feature branches are scoped per feature; worktrees are named, merged, and
  removed cleanly.
- Commit subjects follow Conventional Commits (`type(scope)!: subject`).
- Version bump is derived from git history (never arbitrary).
- All declared manifests are in sync (`version:check` OK; `version:audit` OK).
- CHANGELOG has an entry for the new version that passes `release-check`.
- No tag or push happened without explicit user confirmation.
- No shell-side version parsing duplicated the engine.

## Status

New — shared git engineering sub-skill of plugin-factory; a standalone
modern-engineering plugin may supersede it later.

## Iron Law

```
Never bump version from desire alone — every bump must be commit-backed.
```

## Red Flags — STOP and Rethink

- Editing versions by hand instead of using the engine
- Creating worktrees without a feature scope
- Implicitly tagging or pushing without user confirmation

## 自检清单 (Post-routing Self-Check)

- [ ] Version bump has commit evidence
- [ ] All manifests are in sync (version:check OK)
- [ ] CHANGELOG has a feature-comment entry
- [ ] No tag/push without explicit user confirmation
