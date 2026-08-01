---
description: Create a new agent plugin end-to-end: intent interview → PRD → complexity gate → design → build → verify → release.
---

# /pf-new — Full plugin creation workflow

Run the complete plugin-factory workflow. Do NOT scaffold anything before the PRD is signed off.

## Steps

1. **Intent** — load and follow `skills/pf-intent/SKILL.md`: structured interview
   (one question at a time), one-page PRD, complexity verdict, user sign-off.
2. **Route by gate** —
   - Light → go to **Build** (`/pf-build`) directly.
   - Medium/Heavy → go to **Design** (`/pf-design`), then Build, then Verify.
3. **Build** — generate the standalone plugin project; delegate each skill to
   skill-creator's create → test → evaluate → iterate loop.
4. **Verify** — run `scripts/validate-structure.sh` (or `.ps1`) and the `pf-verify`
   audit; fix all findings before release.
5. **Release** — `/pf-release`: SemVer bump, CHANGELOG, bilingual README, install scripts.

## Rules

- No PRD, no design; no manifest, no build; no audit pass, no release.
- User signs off only key decisions: PRD, complexity gate, manifest, lifecycle advice.
