# plugin-factory — opencode installation

plugin-factory is a meta-plugin: it guides the agent through creating **standalone,
multi-agent plugin projects** (Claude Code / pi / opencode) from a user's intent,
goals, and scenarios.

## Install

1. Copy this plugin directory into your project (opencode picks up
   `.opencode/plugins/` automatically).
2. Restart opencode so it rescans the plugin and skill directories.

`skills/` is the single source: `.opencode/plugins/pf-bootstrap.ts`
registers the repo-root `skills/` directory as an opencode skill source at
runtime via its `config` hook — superpowers-style self-registration.

## Skill discovery

Skills live canonically in the repo-root `skills/` directory. The bootstrap
plugin's `config` hook pushes that directory into `config.skills` (handling
both v1 `{ skills: { paths: [...] } }` and v2 `{ skills: [...] }` shapes).
Skill discovery is lazy — opencode reads those paths after plugins load, so
the runtime registration is visible to the skill tool.

The single root `skills/` source serves every harness (see
`references/plugins/opencode.md`).

## Use

Ask the agent to **create a plugin** (or mention "plugin-factory"). The agent will
run the `pf-intent` interview, produce a one-page PRD, and drive design → build →
verify → release using the `pf-*` skills and skill-creator.

## Notes

- Bootstrap: `.opencode/plugins/pf-bootstrap.ts` also injects the entry skill
  (`skills/using-pf/SKILL.md`) at session start (single marker
  `PLUGIN_FACTORY_BOOTSTRAP:plugin-factory`).
- Documentation is English; the user-facing README has a Chinese edition
  (`README.zh-CN.md`).
