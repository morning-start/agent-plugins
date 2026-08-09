---
name: pf-git
description: Use when a plugin project needs git engineering discipline, when creating or merging feature branches, when using git worktrees for parallel development, when writing or enforcing commit messages, when following the one-time authorization commit protocol, or when routed from /pf-git or using-pf. For version management use pf-version; for git hooks use pf-githooks.
tags: [pf, pf-git, git, branch, worktree, commit, parallel]
metadata:
  prefix: pf
  lifecycle:
    status: active
    version: 0.1.0
    created: 2026-08-01
    updated: 2026-08-09
  keywords_zh: "git, 分支, worktree, 并行开发, 提交规范, 提交协议"
---

# pf-git — Git Engineering Discipline

## Overview

The plugin-factory git engineering skill: feature-branch workflows, git
worktrees for parallel development, and commit-message conventions, shared
across plugin-factory workflows. Version management is split out to
`pf-version`; git hooks (commit-msg / pre-commit gates) to `pf-githooks`.

## When to Use

- The user asks to branch, merge, work in parallel, or follow a consistent
  commit convention.
- A feature needs parallel development without blocking the main line
  (worktree).
- Routed from `/pf-git` or `using-pf`.

Do **not** use for structural-only verification (`pf-verify`), single-skill
lifecycle decisions (`pf-lifecycle`), version decisions (`pf-version`), or
git hooks (`pf-githooks`). Do not create a worktree/branch without a clear
feature scope — branch per feature, not per whim.

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
  the major-version decision in `pf-version`.
- Atomic commits with honest types keep the version/CHANGELOG evidence
  truthful.

### 4. One-time authorization commit protocol

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

## Outputs

- Consistent branch/worktree usage for parallel development.
- Conventional-Commit message discipline across changes.

## Acceptance

- Feature branches are scoped per feature; worktrees are named, merged, and
  removed cleanly.
- Commit subjects follow Conventional Commits (`type(scope)!: subject`).
- The authorization protocol is asked once and recorded, never nagged.

## Status

Shared git engineering sub-skill of plugin-factory. Split 2026-08-09:
version management → `pf-version`; git hooks → `pf-githooks`.

## Iron Law

```
Branch per feature. One task per commit. Ask once, then automate.
```

## Red Flags — STOP and Rethink

- Creating worktrees without a feature scope
- Committing multiple logical changes in one commit
- Nagging per commit instead of asking once

## 自检清单 (Post-routing Self-Check)

- [ ] Feature branches scoped; worktrees named, merged, removed
- [ ] Commit subjects follow Conventional Commits
- [ ] Authorization recorded once; no nagging
