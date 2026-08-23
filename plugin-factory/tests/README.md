# tests/

Infrastructure tests for plugin-factory. Run with `npm test` (all files), or a
single file with `node --test <file>`.

## Per-harness verification (`harnesses/`)

Each supported harness gets **its own verification script**, invoked separately
— never one script that verifies all harnesses at once:

| Script | npm invocation |
|--------|----------------|
| `harnesses/claude-code.test.mjs` | `npm run test:harness:claude-code` |
| `harnesses/pi.test.mjs` | `npm run test:harness:pi` |
| `harnesses/opencode.test.mjs` | `npm run test:harness:opencode` |
| `harnesses/oh-my-pi.test.mjs` | `npm run test:harness:oh-my-pi` |
| `harnesses/codex.test.mjs` | `npm run test:harness:codex` |

`npm run test:harness` runs all five; `node --test tests/harnesses/<h>.test.mjs`
runs one. Shared boilerplate lives in `harnesses/harness-helpers.mjs` (not a
`*.test.mjs` file).

Each script verifies one harness end-to-end:
1. **Structure** — scaffold a plugin with *that harness alone*; assert its
   root-level artifacts exist and other harnesses' root artifacts are absent.
2. **Quick install** — `install.sh` / `install.ps1` advertise exactly that
   harness's install line (no other harness's), and `README.md` carries the
   harness's install section. Adapter specifics are also checked (e.g. claude
   `hooks.json` event names, pi/omp `package.json` fields + bootstrap marker,
   opencode `config`-hook self-registration).
3. **Self-verification** — the generated plugin passes its own
   `scripts/verify.mjs` (all layers, no FAIL findings).

Per-harness scripts are the canonical place for harness-specific structure and
install checks; keep them one-harness-only so a failure pinpoints the harness.

## Other test areas

- `scaffold/` — renderer contract tests (validation, determinism, autoVerify);
  harness artifact maps live in `harnesses/`, not here.
- `smoke/` — dogfood smoke test: generate one real plugin with the default
  claude-code harness and run it through the full pipeline (scaffold → verify →
  bootstrap → lifecycle).
- `verify/` — `scripts/verify.mjs` engine tests (hook-event whitelist, skill
  structure, coverage, entry/apply contracts).
- `hooks/` — pre-commit hook behavior (workspace boundary, secrets scan).
- `bootstrap/`, `complexity/`, `design/`, `evals/`, `learn/`, `lifecycle/`,
  `mcp/`, `pipeline/`, `release/`, `routing/` — behavior scenarios per
  capability area, following the writing-skills TDD methodology.

## Fixtures

- `fixtures/` — shared contract fixtures (`contract-valid/`, `contract-invalid/`,
  `verify-valid/`, `verify-invalid/`) used by the verify engine tests.
- `smoke/fixtures/` — entry-skill fixtures injected into the dogfood plugin.
