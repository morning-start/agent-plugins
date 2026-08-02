# Release and Version Safety Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use a task-by-task implementation workflow with a review gate after every checkbox group.

**Goal:** Make release preparation deterministic, cross-platform, evidence-backed, and safe to run in a dirty or partially verified repository.

**Architecture:** Separate preparation from publication. A cross-platform Node release checker reads the declared manifest list, CHANGELOG, verifier result, worktree state, and advertised harness artifacts. Bash and PowerShell version wrappers call the same implementation.

**Tech Stack:** Node.js built-ins, Git CLI, Bash, PowerShell, SemVer validation without a new runtime dependency.

## Global Constraints

- Never hand-edit declared versions during release.
- No release preparation passes with version drift, missing declared files, missing CHANGELOG evidence, or a dirty worktree.
- Tagging and pushing are explicit publication actions, not implicit preparation side effects.
- The project must retain `package.json` and `.claude-plugin/plugin.json` as synchronized manifests.
- Generated projects must use the same release contract through their copied scripts.

## File Map

- Create `scripts/version.mjs`: strict SemVer parsing, read/write declared fields, check, and audit.
- Create `scripts/bump-version.ps1`: PowerShell wrapper.
- Modify `scripts/bump-version.sh`: Bash wrapper around `scripts/version.mjs`.
- Create `scripts/release-check.mjs`: release-preparation gate.
- Create `CHANGELOG.md`: evidence-based release history starting with version `0.1.0`.
- Modify `.version-bump.json`: declare all current version-bearing manifests and future generated manifest fields only when they exist.
- Modify `package.json`: add `version:check`, `version:audit`, and `release:check` scripts.
- Modify `commands/pf-release.md`: split prepare from publish and document exact failure conditions.
- Modify `README.md` and `README.zh-CN.md`: document the safe release flow.
- Create `tests/release/release-safety.test.mjs`: version and gate fixtures.

## Interfaces

Version CLI:

```text
node scripts/version.mjs check
node scripts/version.mjs audit
node scripts/version.mjs bump 0.1.1
```

Release gate CLI:

```text
node scripts/release-check.mjs --root . --json
```

A successful result is:

```json
{
  "ok": true,
  "version": "0.1.0",
  "findings": []
}
```

A failure contains stable signals such as:

```text
version-drift
missing-changelog-entry
dirty-worktree
missing-harness-artifact
verification-failed
```

## Implementation Tasks

- [ ] **Step 1: Add failing version fixtures**

Cover:

- valid `0.1.0`, `1.2.3`, and prerelease `1.2.3-beta.1`;
- rejection of `1.2`, `1.2.3foo`, and empty versions;
- missing declared file;
- drift across two manifests;
- undeclared version reference.

Run:

```text
node --test tests/release/release-safety.test.mjs
```

Expected before implementation: FAIL because the cross-platform version implementation does not exist.

- [ ] **Step 2: Implement strict version core**

Implement `parseSemVer`, `readDeclaredVersions`, `checkVersions`, `auditVersions`, and `bumpVersions` in `scripts/version.mjs`. Preserve the existing `.version-bump.json` field format and reject missing or malformed fields instead of silently counting them as synchronized.

- [ ] **Step 3: Add Bash and PowerShell wrappers**

The wrappers must delegate to Node, preserve exit codes, and expose the existing commands:

```text
bump-version <X.Y.Z>
bump-version --check
bump-version --audit
```

- [ ] **Step 4: Implement release preparation checks**

`release-check.mjs` must run:

1. version check;
2. version audit;
3. executable verifier;
4. CHANGELOG entry check for the current version;
5. advertised-harness artifact check;
6. clean worktree check.

It must not create tags or push remotes.

- [ ] **Step 5: Separate publication instructions**

Update `/pf-release` into:

```text
1. verify
2. release-check
3. bump version
4. update CHANGELOG and bilingual README
5. review diff
6. explicitly tag
7. explicitly push when the user requested distribution
```

- [ ] **Step 6: Verify release behavior**

Run:

```text
node --test tests/release/release-safety.test.mjs
npm run version:check
npm run version:audit
npm run release:check -- --json
npm run validate
npm run validate:ps
```

Expected: the current repository reports any pre-existing dirty worktree as a release-blocking finding; version checks remain green.

## Acceptance Criteria

- Bash and PowerShell use the same version implementation.
- Invalid SemVer and missing fields fail instead of passing silently.
- Release preparation is blocked by a dirty worktree and missing evidence.
- No release command pushes or tags without an explicit publication step.
- CHANGELOG and README requirements are mechanically checked.

## Non-goals

- Do not implement marketplace publishing.
- Do not add signing, SLSA, or external CI services in this task.
- Do not delete user changes to make the worktree clean.
