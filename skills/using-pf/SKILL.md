---
name: using-pf
description: Use when starting any conversation or task with plugin-factory, when deciding whether a request means creating a new plugin, maintaining an existing one, or analyzing one, when routing to the right pf-* scenario, or when a session starts and the user's intent is unclear. The unified entry point — determine intent first, then route.
tags: [pf, using-pf, plugin, entry, bootstrap, orchestration]
metadata:
  prefix: pf
  keywords_zh: "插件入口, 创建插件, 维护插件, 分析插件, 意图路由"
---

# using-pf — Unified Entry & Orchestration

<SUBAGENT-STOP>
If you were dispatched as a subagent to execute a specific task, ignore this skill.
</SUBAGENT-STOP>

<EXTREMELY-IMPORTANT>
If you think there is even a 1% chance a pf-* scenario applies to what you are
doing, you MUST run the intent check below BEFORE any response or action —
including clarifying questions, exploring files, or scaffolding.

IF A PF-* SKILL APPLIES TO YOUR TASK, YOU DO NOT HAVE A CHOICE. YOU MUST USE IT.

This is not negotiable. You cannot rationalize your way out of this.
</EXTREMELY-IMPORTANT>

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

## Red Flags

These thoughts mean STOP — you are rationalizing:

| Thought | Reality |
|---------|---------|
| "This is just a question" | Questions are tasks. Determine intent first. |
| "I'll just scaffold a quick plugin" | No PRD, no scaffold (Iron Law 1). |
| "Let me explore the codebase first" | using-pf tells you HOW to approach. Check intent first. |
| "I remember the pf-* flow" | Skills evolve. Read the current version. |
| "This is a small change, skip intent" | Every change (S2–S8) starts with intent (Change mode). |
| "Maintenance is trivial" | Every change still ends with verify → release. |
| "Retiring this skill kills the plugin" | Single-skill retirement is maintenance (S5); the plugin lives on. |
| "The skill is overkill" | Simple things become complex. Use it. |

## Rules

- The entry skill never does stage work itself — it routes.
- The user makes key decisions (intent confirmation, complexity, manifest sign-off).
- Every change ends with verify → release (no release without verification).
- Single-skill retirement is maintenance (S5); plugin archiving is out of scope.
