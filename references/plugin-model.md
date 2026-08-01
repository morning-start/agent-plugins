# Plugin Model (通用插件模型)

One abstract model describes an agent plugin; harness adapters map it to concrete
locations and formats. Skills are authored once (Agent Skills standard) and rendered
per harness — see `agent-adapters.md` for the per-harness mapping table.

## Components

| Component | What it is | Canonical form | Harness notes |
|-----------|------------|----------------|---------------|
| **skills** | Capability packages: `SKILL.md` + supporting files | dir per skill, root `skills/` | Claude Code plugin `skills/`, pi package `skills/`, opencode `.opencode/skills/` |
| **hooks** | Lifecycle scripts (session start, tool use, completion…) | `hooks/*.sh` + `hooks/*.ps1` + `hooks/hooks.json` | Event models differ per harness (verified per adapter) |
| **commands** | Slash commands / shortcuts | `commands/*.md` (frontmatter description) | Claude Code `commands/`, opencode `.opencode/command/`, pi `/skill:` forcing |
| **agents / subagents** | Personas with dedicated system prompts | `agents/*.md` | Claude Code `agents/`; optional elsewhere |
| **rules** | Persistent behavior constraints | `rules/*.md` | Claude Code `rules/`; other harnesses use AGENTS.md |
| **references** | Shared design/spec docs | `references/*.md` | — |
| **scripts** | Validators, generators, helpers | bash + PowerShell pairs | multi-shell requirement |
| **tests / evals** | Infrastructure & behavior tests | `tests/`, `evals/` | — |
| **manifests** | Per-harness metadata | `.claude-plugin/plugin.json`, `package.json` (`pi.skills`), `.opencode/opencode.json` | — |
| **orchestration** | Entry points / trigger chains / handoffs / conflicts (first-class manifest section); bootstrap skill for methodology plugins | `orchestration` in the component manifest | rendered into each skill's "next steps" + a `using-<plugin>` bootstrap skill |

## What a plugin must contain (release gate)

1. At least one skill (each verified via skill-creator) — or a documented reason.
2. Per-harness manifest for every advertised harness.
3. Hooks (if any) with both bash and PowerShell implementations.
4. `AGENTS.md` (+ `CLAUDE.md`) project instructions.
5. Bilingual README: `README.md` + `README.zh-CN.md`.
6. Install instructions (`install.sh` / `install.ps1` or per-harness docs).
7. Methodology plugins: a bootstrap/entry skill (`using-<plugin>`) and orchestration
   metadata (`references/orchestration-patterns.md`).

## Generated plugin layout (template)

```
<plugin-name>/
├── .claude-plugin/plugin.json
├── .pi/extensions/<plugin-name>.ts      # pi bootstrap (M2)
├── .opencode/opencode.json + INSTALL.md # opencode (M2)
├── skills/<skill-name>/SKILL.md         # created via skill-creator
├── commands/                            # /<prefix>-* commands
├── hooks/                               # multi-shell
├── rules/ or references/
├── scripts/  tests/  docs/
├── AGENTS.md  CLAUDE.md
├── README.md  README.zh-CN.md
└── install.sh  install.ps1
```

Naming: directory + `name` use `<project-prefix>-<short-name>` (e.g. `pf-intent`,
`moonbit-verify`). Prefix prevents collisions in shared skill directories.
