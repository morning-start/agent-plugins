---
name: pf-build
description: Use when a component manifest is signed off, when creating a standalone plugin project, when scaffolding skills, hooks, or commands for multiple harnesses, when a skill must be authored via skill-creator, when generating a bootstrap/entry skill from orchestration metadata, or when routed from /pf-build.
tags: [pf, pf-build, plugin, scaffold, build, skill-creator, render]
metadata:
  prefix: pf
  lifecycle:
    status: active
    version: 0.1.0
    created: 2026-08-01
    updated: 2026-08-02
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

- Check that skill-creator is available **automatically** before entering the
  build loop — never by hand:

  ```bash
  node scripts/check-creator.mjs [--root <plugin-dir>] [--format table|json]
  ```

  `checkCreator()` (exported from `scripts/check-creator.mjs`) probes the two
  accepted install forms below and returns `{ available, found, hint }`; exit 1
  when missing.
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

Run `node scripts/check-creator.mjs` (see "skill-creator availability" above).
Do not proceed to skill authoring until the user confirms skill-creator is installed.

### 1. Create the standalone project layout

Per `references/plugin-model.md`:

```
<plugin-name>/
├── .claude-plugin/plugin.json              # claude-code harness
├── .pi/extensions/<prefix>-bootstrap.ts    # pi / oh-my-pi harness (shared path)
├── .opencode/opencode.json + plugins/      # opencode harness (skills via opencode.json → ./skills/)
├── package.json                            # pi/omp fields only when requested
├── skills/                                 # filled in step 2
├── commands/  hooks/  rules/ or references/
├── scripts/  tests/  docs/
├── AGENTS.md  CLAUDE.md
├── README.md  README.zh-CN.md
└── install.sh  install.ps1
```

Use `scripts/scaffold.sh` / `scaffold.ps1` / `scripts/scaffold.mjs` — the single
cross-platform renderer. Record the requested harness list (`--harnesses`).
A harness is advertised **only** when all of its required artifacts are rendered
(see `references/plugin-model.md` § 生成插件布局).

After scaffolding, run the generated project's own structure verifier automatically
with `--auto-verify` (scaffold exit 1 when the generated project has FAIL findings;
without the flag, verify manually via `npm run validate` in the target).

### 2. Author each skill via skill-creator (TDD loop)

For every skill in `components.skills`:

1. **Write test cases first** (TDD red phase) — before any skill implementation,
   define acceptance criteria as executable test cases: trigger scenarios,
   expected outputs, error conditions, edge cases. The test cases become the
   skill's contract.
2. Feed skill-creator the PRD-derived spec (capability, triggers, consumes/produces)
   plus the test cases from step 1.
3. Run its loop: intent → draft → test cases → parallel A/B eval (with/without the
   skill) → iterate based on feedback (description optimization up to its rounds).
4. **Accept only after its evaluation passes and all test cases pass.** Record the
   eval summary per skill **automatically** — never leave it in conversation only:

   ```bash
   node scripts/evals.mjs record --skill <skill-name> --name <eval-name> --passed <true|false> [--notes <summary>]
   ```

   `recordEval()` (exported from `scripts/evals.mjs`) appends the result to
   `evals/evals.json` (`results.<skill>.<eval-name>`), preserving the declared
   eval cases; latest result wins per name. Every accepted skill must have a
   recorded eval result before the build hands off.

Test-first principle: a skill is not complete until its test cases exist and pass.
The scaffold generates a `tests/` directory with per-skill test stubs;
skill-creator fills them during its TDD loop.

### 3. Render per-harness manifests

Per `references/plugins/` and `references/agent-adapters.md`:

- Claude Code: `.claude-plugin/plugin.json` (name/description/version) + root
  `skills/`/`commands/`/`agents/` + `hooks/hooks.json`.
- opencode: `.opencode/opencode.json` + `.opencode/plugins/*.ts` (skills via the
  `skills` field pointing at `./skills/` — single source, no copy).
