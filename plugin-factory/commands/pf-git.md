---
description: Apply git engineering discipline to a plugin project — feature branches, worktree parallel development, commit conventions, and version management driven by git history (SemVer → bump → CHANGELOG → release gate → explicit tag).
---

# /pf-git — Git engineering discipline

Load and follow `skills/pf-git/SKILL.md`. Workflow:

1. **Branch workflow** — feature branch per feature (`feat/<scope>-<name>`),
   atomic commits, `--no-ff` merge, delete after merge.
2. **Worktree parallel development** — `git worktree add <path> -b feat/<name>`
   for parallel features; merge back, then `git worktree remove` + prune.
3. **Commit convention** — Conventional Commits `type(scope)!: subject`;
   `!`/`BREAKING CHANGE:` marks breaking.
4. **Version from git history**:
   - git baseline — last tag, commits since it, worktree state.
   - classify commits (`feat!`→major, `feat`→minor, `fix`/`chore`/`docs`→patch).
   - decide next SemVer; **user confirms**.
   - `node scripts/version.mjs bump <X.Y.Z>` (or `bump-version.sh/.ps1`);
     then `npm run version:check` and `npm run version:audit`.
5. **CHANGELOG** — add `## [<version>] - <date>` with feature comments grounded
   in the commits; `release-check` requires this entry.
6. **Verify + gate** — `npm run verify` (exit 0) and
   `node scripts/release-check.mjs --root . --json`.
7. **Publication is explicit** — tag/push only on user request; never implicit.

No hand-edited versions; no tag/push without confirmation.
