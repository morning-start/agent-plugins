---
name: moonbit-skill
description: "MoonBit 工程化开发技能。用户做架构决策和 API 设计，Agent 做实现和验证。通过 5 个技能协作：plan→scaffold→implement→verify→evaluate。使用场景：任何 MoonBit 项目开发，包括创建新项目、编写代码、调试、审查、发布。当用户说 '我要做 MoonBit 项目'、'写一个 MoonBit 的 X'、'帮我开发 MoonBit 的 Y' 时触发。入口点是 skills/plan/SKILL.md。"
---

# MoonBit 开发技能

## 协作模型

```
用户说"我要做 X"
    │
    ├── plan: Agent 问清楚 + 展示方案 → 用户决定架构 + 设计 API
    │
    ├── scaffold: Agent 生成 → 用户确认骨架
    │
    ├── implement: Agent 逐个任务 TDD → 用户审查/调整
    │   └── 失败时内置 debug: 3 次自动修复 → 问用户
    │
    └── evaluate: Agent 验证 → 用户判断"好了"或"再改"
         │
         └── 通过 → 发布准备 (README + CI)
```

**用户做决策，Agent 做执行。**

## 技能列表

### 对话模式 (4 个)

| 技能 | 入口条件 | 合并了 |
|------|---------|--------|
| `plan/` | 用户说「我要做 X」 | clarify + design |
| `scaffold/` | 设计方案确定后 | — |
| `implement/` | 骨架生成后 | 内置 debug |
| `evaluate/` | 实现完成后 | evaluate + publish |

### 原子能力 (1 个)

| 能力 | 入口条件 | 合并了 |
|------|---------|--------|
| `verify/` | 需要验证/审查/审计 | review + verify + moon-audit |

## 编排

```
用户说"我要做 X"
    │
    ▼
plan(SKILL.md) ──→ scaffold(SKILL.md) ──→ implement(SKILL.md) ──→ evaluate(SKILL.md)
    │                     │                     │
    │                     │                     └── debug 内置 (3 次后问用户)
    │                     │
    │                     └── 模板: templates/{type}/
    │
    └── 参考: references/patterns/, references/idioms.md, references/commands.md
```

阶段切换时调用 `verify/` 做门禁检查。

## 启动方式

```bash
# 用户说:
# "我要做一个 TOML 解析器 in MoonBit"
# 或
# "帮我把这个 JSON 解析器改成 MoonBit"
# 或
# "我想写一个 MoonBit 的 CLI 工具"

# Agent 加载 skills/plan/SKILL.md 开始对话
```

## 设计原则

1. **用户是设计者，不是选择器** — 用户描述想要什么，Agent 填充细节
2. **Agent 是执行者，不是流水线** — Agent 逐个实现、验证、展示
3. **对话驱动，不是阶段驱动** — 不预设顺序，根据用户需求切换
4. **失败时问人，不要死磕** — 3 次自动修复失败就暂停，问用户方向
5. **验证是持续的过程** — 每个任务完成都验证，不是最后才做