- pi: `package.json` → `pi.skills` + `pi.extensions`.
- oh-my-pi: **also** write the `omp` field (`pkg.omp` preferred, `pkg.pi` fallback).
- **Tool mapping** (superpowers pattern): generate `references/<harness>-tools.md`
  translating the skills' action vocabulary into each harness's native tools; keep
  skill bodies tool-agnostic (see pf-design).
- **MCP stub**: plugins that need an external API get a scaffolded
  `mcp-servers/` directory — `README.md` (when to keep/delete, wiring) plus a
  dependency-free stdio server stub with one example tool
  (`mcp-servers/<prefix>-server.mjs`). Keep it only when the plugin calls an
  external API; implement real tools via the TDD loop and delete the directory
  otherwise.

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

### 8. Auto-verify the generated project (mandatory)

Before handing off, run the structural verifier on the generated project:

```bash
node scripts/verify.mjs structure --root <generated-plugin-dir>
```

If any FAIL findings exist, fix them before proceeding. Common issues:
- Missing frontmatter in SKILL.md files
- Skill name doesn't match parent directory
- Missing hook shell variants (.sh / .ps1)
- Missing harness artifacts

This catches structural errors at build time rather than release time.

### 9. Hand off to git engineering

Once the standalone project is generated and verified, apply git discipline per
`pf-git`: create a feature branch (or worktree) for the plugin work and follow
Conventional Commits; manage version bumps / CHANGELOG from git history via
`pf-version` (or `/pf-version`). The generated project's own
`scripts/verify.mjs` + `version.mjs` engine is used by the release gate.

## Outputs

- Standalone plugin project (new directory/repo) ready for `pf-verify`.
- Per-skill eval summaries (evidence for the release gate).
- Git engineering handoff (branch/worktree/commit from pf-git; version from
  pf-version).

## Acceptance

- Every manifest skill exists as `skills/<name>/SKILL.md` and passed skill-creator eval.
- The requested harness list is recorded; every requested harness has all required
  artifacts (see `references/plugin-model.md` § 生成插件布局).
- No unrequested harness file is generated (Claude-only request → no `.pi/`,
  `.opencode/`, or `OMP-NOTES.md`).
   - The generated project passes its own verifier: `npm run validate` and
   `npm run validate:ps`. For Node.js plugins this invokes `scripts/verify.mjs`
   (same engine as plugin-factory); for plugins with custom domain validators
   (e.g. Python scripts), the command is declared in `package.json.scripts` and
   documented in `AGENTS.md` Validation section.
   - Validator declaration: if a plugin uses a custom validator (not `scripts/verify.mjs`),
   the Validation section in `AGENTS.md` must record the commands, and
   `package.json.scripts` must declare them. See
   `references/plugin-model.md` § 9.
- opencode skill discovery needs no manual `cp -r skills …` step and no
  `.opencode/skills/` copy — `opencode.json` declares `skills: ["./skills/"]`
  so opencode reads the single root source directly.
- Per-harness manifests match `references/plugins/`.
- Hooks have bash + PowerShell variants; orchestration rendered (bootstrap + routing).
- Tool mapping files (`references/<harness>-tools.md`) generated per advertised harness.
- Bilingual README + AGENTS/CLAUDE + install scripts present.
- Language policy applied per layer and recorded in the generated AGENTS.md.

## Status

M1 complete — full build workflow above.

## Iron Law

```
No manifest → no scaffold. No skill-creator → no skill body.
```

## Red Flags — STOP and Rethink

- Writing skills by hand instead of routing to skill-creator
- Skipping the build/verify/release flow
- Ignoring the language policy layering

## 自检清单 (Post-routing Self-Check)

- [ ] Manifest is signed off (from pf-design)
- [ ] Skill-creator is available and confirmed
- [ ] All skills pass eval via skill-creator
- [ ] Auto-verify passes (no FAIL findings)
- [ ] Generated plugin passes `npm run validate`
