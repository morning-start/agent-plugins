---
name: pf-intent
description: Use when creating a new agent plugin, when a user has only a vague idea of what a plugin should do, when asked to turn "I want a plugin for X" into a concrete spec, or when no signed-off PRD exists yet. Triggers on "create a plugin", "I have an idea for a plugin", "plugin for X", "/pf-intent", "/pf-new". Elicits intent, writes a one-page PRD, and applies the complexity gate.
tags: [pf, pf-intent, plugin, prd, intent, interview, requirements]
metadata:
  prefix: pf
  keywords_zh: "创建插件, 插件想法, 需求澄清, PRD, 意图访谈"
---

# pf-intent — Intent Clarification

## Overview

Turns a vague idea into a **one-page PRD** plus a **complexity verdict** that decides
whether the project takes the direct or the full workflow path. Iron law: **no PRD,
no work** — no design, no scaffolding before the user signs off.

## When to Use

- The user says "I want a plugin that…" with few details.
- The user starts `/pf-new` or `/pf-intent`.
- A plugin idea needs boundaries and non-goals spelled out.
- A PRD exists but was never signed off → re-run the gate and get sign-off.

Do **not** use when a PRD is already signed off — route to `pf-design` (full path)
or `pf-build` (light path) directly.

## Workflow

### 1. Interview — one question at a time

Ask in order; adapt follow-ups to the answers. Record every answer **verbatim**.

1. **Core functionality** — What does the plugin DO? (verb + object; ask for a concrete example)
2. **Goal** — What measurable outcome? How will the user know it works?
3. **Scenarios** — Name 3–5 real situations (who, when, under what conditions).
4. **Users & triggers** — Who uses it? How is it invoked (auto-trigger, slash command, hook)?
5. **Boundaries** — What is explicitly NOT in scope?
6. **Platforms** — Which harnesses: Claude Code / pi / opencode?
7. **Complexity signals** — Estimated skill count; hooks needed? multiple harnesses? rules/agents needed?
8. **Language preference** — Default **tiered**: maintenance/review layer in your
   language (e.g. 中文), agent-executed layer in English. Options: tiered (default) /
   all English / all your language. Record the choice — it becomes the plugin's
   `language` policy (PRD → manifest → generated AGENTS.md).

Elicitation rules:

- Ask **one** question at a time; wait for the answer before the next.
- Push for concrete examples ("give me a real case…") over abstractions.
- Challenge vague answers with a concrete counter-example ("what if …?").
- Record verbatim; never silently paraphrase what the user said.

### 2. Write the one-page PRD

```
# <plugin-name> — PRD (v0.1)
## Background        why now, one paragraph
## Goals             2–3 measurable outcomes
## Features          numbered: verb + object, one-line acceptance hint each
## Scenarios         3–5: context → trigger → expected behavior
## Non-goals         explicitly out of scope
## Platforms         claude-code | pi | opencode | all
## Language          policy: tiered | english | native · user_lang: <your language> · agent_lang: en
## Complexity signals  skills ~N · hooks Y/N · multi-harness Y/N · rules/agents Y/N
## Sign-off          user confirmation + date
```

### 3. Apply the complexity gate

Score:

| Signal | Points |
|--------|--------|
| More than 2 skills | +1 per extra skill |
| Hooks required | +2 |
| Extra harness beyond the first | +1 each |
| Rules / agents / subagents needed | +1 |

| Score | Verdict | Path |
|-------|---------|------|
| 0–1 | **Light** | Direct path → `pf-build` (skip design) |
| 2–4 | **Medium** | Full path → `pf-design` → `pf-build` → `pf-verify` |
| 5+ | **Heavy** | Full path + explicit ADR in `pf-design` |

### 4. Sign-off (mandatory)

Present the PRD; the user confirms or edits. Record the confirmation and date.
Proceed only after sign-off.

## Output

- One-page PRD in the target plugin location.
- Complexity verdict (Light / Medium / Heavy) and the routed next skill.
- Confirmed boundaries and non-goals.

## Common mistakes

- Skipping the interview because the idea "seems obvious" — always interview.
- Paraphrasing user answers before confirmation — record verbatim.
- Asking several questions at once — one at a time.
- Forgetting non-goals — they are the scope-creep firewall.
- Proceeding before sign-off — sign-off is the gate.

## Rules

- No PRD → no design, no scaffolding (Iron Law 1).
- The user answers; the agent writes and drives.
