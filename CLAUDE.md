# CLAUDE.md

This repository is **plugin-factory**, a meta-plugin that guides agents through creating
standalone multi-agent plugin projects (Claude Code / pi / opencode) from intent, goals,
and scenarios.

## Activation

Before starting any task in this repo, check whether one of the `pf-*` skills applies
(see `skills/`). When the user wants to create a new plugin, follow the full workflow
via `/pf-new`; never jump straight into writing files.

## Rules of thumb

- **Intent first**: no PRD (from `pf-intent`), no design; no design, no scaffolding.
- **Delegate skill authoring**: use skill-creator's create/test/evaluate loop for every
  skill in a generated plugin; do not hand-write skills from scratch without it.
- **Standard-driven**: skills must comply with the Agent Skills standard
  (name == directory, `description` ≤ 1024 chars, "Use when…" trigger style).
- **Multi-shell**: hooks and scripts ship both bash and PowerShell variants.
- **English docs, bilingual README**: keep `README.md` and `README.zh-CN.md` in sync.
- **Users make key decisions only**: PRD sign-off, complexity gate, lifecycle recommendations.

See `AGENTS.md` for the full conventions and quality bars.
