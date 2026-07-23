# MoonBit Skill — Collaborative Development

## Mission

用户做架构决策和 API 设计，Agent 做实现和验证。通过对话模式协作，不是流水线。

## Layout

```
moonbit-skills/
├── AGENTS.md              ← this file
├── SKILL.md               ← main entry: 协作模型 + 技能入口
├── skills/                ← 5 个核心技能
│   ├── plan/SKILL.md      # 模式: 需求澄清 + 设计决策 (原名 clarify + design)
│   ├── implement/SKILL.md # 模式: TDD 实现 (内置 debug)
│   ├── evaluate/SKILL.md  # 模式: 评估验收 + 发布准备 (原名 evaluate + publish)
│   ├── scaffold/SKILL.md  # 能力: 项目脚手架
│   └── verify/SKILL.md    # 能力: 验证门禁 (含 review + moon-audit)
├── references/            ← 知识库
│   ├── arch-patterns.md   # 架构模式参考
│   ├── idioms.md          # MoonBit 惯用写法 + API 速查
│   └── commands.md        # MoonBit 命令参考
├── hooks/                 ← 钩子注入
│   ├── hooks.json
│   ├── session-start
│   └── run-hook.cmd
├── templates/             ← 模板
│   ├── lib/
│   ├── cli/
│   ├── c-ffi/
│   └── wasm/
├── .claude-plugin/        ← Claude Code 插件
├── .codex-plugin/         ← Codex 插件
├── evals/                 ← 评估
└── scripts/               ← 自动化脚本
```

## 协作模型

```
用户说"我要做 X"
    │
    ├── plan: Agent 问清楚 + 展示方案 → 用户决定架构 + 设计 API
    ├── scaffold: Agent 生成骨架 → 用户确认
    ├── implement: Agent 逐个任务 TDD → 用户审查/调整
    └── evaluate: Agent 验证 → 用户判断"好了"或"再改"
```

**用户做决策，Agent 做执行。**

## Key Constraints

- `skills/` 包含 5 个核心技能，每个自包含：何时用、做什么、用户 vs Agent 角色
- `references/` 是知识库，不是技能 — Agent 参考用，不直接执行
- `templates/` 是脚手架模板，按类型分目录