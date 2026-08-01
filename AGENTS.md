# AGENTS.md — plugin-factory

## What this project is

**plugin-factory** is a meta-plugin: an agent plugin project that guides an agent to create
**new, standalone agent plugin projects** from a user's intent, goals, and scenarios.
The user only provides *what the plugin should do*; the agent drives everything else
through a software-development workflow (intent → design → build → verify → release → lifecycle).

Supported target harnesses for generated plugins: **Claude Code**, **pi**, **opencode**.

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

## Quality bars (enforced by `pf-verify` / `scripts/validate-structure.*`)

- Every `SKILL.md` has YAML frontmatter with `name` and `description`.
- `name` matches its parent directory; lowercase letters/digits/hyphens only.
- `description` starts with "Use when…", is third-person, describes triggers only
  (never the workflow), and stays under 1024 characters.
- Every command file has a frontmatter `description`.
- Every hook has both a `.sh` and a `.ps1` implementation.

## Repository structure

```
plugin-factory/
├── .claude-plugin/plugin.json    # Claude Code plugin manifest
├── .pi/extensions/               # pi extension bootstrap (M2: API verified)
├── .opencode/                    # opencode config + INSTALL.md
├── skills/                       # pf-* workflow sub-skills (canonical location)
├── commands/                     # /pf-* slash commands
├── hooks/                        # session-start bootstrap (multi-shell)
├── references/                   # shared design docs (adapters, model, lifecycle matrix)
├── scripts/                      # validate/audit/scaffold scripts (multi-shell)
├── templates/                    # generated-plugin scaffolds (M1+)
├── docs/                         # ADRs + glossary
└── tests/                        # plugin-infrastructure tests
```

## Working here

- Before editing a skill, read the matching `references/*.md` doc so conventions stay in sync.
- When you change a convention, update the affected `references/` docs and the CHANGELOG.
- Keep every deliverable verifiable: run `npm run validate` after structural changes.
