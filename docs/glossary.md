# Glossary (术语表)

| Term | Meaning |
|------|---------|
| **Plugin** | An installable package that extends an agent harness with skills, hooks, commands, rules, agents. |
| **Harness** | An agent runtime that consumes plugins/skills (Claude Code, pi, opencode). |
| **Adapter** | The mapping from the canonical plugin model to one harness's concrete locations/formats (see `references/agent-adapters.md`). |
| **Skill** | A capability package: a directory with `SKILL.md` (Agent Skills standard) plus optional supporting files. |
| **SKILL.md** | The skill manifest: YAML frontmatter (`name`, `description`, …) + instructions. |
| **Agent Skills standard** | The cross-harness specification at agentskills.io that plugin-factory treats as canonical. |
| **CSO description** | A description that states only **C**onditions/**S**ymptoms/**O**ther triggers ("Use when…"), never the workflow. |
| **PRD** | One-page product requirement doc produced by `pf-intent`; the entry credential for design/build. |
| **Complexity gate** | The Light/Medium/Heavy verdict from `pf-intent` that routes a project to the direct or full workflow path. |
| **Component manifest** | The signed-off list of skills/hooks/commands/rules + per-harness specs produced by `pf-design`. |
| **skill-creator** | Anthropic's official skill creation/evaluation skill (create → test cases → A/B eval → iterate). plugin-factory delegates to it. |
| **Multi-shell** | The requirement that every hook/script ships both bash and PowerShell variants. |
| **Lifecycle actions** | Split / merge / reorganize / port / retire / evolve — recommendations from `pf-lifecycle` (pure-structural in v1). |
| **Dogfood** | Using plugin-factory to generate an example plugin (M4). |
