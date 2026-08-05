# Schemas — handoff artifact contracts

JSON Schemas for the pipeline's **handoff artifacts** (bus/orchestration model,
`references/orchestration-patterns.md`): the artifact schema IS the contract,
enforced at gates by `scripts/verify.mjs`.

| Schema | Producer | Consumer | Enforced by |
|--------|----------|----------|-------------|
| `prd.schema.json` | `pf-intent` | `pf-design`, `pf-build` | complexity gate + sign-off (Iron Law 1) |
| `component-manifest.schema.json` | `pf-design` | `pf-build` | manifest sign-off gate (Iron Law 1) |
| `audit-report.schema.json` | `scripts/verify.mjs` | release gate (`release-check.mjs`), `pf-verify` | exit code 1 on FAIL |

## Conventions

- Draft 2020-12; `additionalProperties: false` — drift from the contract is a
  finding, not a warning.
- The PRD `complexity` block encodes the pf-intent scoring gate
  (Light → direct path, Medium/Heavy → full path).
- The manifest `orchestration` block is a first-class field (entry points,
  chains, handoffs, conflicts) — it drives `using-<plugin>` bootstrap and
  per-skill "next steps" routing.

Validate a document with `npx ajv-cli validate -s schemas/<name>.schema.json -d <doc>`.
