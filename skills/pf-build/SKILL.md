---
name: pf-build
description: Use when a component manifest is signed off, when creating a standalone plugin project, when scaffolding skills, hooks, or commands for multiple harnesses, when a skill must be authored via skill-creator, when generating a bootstrap/entry skill from orchestration metadata, or when routed from /pf-build. Executes the build; delegates skill authoring and evaluation to skill-creator.
tags: [pf, pf-build, plugin, scaffold, build, skill-creator, render]
metadata:
  prefix: pf
  keywords_zh: "插件构建, 脚手架, 生成插件, 渲染, skill-creator"
---

# pf-build — Plugin Build

## Overview

Renders a signed-off component manifest into a **standalone plugin project** in a new
directory/repo. Skill authoring and evaluation are **delegated to skill-creator**
(Iron Law 2) — plugin-factory never re-implements them.

## When to Use

- The complexity gate routed a Light project straight here (skip design).
- A component manifest is signed off and the project must be generated.
- A new skill within an existing plugin must be authored and evaluated.

## Prerequisites

- Signed-off component manifest (from `pf-design`), or a Light verdict from `pf-intent`.
- skill-creator availability (see below).

## skill-creator availability (rule)

- Check that skill-creator is available before entering the build loop.
- **Accepted install forms** (either satisfies the gate):
  - global (e.g. `~/.pi/agent/skills/skill-creator`), or
  - project-local via the skills CLI (`npx skills add …` → `.agents/skills/skill-creator`
    + tracked `skills-lock.json` at the repo root; the vendor dir itself is gitignored).
- **If missing**: remind the user to install it themselves —
  `npx skills add https://github.com/anthropics/skills --skill skill-creator`
  (`anthropics/skills@skill-creator`). **Do NOT auto-install**, and do not run the
  install command without the user's explicit permission.
- Pause the build until the user confirms installation; never hand-write skills
  outside skill-creator's loop as a workaround (Iron Law 2).

## Workflow

### 0. Availability gate

Run the check in "skill-creator availability" above. Do not proceed to skill authoring
until the user confirms skill-creator is installed.

### 1. Create the standalone project layout

Per `references/plugin-model.md`:

```
<plugin-name>/
├── .claude-plugin/plugin.json
├── .pi/extensions/<prefix>-bootstrap.ts      # pi / oh-my-pi
├── .opencode/opencode.json + INSTALL.md     # opencode
├── package.json                              # pi + omp fields (both!)
├── skills/                                   # filled in step 2
├── commands/  hooks/  rules/ or references/
├── scripts/  tests/  docs/
├── AGENTS.md  CLAUDE.md
├── README.md  README.zh-CN.md
└── install.sh  install.ps1
```

Use `scripts/scaffold.sh` / `scaffold.ps1` (or equivalent) so structure is repeatable.

### 2. Author each skill via skill-creator (TDD loop)

For every skill in `components.skills`:

1. Feed skill-creator the PRD-derived spec (capability, triggers, consumes/produces).
2. Run its loop: intent → draft → test cases → parallel A/B eval (with/without the
   skill) → iterate based on feedback (description optimization up to its rounds).
3. **Accept only after its evaluation passes.** Record the eval summary per skill.

### 3. Render per-harness manifests

Per `references/plugins/` and `references/agent-adapters.md`:

- Claude Code: `.claude-plugin/plugin.json` (name/description/version) + root
  `skills/`/`commands/`/`agents/` + `hooks/hooks.json`.
- opencode: `.opencode/opencode.json` + `.opencode/plugins/*.ts` (skills copy under
  `.opencode/skills/` or `.agents/skills/`).
- pi: `package.json` → `pi.skills` + `pi.extensions`.
- oh-my-pi: **also** write the `omp` field (`pkg.omp` preferred, `pkg.pi` fallback).
- **Tool mapping** (superpowers pattern): generate `references/<harness>-tools.md`
  translating the skills' action vocabulary into each harness's native tools; keep
  skill bodies tool-agnostic (see pf-design).

### 4. Render hooks (multi-shell) and commands

- Hooks: canonical {event, action} from the manifest → bash + PowerShell pairs
  (Claude Code, wired via `shell` field), TS plugin (opencode), TS extension
  (pi/oh-my-pi) — per `references/hooks/`.
- Commands: `commands/*.md` (Claude Code), `.opencode/command/*.md`, `registerCommand`
  handlers (pi/omp).

### 5. Render orchestration

Per `references/orchestration-patterns.md`:

- Generate the bootstrap entry skill `using-<plugin>` (CSO description + per-harness
  session-start hooks) when the manifest declares an entry point.
- Inject "After this, route to X" into each chained skill's SKILL.md from `chains`.
- Verify `handoffs` artifacts are produced by the upstream skill.

### 6. Generate project docs

- `AGENTS.md` / `CLAUDE.md` (project instructions incl. activation rules).
- `README.md` + `README.zh-CN.md` (bilingual; English docs, user-language user README).
- `install.sh` / `install.ps1` (per-harness install instructions).

### 7. Apply the language policy

Per the manifest `language` section (default **tiered** —
`references/design-principles.md`):

- **Human-review layer** (references/, docs/, CHANGELOG prose, README user edition) →
  rendered in `user_lang` (the user's language).
- **Agent-executed layer** (skills body, commands, AGENTS/CLAUDE, hooks/scripts) →
  rendered in `agent_lang` (English).
- Skill descriptions: `agent_lang` CSO style + `user_lang` trigger keywords in
  `metadata`.
- Write the policy into the generated `AGENTS.md` (Language policy section) so the
  plugin maintains the tiering itself.

Policy values: `tiered` (default) / `english` (all English) / `native` (all `user_lang`).

## Outputs

- Standalone plugin project (new directory/repo) ready for `pf-verify`.
- Per-skill eval summaries (evidence for the release gate).

## Acceptance

- Every manifest skill exists as `skills/<name>/SKILL.md` and passed skill-creator eval.
- Per-harness manifests match `references/plugins/`.
- Hooks have bash + PowerShell variants; orchestration rendered (bootstrap + routing).
- Tool mapping files (`references/<harness>-tools.md`) generated per advertised harness.
- Bilingual README + AGENTS/CLAUDE + install scripts present.
- Language policy applied per layer and recorded in the generated AGENTS.md.

## Status

M1 complete — full build workflow above.
