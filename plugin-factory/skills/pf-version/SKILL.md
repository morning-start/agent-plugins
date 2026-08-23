---
name: pf-version
description: Use when deciding the next SemVer version from git history, when classifying commits into major/minor/patch, when bumping declared manifest versions across all files, when writing the CHANGELOG entry for a release, when preparing a release with commit-backed evidence, or when routed from /pf-version, pf-git, pf-release, or using-pf (S9).
tags: [pf, pf-version, semver, version, changelog, bump, release]
metadata:
  prefix: pf
  lifecycle:
    status: active
    version: 0.1.0
    created: 2026-08-09
    updated: 2026-08-09
  keywords_zh: "版本管理, 语义化版本, SemVer, 版本递增, CHANGELOG, 发布准备"
---

# pf-version — Version Management (from git history)

## Overview

Decide the next version **from git history**, not from desire: establish the
git baseline → classify commits (Conventional Commits) → decide SemVer →
bump every declared manifest → write the CHANGELOG entry → verify and hand
off to publication.

Version arithmetic and manifest sync are **delegated to the existing engine**
(`tools/version/version.mjs` via `tools/version/bump-version.sh` / `.ps1`); never hand-edit
versions or re-parse manifests in shell.

## When to Use

- The user asks "bump the version" / "what should the next version be".
- A release is being prepared and the version + CHANGELOG entry must be decided
  from git history.
- Routed from `/pf-version`, `pf-git`, `/pf-release`, or `using-pf` (S9).

Do **not** use for git discipline (branches / worktrees / commit messages) —
that is `pf-git`. Do not use for git hooks — that is `pf-githooks`.

## Workflow

### 1. Establish the git baseline

- Find the last release tag: `git describe --tags --abbrev=0` (fallback: none).
- Inspect the range since that tag: `git log <last-tag>..HEAD --oneline`.
- Check the worktree: `git status --porcelain` — dirty worktree is recorded as
  context for the release gate (it blocks publication, not version planning).

### 2. Classify changes (Conventional Commits)

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

### 3. Decide the next SemVer

- `current = node tools/version/version.mjs check` (exit 0 → read `version`).
- Apply the table above; default proposal = highest effect present
  (breaking > feature > fix).
- Present the proposal with its commit evidence; **the user confirms** the
  final version (key decision — Iron Law 4).

### 4. Bump every declared manifest

```text
node tools/version/version.mjs bump <X.Y.Z>      # or:
bash tools/version/bump-version.sh <X.Y.Z>       # or:
powershell -File tools/version/bump-version.ps1 <X.Y.Z>
```

- Do **not** hand-edit versions. The engine writes every field declared in
  `.version-bump.json`.
- Confirm with `npm run version:check` (all manifests in sync) and
  `npm run version:audit` (no undeclared references).

### 5. Write the CHANGELOG entry (feature comments)

Add a section under `## [<version>] - <date>` in `CHANGELOG.md`:

- **Bold one-line conclusion** of what changed.
- A list of user-visible feature comments grouped by type
  (`feat`, `fix`, `breaking`), each **grounded in the commits** from step 2.
- Evidence narrative for non-trivial changes: problem → root cause → fix →
  evidence (test/eval result or issue ref).
- Record which lifecycle action drove the change (split / merge / reorganize /
  port / retire) when applicable.

The CHANGELOG is the release evidence — `tools/release/release-check.mjs` fails when
the current version has no entry.

### 6. Verify and hand off to publication

- Run `npm run verify` (structure + harness + orchestration; exit 0).
- Run the release gate: `node tools/release/release-check.mjs --root . --json`.
- **Publication is explicit**: tagging (`git tag v<version>`) and pushing
  happen only when the user asks — this skill never tags or pushes implicitly.

## Outputs

- Next-version decision backed by commit evidence.
- All declared manifests bumped to the same version.
- CHANGELOG entry (feature comments) for the new version.
- Verification + release-gate status.

## Acceptance

- Version bump is derived from git history (never arbitrary).
- All declared manifests are in sync (`version:check` OK; `version:audit` OK).
- CHANGELOG has an entry for the new version that passes `release-check`.
- No tag or push happened without explicit user confirmation.
- No shell-side version parsing duplicated the engine.

## Status

New (2026-08-09) — split out of `pf-git` (§4) when version management became
a standalone concern; also provides the long-referenced `/pf-version` command.

## Iron Law

```
Never bump version from desire alone — every bump must be commit-backed.
```

## Red Flags — STOP and Rethink

- Editing versions by hand instead of using the engine
- Bumping without commit evidence
- Implicitly tagging or pushing without user confirmation

## 自检清单 (Post-routing Self-Check)

- [ ] Version bump has commit evidence
- [ ] All manifests are in sync (version:check OK)
- [ ] CHANGELOG has a feature-comment entry
- [ ] No tag/push without explicit user confirmation
