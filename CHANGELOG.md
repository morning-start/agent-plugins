# Changelog

All notable changes to plugin-factory are documented here. The format is based
on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-08-02

**Baseline release: multi-harness scaffold, verifier engine, bootstrap
adapters, and safe release preparation are now executable and tested.**

### Added

- Multi-harness scaffold contract (`scripts/scaffold.mjs`) — single
  cross-platform renderer; `templates/shared/` + `templates/harnesses/*`
  produce only the requested harness artifacts; no dangling `pi.extensions` /
  `omp.extensions` paths; function-based substitution keeps user input
  byte-for-byte safe (`tests/scaffold/scaffold-contract.test.mjs`).
- Cross-platform verifier and lifecycle probes (`scripts/verify.mjs`) —
  structure / harness / orchestration layers with a stable finding schema and
  exit code 1 on any `FAIL`; Bash and PowerShell wrappers only forward
  arguments (`tests/verify/verify-engine.test.mjs`).
- Bootstrap adapters (`scripts/render-bootstrap.mjs` + `hooks/*`,
  `.pi/extensions/pf-bootstrap.ts`, `.opencode/plugins/pf-bootstrap.ts`) —
  single `PLUGIN_FACTORY_BOOTSTRAP:<plugin>` marker injected at most once per
  lifecycle phase; entry-skill body is never hand-copied
  (`tests/bootstrap/bootstrap-contract.test.mjs`).
- Release preparation gate (`scripts/release-check.mjs`) and version core
  (`scripts/version.mjs`) — strict SemVer, declared-manifest sync, CHANGELOG
  evidence, clean-worktree gate; no implicit tag/push
  (`tests/release/release-safety.test.mjs`).

### Changed

- `scripts/bump-version.sh` and `scripts/validate-structure.*` are now thin
  wrappers around the Node implementations (no duplicated shell parsing).
- `skills/pf-build`, `skills/pf-verify`, `skills/pf-lifecycle`,
  `commands/pf-release`, `commands/pf-verify`, `commands/pf-analyze` reference
  the executable gates instead of prose checklists.
- `references/plugin-model.md`, `references/plugins-reference.md`,
  `references/lifecycle-matrix.md`, `references/hooks/*` document the
  implemented artifact contract, probe names, and bootstrap invariants.
