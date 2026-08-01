---
name: pf-build
description: Use when a component manifest is signed off, when creating a standalone plugin project, when scaffolding skills, hooks, or commands for multiple harnesses, when a skill must be authored via skill-creator, or when routed from /pf-build. Executes the build; delegates skill authoring and evaluation to skill-creator.
tags: [pf, pf-build, plugin, scaffold, build, skill-creator]
metadata:
  prefix: pf
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

## Responsibilities (skeleton — completed in M1)

- Create the standalone plugin project layout (`references/plugin-model.md`).
- For each skill: invoke skill-creator's intent → draft → test cases → A/B eval →
  iterate loop; accept only after its evaluation passes.
- Render per-harness manifests (`.claude-plugin/plugin.json`, `pi.skills`,
  `.opencode/opencode.json`) from the adapter specs (`references/agent-adapters.md`).
- Render hooks (bash + PowerShell) and commands; multi-shell by default.

## Status

M0 scaffold. Build orchestration and scaffolding scripts land in **M1** (Claude Code
first, then pi/opencode in M2).
