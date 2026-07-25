---
name: moonbit-skill
description: "MoonBit 工程化开发技能。用户做架构决策和 API 设计，Agent 做实现和验证。通过 7 个技能协作：moonbit-init→moonbit-plan→moonbit-scaffold→moonbit-implement→moonbit-verify→moonbit-evaluate，外加 moonbit-learn 实现自我进化。使用场景：任何 MoonBit 项目开发，包括创建新项目、编写代码、调试、审查、发布。当用户说 '我要做 MoonBit 项目'、'写一个 MoonBit 的 X'、'帮我开发 MoonBit 的 Y' 时触发。入口点是 skills/plan/SKILL.md。"
---

# MoonBit 开发技能

## 协作模型

```
用户说"我要做 X"
    │
    ├── moonbit-init: Agent 配置 git hooks → 项目就绪
    │
    ├── moonbit-plan: Agent 问清楚 + 展示方案 → 用户决定架构 + 设计 API
    │
    ├── moonbit-scaffold: Agent 生成 → 用户确认骨架
    │
    ├── moonbit-implement: Agent 逐个任务 TDD → 用户审查/调整
│   └── 失败时内置 debug: 3 次自动修复 → 问用户
│       └── 用户介入后 → moonbit-learn: 吸收错误，更新技能
│
├── moonbit-verify: Agent 全量门禁检查 → 用户判断
│
└── moonbit-evaluate: Agent 验证 → 用户判断"好了"或"再改"
     │
     └── 通过 → 发布准备 (README + CI)
```

**用户做决策，Agent 做执行。**

## 技能列表与路由

完整流程和状态说明见 `references/orchestration.md`。这里仅保留入口路由：

| 用户意图 | 技能 |
|---------|------|
| 初始化项目、配置 git hooks | `moonbit-init` |
| 开始新项目、规划架构 | `moonbit-plan` |
| 生成项目骨架 | `moonbit-scaffold` |
| 写代码、修 bug、重构 | `moonbit-implement` |
| 检查、审查、安全审计 | `moonbit-verify` |
| 验收、发布、部署 | `moonbit-evaluate` |
| 记 bug、学教训、更新技能 | `moonbit-learn` |

每个技能的详细输入、动作、输出和下一步，见对应的 `skills/{name}/SKILL.md`（如 `skills/init/SKILL.md` → `moonbit-init`）。

## 启动方式

用户只需描述 MoonBit 目标。Agent 从 `moonbit-plan` 开始；已有项目或直接修 bug 时，按用户意图进入对应技能。


```bash
# 用户说:
# "我要做一个 TOML 解析器 in MoonBit"
# 或
# "帮我把这个 JSON 解析器改成 MoonBit"
# 或
# "我想写一个 MoonBit 的 CLI 工具"

# Agent 加载 skills/plan/SKILL.md (moonbit-plan) 开始对话
```

## 设计原则

1. **用户是设计者，不是选择器** — 用户描述想要什么，Agent 填充细节
2. **Agent 是执行者，不是流水线** — Agent 逐个实现、验证、展示
3. **对话驱动，不是阶段驱动** — 不预设顺序，根据用户需求切换
4. **失败时问人，不要死磕** — 3 次自动修复失败就暂停，问用户方向
5. **验证是持续的过程** — 每个任务完成都验证，不是最后才做