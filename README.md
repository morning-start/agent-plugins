# plugin-factory

A **meta-plugin** that guides your coding agent to create **new, standalone agent plugin
projects** from nothing but your intent, goals, and scenarios.

> 中文说明见 [README.zh-CN.md](README.zh-CN.md)

You tell the agent *what the plugin should do*; plugin-factory drives everything else
through a software-development workflow: intent interview → PRD → design → build
(delegating each skill to Anthropic's **skill-creator**) → verification → release →
lifecycle analysis (split / merge / reorganize / port / retire).

## Supported harnesses

| Harness | Install | Skill location |
|---------|---------|----------------|
| Claude Code | `/plugin install plugin-factory@<marketplace>` or local plugin | plugin `skills/` |
| pi | `pi install git:github.com/<you>/plugin-factory` | package `skills/` (`pi.skills` in package.json) |
| opencode | follow `.opencode/INSTALL.md` | copy `skills/` → `.opencode/skills/` (script planned) |

## Quick start

1. Install plugin-factory for your harness (table above).
2. Run `/pf-new` (Claude Code) or ask the agent to create a plugin.
3. Answer the intent interview: core functionality, measurable goal, 3–5 scenarios,
   users/triggers, boundaries & non-goals.
4. Sign off the one-page PRD; the agent drives design → build → verify → release.
5. A **standalone plugin project** is generated (own directory/repo, bilingual README,
   per-harness manifests, multi-shell hooks and commands).

## How it works

| Phase | Skill / Command | Deliverable |
|-------|-----------------|-------------|
| 1. Intent | `pf-intent` | One-page PRD + complexity gate (Light → direct path, Medium/Heavy → full path) |
| 2. Design | `pf-design` | Component manifest + per-harness manifest specs |
| 3. Build | `pf-build` | Standalone plugin project; skills via skill-creator (TDD loop) |
| 4. Verify | `pf-verify` | Structural & compliance audit |
| 5. Release | `/pf-release` | SemVer, CHANGELOG, bilingual README, install scripts |
| 6. Lifecycle | `pf-lifecycle` | Pure-structural analysis → split/merge/reorganize/port/retire advice |

## Repository structure

```
plugin-factory/
├── .claude-plugin/plugin.json    # Claude Code plugin manifest
├── .pi/extensions/               # pi extension bootstrap
├── .opencode/                    # opencode config + INSTALL.md
├── skills/                       # pf-* workflow sub-skills
├── commands/                     # /pf-* slash commands
├── hooks/                        # session-start bootstrap (multi-shell)
├── references/                   # design docs: adapters, plugin model, lifecycle matrix
├── scripts/                      # validate/audit/scaffold (bash + PowerShell)
├── templates/                    # generated-plugin scaffolds
├── docs/                         # ADRs + glossary
└── tests/                        # infrastructure tests
```

## Roadmap

- **M0** — plugin skeleton, three-harness manifests, `pf-intent`, references ✅ *(current)*
- **M1** — full pipeline orchestration, Claude Code adapter first, dual-shell scaffold scripts
- **M2** — pi + opencode adapters, multi-shell hooks/commands rendering, standalone project generation
- **M3** — lifecycle analysis engine (pure structural) + decision matrix + audit upgrade
- **M4** — dogfood: generate an example plugin with plugin-factory itself; tests; docs polish

## License

MIT
