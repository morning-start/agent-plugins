---
description: Audit a plugin project against the quality bars — structure, Agent Skills compliance, multi-shell hooks, per-harness artifacts, orchestration health.
---

# /pf-verify — Verification & audit

Load and follow `skills/pf-verify/SKILL.md`. Run the executable engine:

1. `npm run verify` — full audit (structure + harness + orchestration) as a
   severity-ranked table. Exit code 1 when any FAIL finding exists.
2. `npm run verify:json` — the same findings as machine-readable JSON
   (stable `signal` values; FAIL findings block release).
3. `npm run validate` (bash) / `npm run validate:ps` (PowerShell) — structural
   layer only; both invoke the same Node engine.

Fix all FAIL findings before release. No audit pass → no release.

## Static vs live smoke checks

- **Static** (`npm run smoke`): generates the dogfood fixture (`git-release`)
  into a clean temp target, asserts the file inventory, runs the generated
  project's own verifier, checks the bootstrap marker per adapter, and runs
  lifecycle probes. Always runs, no harness CLI required.
- **Live** (`npm run smoke:live`): detects each installed harness CLI; a lane
  that cannot run reports `SKIP` (never a failure). Live lanes only do a
  temporary project-scoped load check — global plugin config is never touched.
