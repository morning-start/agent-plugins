---
name: using-pf
description: Use when starting any conversation or task with plugin-factory, when deciding whether a request means creating a new plugin, maintaining an existing one, or analyzing one, when routing to the right pf-* scenario, or when a session starts and the user's intent is unclear.
tags: [pf, using-pf, plugin, entry, bootstrap, orchestration]
metadata:
  prefix: pf
  lifecycle:
    status: active
    version: 0.1.0
    created: 2026-08-01
    updated: 2026-08-02
  keywords_zh: "插件入口, 创建插件, 维护插件, 分析插件, 意图路由"
  alwaysApply: true
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

<INTENT-CHECK>
Before you respond to the user — even to ask clarifying questions — you MUST
first determine whether this session is about plugin-factory. If so, route to
the appropriate pf-* skill and stop.

Scan the user's message for these trigger patterns (any match → route):

  • "new plugin", "create plugin", "build a plugin", "generate plugin"
  • "scaffold", "scaffolding", "generate a project"
  • "update plugin", "modify plugin", "add skill to plugin"
  • "audit plugin", "check plugin", "verify plugin", "what's wrong with"
  • "plan plugin", "design plugin", "architect a plugin"
  • "convert to plugin", "migrate to plugin", "port to plugin"
  • "plugin manifest", "plugin.json", "SKILL.md", "AGENTS.md"
  • "hooks.json", "pipeline-state", "release plugin", "publish plugin"
  • Chinese equivalents: 新建插件, 创建插件, 生成插件, 插件开发, 插件审核,
    插件升级, 插件发布, 插件结构, 插件工厂

If none of these triggers match, the request is OUT OF SCOPE. Continue normally.

If any trigger matches, STOP and use the appropriate pf-* skill below.
</INTENT-CHECK>

## Routing Table

| Trigger Pattern | Route To | Notes |
|---|---|---|
| New plugin / generate from scratch | `pf-build` | Full flow: design → scaffold → verify → release |
| Analyze existing plugin | `pf-verify` | Structure + harness + lifecycle checks |
| Review a PR touching plugins | `pf-verify` + `pf-lifecycle` | Gate PRs on structural compliance |
| Decide which pf-* to use | `pf-intent` | Ask if intent is ambiguous |
| Plan plugin changes | `pf-design` | Scope & architecture before implementation |
| Implement a plugin feature | `pf-build` → `pf-git` | Scaffold + version + commit |
| Release / publish a plugin | `pf-lifecycle` | Version bump + changelog + tag |
| Migrate legacy skill to plugin | `pf-build` + `pf-design` | Reverse-engineer first, then scaffold |
| Fix a broken plugin structure | `pf-verify` + `pf-build` | Diagnose, then repair via rebuild |

## Self-Correction Protocol

When the user provides incomplete or ambiguous context, do NOT guess.
Instead:

1. **Acknowledge the gap** — state what information is missing.
2. **Ask ONE focused question** — don't dump a list; ask the highest-leverage question.
3. **Wait for the answer** — don't proceed until you have enough to route correctly.

Examples:
- ❌ "I need more info. What's your goal? What's the current state? What tools are you using?"
- ✅ "What are you trying to build or fix?" → then route based on answer.

If the request is clearly out of scope (no plugin-factory signals), proceed normally.

## Skill Selection Flow

```
User message arrives
        │
        ▼
  Any pf-* trigger keyword? ───NO──→ Proceed normally
        │
       YES
        │
        ▼
  Is intent clear? ───NO──→ Ask ONE clarifying question
        │
       YES
        │
        ▼
  Route to appropriate pf-* skill
  (see routing table above)
```

## When to Decline

Defer to the user when:
- The request is clearly outside plugin-factory's scope (no plugin signals).
- The user is asking about unrelated tooling or general development.
- The request lacks enough information to route, and you've already asked once.
