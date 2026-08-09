---
description: Analyze how existing skills should evolve — split, merge, reorganize, port, retire, or bundle into plugins — via pure-structural lifecycle probes and bundle recommendation.
---

# /pf-analyze — Lifecycle analysis

Load and follow `skills/pf-lifecycle/SKILL.md` and the decision matrix in
`references/lifecycle-matrix.md`.

1. Run the executable lifecycle probes:
   `npm run lifecycle` (table) or `node scripts/verify.mjs lifecycle --root <dir> --format json`.
2. The engine produces severity-ranked {signal, file, severity, action, impact}
   findings with the documented exit behavior (exit 1 on FAIL).
3. **Bundle recommendation (optional)** — when the target is a directory of
   standalone skills: run `node scripts/recommend-bundles.mjs --root <dir>
   --output-md bundle-report.md --output-json bundle-report.json` (Stage-1
   deterministic clustering), then review the JSON with the `bundle-advisor`
   role (Stage-2 qualitative review) before proposing groupings.
4. Present the findings to the user; **wait for confirmation** before executing
   anything.
5. Route approved actions through `/pf-design` → `/pf-build` → `/pf-verify`.
