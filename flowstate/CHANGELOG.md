# Changelog

All notable changes to flowstate are documented here. The format is based
on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.3.1] - 2026-09-05

### Added

- **`.agent-workplace` initializer scripts** — `scripts/fst-workplace-init.sh`
  and `scripts/fst-workplace-init.ps1`, an idempotent single entry point for
  workspace creation. Replaces the five manual steps (copy template → copy
  iteration → create `current` pointer → append `.gitignore` → recreate empty
  dirs) that every fst-* skill previously instructed the agent to perform by
  hand. The plugin root is resolved from the script's own location, so no
  `CLAUDE_PLUGIN_ROOT`-style environment variable is involved.
- **`current` pointer fallback chain** — `symlink` → NTFS `junction` → explicit
  path. Windows usually cannot create symlinks without developer mode or
  elevation, so `ln -sfn` silently degraded into a *directory copy*; junctions
  need no elevation. The resolved mode is recorded in
  `.agent-workplace/state/workspace.json` (`current_pointer.mode`), and
  `directory` / `explicit` modes tell skills to use explicit iteration paths.
- **SessionStart auto-initialization** — `hooks/session-start.*` now run the
  initializer before injecting context, so a workspace exists before any fst-*
  skill writes into it. Skipped when the directory has no project marker
  (`.git` / `package.json` / `Cargo.toml` / ...); opt out with
  `FLOWSTATE_AUTO_WORKPLACE=0`.
- `tests/workspace-init.test.mjs` — 19 cases covering template completeness,
  idempotency, repair reporting, `.gitignore` handling (including the
  non-ASCII regression), pointer modes, and the hook wiring, for both the bash
  and PowerShell variants.

### Fixed

- **Claude Code `hooks.json` load failure**: `PostCheckpoint` is not a
  supported Claude Code hook event — remapped to `PostCompact` (checkpoint =
  batch boundary = commit + session compaction); scripts renamed
  `post-checkpoint.*` → `post-compact.*`.
- **Workspace template was structurally incomplete**: `templates/agent-workplace/`
  shipped no `iterations/` or `scratch/` directory, because git does not track
  empty directories. The very completeness check that `fst-workplace` §1
  mandated (`iterations/`, `shared/`, `state/`, `scratch/`, `README.md`) could
  never pass straight after a template copy. Both directories now carry
  `.gitkeep`, and the initializer recreates them defensively.
- **PowerShell scripts with Chinese text were parsed as GBK mojibake**:
  Windows PowerShell 5.1 decodes a BOM-less `.ps1` using the ANSI codepage.
  `hooks/document-status-check.ps1` (143 non-ASCII chars) and
  `hooks/post-compact.ps1` (147) were affected; UTF-8 BOMs added to every
  `.ps1` containing non-ASCII text, with a regression test.
- **`state/workspace.json` written with a BOM** by the PowerShell variant
  (PS 5.1 `Set-Content -Encoding UTF8` adds one), breaking strict JSON
  parsers. Now written via `File::WriteAllText` with a BOM-free encoder.
- **PowerShell read a UTF-8 `.gitignore` as one line**: `Get-Content` without
  `-Encoding UTF8` decodes with the ANSI codepage on PS 5.1, and decoding UTF-8
  Chinese bytes as GBK swallows the following `\n`. The file collapsed into a
  single line, so the "entry already present" check silently failed and the
  `.agent-workplace/` line was appended a second time. Fixed in
  `scripts/fst-workplace-init.ps1`, plus the same latent bug in
  `hooks/post-compact.ps1` and `hooks/document-status-check.ps1` (they read
  `.agent-workplace/state/*.json` without an encoding).
- **Doc/script path drift**: `docs/agent-workplace.md` and
  `templates/iteration/README.md` placed `current` at the workspace root, while
  `fst-workplace` §3 and every placement table use `iterations/current`. All
  references now agree on `iterations/current`.

### Changed

- `fst-workplace` §1 and `fst-init` A1/B1 now call the initializer script
  instead of restating manual copy commands; `fst-workplace` §1 documents the
  four pointer modes and warns against hand-rolling `ln -sfn`.

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
  `task.schema.json` / commands / using-fst routing / README / CLAUDE
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
