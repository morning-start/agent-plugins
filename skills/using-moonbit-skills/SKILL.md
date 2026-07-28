---
name: using-moonbit-skills
description: "Use at session start as bootstrap skill — establishes the MoonBit Skills workflow and routes user intent to the correct moonbit-* skill before any action. Check this before ANY response or action."
alwaysApply: true
---

# Using MoonBit Skills

<EXTREMELY-IMPORTANT>
You are running with MoonBit Skills loaded.

If you think there is even a 1% chance a skill might apply to your task, you MUST check it.

IF A SKILL APPLIES TO YOUR TASK, YOU DO NOT HAVE A CHOICE. YOU MUST USE IT.

This is not negotiable. You cannot rationalize your way out of this.
</EXTREMELY-IMPORTANT>

## The Rule

**Invoke relevant skills BEFORE any response or action** — including clarifying questions, codebase exploration, or file checks. If it turns out wrong for the situation, you don't have to use it.

Announce with "Using [skill] to [purpose]" and follow the skill exactly.

## Skill Priority（互斥路由）

When multiple skills match, route by intent:

| 状态 / 意图 | 技能 |
|-------------|------|
| 新项目或未决定架构/API | `moonbit-plan` |
| 设计已批准、需要任务分解 | `moonbit-writing-plans` |
| 已有项目、需求明确、要写代码 | `moonbit-implement` |
| 当前实现失败 | `moonbit-implement` (debug) |
| 审查代码差异和设计问题 | `moonbit-code-review` |
| 检查质量或完成状态 | `moonbit-verify` |
| 发布准备 | `moonbit-evaluate` |
| 从已定位问题中沉淀知识 | `moonbit-learn` |

## Trigger Matrix

| User says (English) | User says (中文) | Skill |
|---|---|---|
| "init", "setup", "hooks", "initialize" | "初始化", "设置", "钩子" | `moonbit-init` |
| "build", "create", "new", "I want to make" | "我要做", "写一个", "创建", "开发" | `moonbit-plan` |
| "plan", "design", "architecture" | "设计", "架构", "规划" | `moonbit-plan` |
| "decompose", "tasks", "breakdown", "steps" | "拆解", "任务", "步骤" | `moonbit-writing-plans` |
| "scaffold", "generate", "skeleton" | "骨架", "模板", "生成" | `moonbit-scaffold` |
| "implement", "write code", "add feature", "build" | "实现", "写代码", "加功能" | `moonbit-implement` |
| "review", "code review", "audit" | "审查", "评审", "检查" | `moonbit-code-review` |
| "verify", "check", "quality", "audit", "security" | "验证", "检查", "质量" | `moonbit-verify` |
| "evaluate", "publish", "release", "ship" | "发布", "验收", "部署" | `moonbit-evaluate` |
| "learn", "remember", "don't repeat" | "学习", "记住", "教训" | `moonbit-learn` |
| "debug", "fix", "error", "bug", "fail" | "调试", "修bug", "出错" | `moonbit-implement` (debug) |

## Red Flags

These thoughts mean STOP — you are rationalizing:

| Thought | Reality |
|---------|---------|
| "This is just a simple question" | Questions are tasks. Check for skills. |
| "I need more context first" | Skill check comes BEFORE clarifying questions. |
| "Let me explore the codebase first" | Skills tell you HOW to explore. Check first. |
| "This is not a MoonBit project" | Skills may still apply — check intent. |
| "I'll just fix this quickly" | Skill check comes BEFORE any action. |
| "I remember this skill" | Skills evolve. Read current version. |
| "I don't need a skill for this" | If a skill exists, use it. |
| "Let me gather information first" | Skills tell you HOW to gather information. |
| "This feels productive" | Undisciplined action wastes time. Skills prevent this. |

## Pipeline (recommended flow)

```
Plan → [Writing-Plans] → Scaffold → Implement → [Code-Review] → Verify → Evaluate
```

Steps can be skipped — the pipeline is recommended, not mandatory. If the project already exists, skip scaffold. If no release is needed, skip evaluate.

## Available Skills

| Skill | When to Use |
|-------|-------------|
| `moonbit-init` | New project, setup git hooks, quality gates |
| `moonbit-plan` | Clarify requirements, design architecture and API |
| `moonbit-writing-plans` | Break design into executable implementation tasks |
| `moonbit-scaffold` | Generate project skeleton from templates |
| `moonbit-implement` | Write code via TDD (test → implement → verify) |
| `moonbit-code-review` | Review code diff and design between tasks |
| `moonbit-verify` | Full quality gate: fmt, check, test, audit |
| `moonbit-evaluate` | Release readiness, README preview, CI config preview |
| `moonbit-learn` | Extract lessons from bugs, update skills |
