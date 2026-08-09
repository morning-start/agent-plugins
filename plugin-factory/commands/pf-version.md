---
description: Decide and apply the next SemVer from git history — classify commits, bump every declared manifest, write the CHANGELOG entry, verify and hand off to publication.
---

# /pf-version — Version management

Load and follow `skills/pf-version/SKILL.md`. Workflow:

1. Establish the git baseline: last tag (`git describe --tags --abbrev=0`),
   commits since it, worktree state.
2. Classify commits (`feat!`→major, `feat`→minor, `fix`/`chore`/`docs`→patch).
3. Decide next SemVer; **user confirms**.
4. Bump: `node scripts/version.mjs bump <X.Y.Z>` (or `bump-version.sh/.ps1`);
   then `npm run version:check` and `npm run version:audit`.
5. Write the CHANGELOG entry (feature comments grounded in the commits);
   `release-check` requires this entry.
6. Verify + gate: `npm run verify` (exit 0) and
   `node scripts/release-check.mjs --root . --json`.
7. **Publication is explicit** — tag/push only on user request; never implicit.

Rules: no hand-edited versions; every bump commit-backed; no tag/push without
confirmation.
