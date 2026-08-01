---
name: using-pf
description: Use when starting any conversation or task with plugin-factory, when deciding whether a request means creating a new plugin, maintaining an existing one, or analyzing one, when routing to the right pf-* scenario, or when a session starts and the user's intent is unclear. The unified entry point — determine intent first, then route.
tags: [pf, using-pf, plugin, entry, bootstrap, orchestration]
metadata:
  prefix: pf
  keywords_zh: "插件入口, 创建插件, 维护插件, 分析插件, 意图路由"
---

# using-pf — Unified Entry & Orchestration

## Overview

The single entry point for plugin-factory (mirrors superpowers' `using-superpowers`).
Before ANY work, determine the user's intent and route to the right scenario
(`references/orchestration-patterns.md` § 插件生命周期场景). Do not add new entry
commands — route internally.

## When to Use

- Starting any conversation/task in a plugin-factory context.
- The user's intent is unclear: create new? maintain existing? analyze?
- Session-start activation (per-harness session-start hooks).

## Routing (intent → scenario)

1. **Create a new plugin** → S1: intent (Full) → design → build → verify → release.
2. **Change an existing plugin** → classify the change:
   - add a skill → S2; improve a skill → S3; reorganize (split/merge) → S4;
     retire one skill → S5; add a harness (port) → S6; orchestration tweak → S7;
     config/dependency fix → S8.
   → route: intent (Change) → design/build → verify → release.
3. **Analyze** → S10: /pf-analyze structure probes; recommendations route to S4/S5/S7.
4. **Release** → S9: /pf-release (verify → release).
5. **Just a question** → answer directly; no scenario needed.

## Rules

- The entry skill never does stage work itself — it routes.
- The user makes key decisions (intent confirmation, complexity, manifest sign-off).
- Every change ends with verify → release (no release without verification).
- Single-skill retirement is maintenance (S5); plugin archiving is out of scope.
