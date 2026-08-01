# Design Principles (铁律)

Shared conventions that every `pf-*` skill and every generated plugin must follow.
When a skill and this document disagree, this document wins — update the skill.

## 1. Intent first — no PRD, no work

- The one-page PRD produced by `pf-intent` is the **only entry credential** for design
  and build. Never scaffold files before the user has signed off the PRD.
- No design before PRD sign-off; no build before the component manifest sign-off.

## 2. Delegate, don't re-implement

- Skill authoring, test-case creation, evaluation, and iteration are **delegated to
  skill-creator** (Anthropic, `npx skills add https://github.com/anthropics/skills --skill skill-creator`).
- plugin-factory orchestrates: it supplies the PRD-derived skill spec, invokes
  skill-creator's TDD loop, and accepts a skill only after its evaluation passes.
- **Never auto-install skill-creator**: if it is missing, remind the user to install it
  themselves (`anthropics/skills@skill-creator`); installing it is a **user decision** —
  never auto-install without explicit permission.
- plugin-factory's own value is everything **around** a single skill: multi-harness
  rendering, hooks/commands, plugin packaging, and lifecycle analysis.

## 3. Standard-driven rendering

- Skills are authored once against the **Agent Skills standard** (agentskills.io) and
  rendered per harness; adapters handle only the differences (see `agent-adapters.md`).
- Name == parent directory. Description ≤ 1024 chars, "Use when…", triggers only.
- Never fork the standard for one harness; keep the canonical form portable.

## 4. Users make key decisions only

- The agent drives the workflow autonomously. The user decides:
  1. PRD sign-off (intent phase)
  2. Complexity gate (Light / Medium / Heavy)
  3. Component manifest sign-off (design phase)
  4. Lifecycle recommendations (split / merge / reorganize / port / retire)
- Everything else (interviews, drafting, rendering, auditing, versioning) is agent work.

## Naming convention

| Location | Rule | Example |
|----------|------|---------|
| Skill directory | `pf-` abbreviation prefix + short name | `skills/pf-intent/` |
| SKILL.md `name` | must match parent directory | `name: pf-intent` |
| tags / metadata | redundant brand info | `tags: [pf, pf-intent]`, `metadata.prefix: pf` |
| Slash commands | `/pf-*` | `/pf-new`, `/pf-intent`, `/pf-analyze` |

Generated plugins follow the same convention with their own project prefix
(e.g. `moonbit-` in moonbit-skills). The prefix prevents name collisions in shared
directories (`.agents/skills/`, `~/.agents/skills/`).

## Quality bars

- Every SKILL.md: YAML frontmatter, `name` == dir, `description` ≤ 1024 chars,
  trigger-style, third person.
- Every command: frontmatter `description`.
- Every hook: bash **and** PowerShell implementation + `hooks.json` where needed.
- Every generated plugin: bilingual README (`README.md` + `README.zh-CN.md`),
  per-harness manifests, install instructions.
- Language: docs and skills in English; user-facing README has a Chinese edition.

## Process

```
intent → (gate: Light? direct) → design → build (skill-creator loop)
       → verify (audit) → release (SemVer) → lifecycle (analysis)
```

Complexity gate (from `pf-intent`): Light = 1–2 skills, no hooks, single harness →
skip design, go straight to build. Medium/Heavy → full path.
