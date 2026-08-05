# plugin-factory Delivery Tasks

> **For agentic workers:** Execute tasks in dependency order. Each task is independently reviewable and must pass its acceptance checks before the next task starts.

**Goal:** Close the gap between plugin-factory's documented multi-harness workflow and its executable generator, verification, bootstrap, release, and dogfood paths.

**Architecture:** Keep one canonical skill/document source and render harness-specific artifacts from it. Move structural and lifecycle checks into one cross-platform Node implementation; Bash and PowerShell remain thin entrypoint wrappers. Treat generated-plugin smoke tests as the release contract.

**Tech Stack:** Existing Node.js runtime, Bash, PowerShell, TypeScript extensions, Node built-in `node:test` and `assert`; no runtime dependencies added unless a task explicitly proves one is required.

## Global Constraints

- Supported harnesses are Claude Code, pi, opencode, and oh-my-pi.
- Skills are authored once under the canonical `skills/` tree; do not create per-harness skill-body copies.
- Claude shell hooks require `.sh` and `.ps1` implementations; pi, oh-my-pi, and opencode use TypeScript adapters.
- Generated projects must not advertise a harness unless its manifest, bootstrap, skill discovery path, and smoke check are present.
- `skill-creator` remains the authority for skill authoring and evaluation; plugin-factory must not hand-write generated skill content as a substitute.
- Do not auto-install external tools or modify user-global configuration.
- Every task must leave a runnable, testable repository state.

## Execution Order

| ID | Priority | Deliverable | Depends on |
|---|---|---|---|
| T1 | P0 | Multi-harness scaffold contract | None |
| T2 | P0 | Cross-platform verifier and lifecycle probes | T1 interfaces |
| T3 | P1 | Reliable bootstrap injection | T1 |
| T4 | P1 | Release and version safety | T2 |
| T5 | P1 | Dogfood and end-to-end smoke tests | T1–T4 |
| T6 | P2 | Documentation/status synchronization | T1–T5 evidence |

## Definition of Done

- A generated project contains only the harness artifacts it advertises.
- `npm run validate` and `npm run validate:ps` invoke the same checks and produce the same result.
- `pf-verify` and `pf-analyze` can emit machine-readable findings and non-zero exit codes for release-blocking defects.
- A clean session on each installed harness receives the complete `using-<plugin>` bootstrap exactly once per lifecycle phase.
- Release preparation rejects version drift, missing CHANGELOG evidence, dirty worktrees, and missing advertised-harness artifacts.
- The dogfood fixture can be generated, validated, bootstrapped, and audited without manual file copying.

## Task Documents

- [T1 — Multi-harness scaffold contract](01-scaffold-contract.md)
- [T2 — Verifier and lifecycle probes](02-verifier-engine.md)
- [T3 — Bootstrap adapters and injection](03-bootstrap-adapters.md)
- [T4 — Release and version safety](04-release-safety.md)
- [T5 — Dogfood and smoke tests](05-dogfood-smoke.md)
- [T6 — Documentation and status synchronization](06-docs-sync.md)

## Completion Evidence (T1–T6, 2026-08-02)

All six tasks are implemented and verified with the following evidence:

| Task | Evidence (commands / tests) | Result |
|------|------------------------------|--------|
| T1 scaffold contract | `node --test tests/scaffold/scaffold-contract.test.mjs` | 7/7 pass |
| T2 verifier engine | `node --test tests/verify/verify-engine.test.mjs` · `npm run validate` · `npm run validate:ps` · `npm run verify:json` · `npm run lifecycle` | 8/8 pass; bash/ps1 equivalent |
| T3 bootstrap adapters | `node --test tests/bootstrap/bootstrap-contract.test.mjs` · `node --check` on all TS adapters · shell parity (bash + ps1 emit identical marker/body) | 7/7 pass |
| T4 release safety | `node --test tests/release/release-safety.test.mjs` · `npm run version:check` · `npm run version:audit` · `npm run release:check -- --json` | 8/8 pass; release gate blocks dirty worktree |
| T5 dogfood smoke | `npm run smoke` (static) · `npm run smoke:live` (optional CLI lanes, SKIP when absent) | 2/2 pass |
| T6 docs sync | `npm test` (all suites) · `npm run validate` · `npm run validate:ps` · `npm run verify:json` · `npm run smoke` | all green |

Key implementation notes:

- One canonical engine per concern: `scripts/scaffold.mjs` (renderer),
  `scripts/verify.mjs` (structure/harness/lifecycle), `scripts/render-bootstrap.mjs`
  (entry-skill marker), `scripts/version.mjs` + `scripts/release-check.mjs`
  (version/release gate). Bash and PowerShell are thin argument-forwarding wrappers.
- `npm run validate` and `npm run validate:ps` invoke the same Node engine and
  produce the same result (verified on Windows).
- The dogfood fixture `git-release` is generated into a clean temp target,
  validated, bootstrapped, and audited without manual file copying
  (`tests/smoke/dogfood-smoke.test.mjs`).
- A pre-existing dirty worktree is correctly reported as a release-blocking
  finding by `release-check`; version checks remain green.

## Remaining scope (not part of T1–T6)

- Runtime telemetry / usage-based lifecycle signals (trigger frequency, eval pass
  rate) — documented as future signals in `references/lifecycle-matrix.md`.
- Live harness load checks require the harness CLI installed on the developer
  machine; `npm run smoke:live` reports `SKIP` when a CLI is unavailable.
- `skills-lock.json` / `.agents/skills/` vendor directory is gitignored; the
  `pf-*` opencode discovery copy lives under `.opencode/skills/`.

## Existing Baseline Evidence

The following checks passed before these tasks are implemented:

```text
npm run validate:ps                         -> Validation OK
bash scripts/bump-version.sh --check       -> declared versions are in sync
bash scripts/bump-version.sh --audit       -> No undeclared references
node --check .pi/extensions/pf-bootstrap.ts -> pass
```

These checks cover only the current baseline. They do not prove generated-project validity, cross-harness loading, lifecycle probes, or behavior-level bootstrap injection.
