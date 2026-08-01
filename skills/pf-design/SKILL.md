---
name: pf-design
description: Use when a signed-off PRD exists for a plugin, when planning which skills, hooks, commands, and rules a plugin needs, when mapping a plugin to Claude Code/pi/opencode manifests, or when routed from /pf-design or pf-intent's full path. Produces the component manifest.
tags: [pf, pf-design, plugin, design, architecture, manifest]
metadata:
  prefix: pf
---

# pf-design — Plugin Design

## Overview

Turns a signed-off PRD into a **component manifest**: the exact list of skills, hooks,
commands, rules, and per-harness manifest specs that `pf-build` will render. No manifest,
no scaffolding (Iron Law 1).

## When to Use

- A signed-off PRD exists and the complexity gate says Medium or Heavy.
- The user runs `/pf-design`.
- The plugin needs architectural decisions worth recording (Heavy path → ADR).

## Responsibilities (skeleton — completed in M1)

- Decompose PRD features into skills (one capability per skill, Agent Skills standard).
- Decide hooks (which lifecycle events) and commands (which slash actions) per harness.
- Decide rules / agents / references.
- Produce the component manifest consumed by `pf-build`.
- Heavy path: record architectural decisions as ADRs in `docs/`.

## Status

M0 scaffold. Full design workflow lands in **M1**. Until then, treat this skill's
presence as the manifest gate: no component manifest, no build.
