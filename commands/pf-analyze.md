---
description: Analyze how existing skills should evolve — split, merge, reorganize, port, retire — via pure-structural lifecycle probes.
---

# /pf-analyze — Lifecycle analysis

Load and follow `skills/pf-lifecycle/SKILL.md` and the decision matrix in
`references/lifecycle-matrix.md`.

1. Run the executable lifecycle probes:
   `npm run lifecycle` (table) or `node scripts/verify.mjs lifecycle --root <dir> --format json`.
2. The engine produces severity-ranked {signal, file, severity, action, impact}
   findings with the documented exit behavior (exit 1 on FAIL).
3. Present the findings to the user; **wait for confirmation** before executing
   anything.
4. Route approved actions through `/pf-design` → `/pf-build` → `/pf-verify`.
