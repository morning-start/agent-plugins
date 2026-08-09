# AGENTS.md — plugin-factory

## What this project is

**plugin-factory** is a meta-plugin: an agent plugin project that guides an agent to create
**new, standalone agent plugin projects** from a user's intent, goals, and scenarios.
The user only provides *what the plugin should do*; the agent drives everything else
through a software-development workflow (intent → design → build → verify → release → lifecycle).

Supported target harnesses for generated plugins: **Claude Code**, **pi**, **opencode**, **oh-my-pi**, **Codex/ChatGPT**. A harness is only advertised when its manifest, bootstrap adapter, skill discovery path, and smoke check are present (T1 contract, enforced by `scripts/scaffold.mjs`).

## How it works

A user runs `/pf-new` (or invokes the `pf-*` skills directly) and answers a structured
intent interview. The workflow then proceeds through these phases:

| Phase | Skill | Deliverable |
|-------|-------|-------------|
| 1. Intent | `pf-intent` | One-page PRD + complexity gate (Light → direct path, Medium/Heavy → full path) |
| 2. Design | `pf-design` | Component manifest (skills/hooks/commands/rules) + per-harness manifest specs |
| 3. Build | `pf-build` | Standalone plugin project; each skill is created via **skill-creator** (TDD loop); hooks/commands rendered for multiple shells |
| 4. Verify | `pf-verify` | Structural & compliance audit (Agent Skills standard, per-harness rules, multi-shell hooks) |
| 5. Release | `/pf-release` | SemVer bump, CHANGELOG, bilingual README, install scripts |
| 6. Lifecycle | `pf-lifecycle` | Pure-structural analysis recommending split / merge / reorganize / port / retire |

## Design principles (iron laws)

These are the binding constraints for every workflow step. When a skill or
generated artifact conflicts with them, the principles win — fix the skill.
Detailed rationale lives in `references/design-principles.md`.

1. **Intent first — no PRD, no work.** The signed-off one-page PRD is the only
   ticket into design and build. No PRD → no design; no signed-off component
   manifest → no build.
2. **Delegate, never reimplement.** Skill authoring, test cases, evaluation,
   and iteration are delegated to **skill-creator** (Anthropic). plugin-factory
   only orchestrates; it never hand-writes skill content as a substitute. Never
   auto-install skill-creator — remind the user and wait for their decision.
3. **Standard-driven rendering.** Skills are authored once to the **Agent
   Skills standard** and rendered per harness; adapters handle only the
   differences. Never fork the standard for one harness.
4. **Users make key decisions only.** The agent drives interviews, drafting,
   rendering, audits, and versioning. The user decides exactly four things:
   PRD sign-off, complexity verdict (Light/Medium/Heavy), component-manifest
   sign-off, and lifecycle recommendations (split/merge/reorganize/port/retire).
5. **One plugin = one fixed scenario.** A Skill is one atomic task; a Plugin is
   the complete task set for **one fixed business scenario** with a single entry
   (`using-<plugin>`) and one user goal. Multi-scenario aggregation is an
   anti-pattern: cross-scenario intents are split into separate plugins. New
   skills must pass the 6-dimension divergence check (D1–D6).
6. **Quality is mechanically enforced.** Every advertised harness, skill,
   command, hook, and JSON manifest must pass `scripts/verify.mjs` (structure +
   harness + orchestration layers). A `FAIL` finding blocks progress; exit 1.
7. **Language tiering.** Human-maintained layers (references/, docs/,
   CHANGELOG prose, user README) use the user's language; agent-executed layers
   (skill bodies, commands, AGENTS/CLAUDE, hooks/scripts) use English. Default
   `tiered`; user may choose all-English or all-native at intent time.
8. **Release safety.** Preparation is separated from publication: the release
   gate checks version sync, evidence, and a clean worktree, but tagging and
   pushing are explicit user-confirmed actions — never implicit side effects.

## User perspective (iron rule)

Whenever this project says **"user"**, it means the **end user of the target
plugin** — the person who will use the plugin that plugin-factory generates —
not plugin-factory's own operator. Every design, optimization, and quality
decision is made from that end user's point of view: the goal is to optimize
the **generated plugin's target project**, never plugin-factory itself.
This keyword is baked into every generated plugin's AGENTS.md (see
`templates/shared/AGENTS.md.tmpl`), so downstream plugins inherit the same
perspective: they serve their own end user, not the plugin-factory workflow.

## Instruction priority (conflict resolution)

When sources conflict, follow this order — higher wins:

1. The user's explicit instruction in the current conversation.
2. This file's repository-level constraints (iron laws above).
3. The matching `skills/<name>/SKILL.md` for the current task.
4. Background knowledge and examples in `references/`.

