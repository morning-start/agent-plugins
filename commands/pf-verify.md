---
description: Audit a plugin project against the quality bars — structure, Agent Skills compliance, multi-shell hooks.
---

# /pf-verify — Verification & audit

Load and follow `skills/pf-verify/SKILL.md`. Run:

1. `scripts/validate-structure.sh` (bash) or `scripts/validate-structure.ps1` (PowerShell).
2. The `pf-verify` audit: every SKILL.md frontmatter (name == dir, description ≤ 1024,
   "Use when…"), name uniqueness, hooks bash+PowerShell pairs, per-harness manifests.

Fix all FAIL findings before release. No audit pass → no release.
