# Changelog

All notable changes to flowstate are documented here. The format is based
on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0] - 2026-08-23

**Single-source refactor: 7-skill pipeline, inlined strategy selection,
analysis/research skill, and single-manifest design — grounded in the
0.1.0 → 0.2.0 commit range.**

### Added

- **`fst-research` skill** (cross-cutting investigation → analysis → report):
  research cache lands in `.agent-workplace/research/`, analysis report in
  `.agent-workplace/report/`; invoked by fst-init / fst-change / fst-iterate /
  fst-review for tech selection, solution comparison, impact exploration, and
  root-cause investigation (`NO RESEARCH, NO ANALYSIS; NO EVIDENCE, NO
  CONCLUSION`). Routing + architecture + workplace + README/CLAUDE updated to
  7 skills.
- **`docs/architecture.md`** — authoritative layer model and responsibility
  contract (entry / lifecycle / cross-cutting infra / execution methods /
  contract validation), N1~N9 ownership matrix, trivial-diff boundary, artifact
  ownership, maintenance rules.
- Skill contract tests wired to all skills (schema fixtures + per-skill
  validation), plus full README visual assets (hero, section headers, skill
  badges).
- N9 emergency path hardened: Hotfix must write an emergency checkpoint
  before fixing (`state/checkpoint.json`), backfill the change record ≤24h.

### Changed

- **Strategy selection inlined into `fst-iterate`** — the internal
  `fst-mode-router` skill is removed; `fst-iterate` now distinguishes
  lightweight todo (trivial diff) from formal strategies (`spec` / `loop` /
  `graph`) and confirms formal strategy with the user. `plan.schema.json` /
  `task.schema.json` / commands / using-flowstate routing / README / CLAUDE
  aligned (formal plan allows `spec`/`loop`/`graph` only).
- **Single manifest design** — root `plugin.json` removed; Claude Code reads
  `.claude-plugin/plugin.json`, pi/omp read `package.json`
  (`pi.skills`/`omp.skills`), opencode self-registers the single root `skills/`
  via `.opencode/plugins/fst-bootstrap.ts` (superpowers-style, no per-harness
  copies). Dual-manifest sync language removed from README/CLAUDE.
- **opencode runtime self-registration** — skill source registered by the
  bootstrap `config` hook instead of copying skills under a per-harness
  directory; descriptions updated to single-source wording everywhere.
- **Mode definitions moved out of the workspace** — operation modes live in
  `references/agent-modes/` (todo/spec/goal/graph, plugin-bound) and the
  process framework in `references/flow-graph.md`; `.agent-workplace/` and
  templates no longer carry mode copies (single point of maintenance).
- Planning vs execution separation enforced (docs pass): `fst-change` plans &
  constrains only, `fst-iterate` is the single execution entry; PreCommit gate
  blocks `.agent-workplace/` from commits and scans for secrets.
- Hook JSON escaping fixed for shell + PowerShell variants; opencode skill
  files completed.

### Removed

- `skills/fst-mode-router/` (strategy selection inlined into `fst-iterate`).
- Root `plugin.json` (single manifest design; pi/omp carried by
  `package.json`).
