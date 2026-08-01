---
name: pf-lifecycle
description: Use when analyzing how existing skills should evolve, when deciding split, merge, reorganize, port, or retire actions, when a skill is too large, overlapping, or structurally unhealthy, when running pure-structural lifecycle analysis, or when routed from /pf-analyze. Produces severity-ranked recommendations for user confirmation.
tags: [pf, pf-lifecycle, plugin, lifecycle, analysis, refactor, split, merge]
metadata:
  prefix: pf
---

# pf-lifecycle — Lifecycle Analysis

## Overview

Analyzes a plugin/skill set **structurally** (files and metadata only — no runtime
telemetry in v1) and recommends lifecycle actions: **split / merge / reorganize /
port / retire / evolve**. It covers the plugin-level lifecycle that skill-creator's
single-skill loop does not.

## When to Use

- A skill is too large, too deep, or duplicated.
- Several skills overlap in trigger domain.
- A plugin advertises harnesses its skills do not cover.
- The user runs `/pf-analyze` or asks "how should these skills evolve?".

## Responsibilities (skeleton — completed in M3)

- Run structural probes from the decision matrix (`references/lifecycle-matrix.md`):
  size/depth, trigger overlap, duplicated guidance, hierarchy depth, multi-harness
  gaps, zombie detection, name collisions, version drift.
- Produce {skill, signal, severity, action, impact} recommendations, severity-ranked.
- Wait for user confirmation before any action executes.
- Route approved actions through `pf-design` / `pf-build` / `pf-verify` — no bypass.

## Status

M0 scaffold: the decision matrix lives in `references/lifecycle-matrix.md`; the
analysis engine lands in **M3**.
