---
description: Release a plugin — run verification, run the release gate, bump SemVer across all manifests, update CHANGELOG, sync the bilingual README, then explicitly tag and push.
---

# /pf-release — Release

**Preparation is separated from publication.** The gate (`scripts/release-check.mjs`)
never creates tags or pushes remotes — those are explicit, user-confirmed steps.

## Prepare (safe, may run in a dirty or partially verified repo)

1. **Verify** — run `npm run verify` (exit 0 required). Any `FAIL` finding aborts.
2. **Release gate** — run `npm run release:check -- --json` (or
   `node scripts/release-check.mjs --root . --json`). It checks:
   - version sync across all declared manifests (`version-drift` fails);
   - no undeclared version references (`version:audit`);
   - the executable verifier passes (`verification-failed` fails);
   - a CHANGELOG entry exists for the current version (`missing-changelog-entry` fails);
   - every advertised harness manifest exists (`missing-harness-artifact` fails);
   - a clean git worktree (`dirty-worktree` fails).
3. **Version bump (SemVer)** — run `scripts/bump-version.sh <new-version>` (or
   `.ps1`): it bumps every declared manifest via `.version-bump.json`, then
   audits for undeclared references. Do **not** hand-edit versions.
4. **CHANGELOG** — add the entry for the new version (Conventional Commits;
   each entry follows the evidence narrative: bold conclusion + problem →
   root cause → fix → evidence). Record which lifecycle action drove the change
   (split / merge / reorganize / port / retire) when applicable.
5. **Bilingual README** — sync `README.md` (English) and `README.zh-CN.md`
   (Chinese edition); both must reflect the new version and features.
6. **Package (optional, gated)** — `npm run package` (or
   `node scripts/package-plugin.mjs --root .`) builds a distributable
   `<name>-v<version>.zip`; packaging **refuses to run when the structural +
   harness verifier has any FAIL finding** (validation is the quality gate,
   mirroring the release gate itself).
7. **Review the diff** — confirm the bump + docs changes look correct.

## Publish (explicit, only when the user requests distribution)

8. **Tag** — `git tag v<version>` (e.g. `v0.1.0`). Tagging is an explicit
   publication action, not a side effect of preparation.
9. **Push** — `git push` / `git push --tags` only when the user asked for
   distribution.

## Rules

- No verify pass → no release; the gate blocks drift, missing evidence, and
  dirty worktrees.
- Version must be **identical across every manifest** (drift = FAIL).
- The release gate never tags or pushes; publication steps are explicit.
- Docs stay English; the user-facing README keeps the Chinese edition in sync.
