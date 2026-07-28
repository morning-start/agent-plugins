---
name: using-moonbit-skills
description: "Bootstrap skill — establishes the MoonBit Skills workflow. Invoke at session start. Teaches the agent how and when to use the 7 moonbit-* skills."
alwaysApply: true
---

# Using MoonBit Skills

This repository provides **7 skills** for the full MoonBit project lifecycle. Before taking any action, check if a skill applies.

## The Rule

**If a skill applies to your task, you MUST use it.** Skill check comes BEFORE clarifying questions, exploration, or any action.

## Skills

| Skill | When to Use |
|-------|-------------|
| `moonbit-init` | New project, setup git hooks, quality gates |
| `moonbit-plan` | Clarify requirements, design architecture and API |
| `moonbit-scaffold` | Generate project skeleton from templates |
| `moonbit-implement` | Write code via TDD (test → implement → verify) |
| `moonbit-verify` | Full quality gate: fmt, check, test, audit |
| `moonbit-evaluate` | Release readiness, README, CI config |
| `moonbit-learn` | Extract lessons from bugs, update skills |

## Skill Priority

When multiple skills apply, process skills first (`plan` → `scaffold` → `implement`), then quality skills (`verify` → `evaluate`).

- "I want to build X" → `moonbit-plan` first, then `moonbit-implement`
- "Something is broken" → `moonbit-learn` if known, else `moonbit-implement` with debug
- "Is this ready?" → `moonbit-verify`

## Trigger Phrases

Match user intent to skills:

- "init", "setup", "hooks" → `moonbit-init`
- "plan", "design", "architecture" → `moonbit-plan`
- "scaffold", "generate", "skeleton" → `moonbit-scaffold`
- "implement", "build", "write code" → `moonbit-implement`
- "verify", "check", "quality" → `moonbit-verify`
- "evaluate", "release", "publish" → `moonbit-evaluate`
- "learn", "remember", "don'\''t repeat" → `moonbit-learn`