Each file keeps a single authority. Do not copy long workflows, command
tables, or directory trees into this file — read the authoritative source.
The routing data lives only in `scripts/routing-table.json`; the Skill
Priority + Trigger Matrix tables in `skills/using-pf/SKILL.md` are rendered
from it by `scripts/render-routing.mjs` (verify fails on drift). Other files
reference it, never duplicate it (avoids drift).

## This repo is a target instance

plugin-factory itself is also a target project: its own development follows
the same contracts it teaches — intent → design → build → verify → release,
verify before claiming completion, evidence-backed releases. All git commit
and acceptance conventions apply to this repository as well.

## Conventions

- **Naming**: all plugin-factory sub-skills use the `pf-` abbreviation prefix in both the
  directory name and the SKILL.md `name` field (`skills/pf-intent/SKILL.md` → `name: pf-intent`).
  Generated plugins should follow the same pattern with their own project prefix.
- **Skills**: canonical location is the repo-root `skills/` directory (discovered by the
  Claude Code plugin and the pi package). Each skill is one directory with a `SKILL.md`.
- **Language**: documentation and skills are written in **English**; the user-facing README
  has a Chinese edition at `README.zh-CN.md`.
- **Multi-shell**: every hook and script ships a bash (`*.sh`) and PowerShell (`*.ps1`)
  implementation, plus `hooks.json` metadata where the harness requires it.
- **Skill creation is delegated**: plugin-factory never re-implements skill authoring or
  evaluation — it orchestrates **skill-creator** (Anthropic) for create/test/iterate.
- **Routing single source**: pf-* intent routing data lives only in `scripts/routing-table.json`
  (scenario/skill/path/keywords/priority/trigger). To change routing, edit the JSON, then run
  `node scripts/render-routing.mjs` to re-render the tables in `skills/using-pf/SKILL.md`.
  Never hand-edit those tables — `npm run verify` fails on drift (`routing-table-drift`).
- **Report placement**: analysis/research reports (e.g. ecc/superpowers/optimization studies)
  are private research — put them in `.agent-workplace/research/` (gitignored), not in `docs/`.
  Delivery-task records (T1–T6) live in `.agent-workplace/docs/task/`. `docs/` holds only
  durable product docs (ADRs, glossary, templates).

## Quality bars (enforced by `scripts/verify.mjs` / `npm run verify`)

- Every `SKILL.md` has YAML frontmatter with `name` and `description`.
- `name` matches its parent directory; lowercase letters/digits/hyphens only.
- `description` starts with "Use when…", is third-person, describes triggers only
  (never the workflow), and stays under 1024 characters.
- Every command file has a frontmatter `description`.
- Every hook has both a `.sh` and a `.ps1` implementation.
- Every advertised harness has its complete artifact set.

`npm run validate` and `npm run validate:ps` invoke the same Node engine
(`scripts/verify.mjs structure`) — Bash and PowerShell are thin wrappers.

## Repository structure

```
plugin-factory/
├── .agent-workplace/              # agent private workspace (gitignored): research/, docs/task/, state/
├── .claude-plugin/plugin.json    # Claude Code plugin manifest
├── .pi/extensions/               # pi/oh-my-pi bootstrap extension
├── .opencode/                    # opencode config, plugin + INSTALL.md
├── skills/                       # pf-* workflow sub-skills (canonical location)
├── commands/                     # /pf-* slash commands
├── hooks/                        # session-start bootstrap (multi-shell)
├── references/                   # shared design docs (adapters, model, lifecycle matrix, hooks)
├── scripts/                      # scaffold/verify/lifecycle/version/release/routing (Node core + shell wrappers)
├── templates/                    # shared/ + harnesses/ scaffold templates
├── docs/                         # ADRs, glossary, templates (no reports/tasks — see .agent-workplace/)
└── tests/                        # contract + smoke tests (scaffold/verify/bootstrap/release/smoke)
```

## Working here

- Before editing a skill, read the matching `references/*.md` doc so conventions stay in sync.
- To change routing, edit `scripts/routing-table.json` and run `node scripts/render-routing.mjs`;
  do not edit the SKILL.md tables by hand (verify fails on drift).
- When you change a convention, update the affected `references/` docs and the CHANGELOG.
- Keep every deliverable verifiable: run `npm test` and `npm run validate` after changes
  (add contract tests under `tests/` for any new script).
- **Batch limit**: run at most 5 consecutive tasks per batch, then stop, report, and
  reach a commit checkpoint (verify + commit) before continuing.
- **Honest evaluation claims**: when routing/skill changes are validated against
  `evals/evals.json`, run the evaluation tooling if the environment has it;
  if no eval runner is available, **state explicitly that evals were not run** —
  never imply they passed.
