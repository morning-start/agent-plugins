# MoonBit Skill — Collaborative Development

## Mission

用户做架构决策和 API 设计，Agent 做实现和验证。通过对话模式协作，不是流水线。

## Layout

```
moonbit-skills/
├── AGENTS.md              ← this file
├── SKILL.md               ← main entry: 协作模型 + 技能入口
├── skills/                ← 6 个核心技能
│   ├── init/SKILL.md      # moonbit-init: 项目初始化 + git hooks 配置
│   ├── plan/SKILL.md      # moonbit-plan: 需求澄清 + 设计决策
│   ├── implement/SKILL.md # moonbit-implement: TDD 实现 (内置 debug)
│   ├── evaluate/SKILL.md  # moonbit-evaluate: 评估验收 + 发布准备
│   ├── scaffold/SKILL.md  # moonbit-scaffold: 项目脚手架
│   └── verify/SKILL.md    # moonbit-verify: 验证门禁 (含 review + moon-audit)
├── references/            ← 知识库
│   ├── patterns/         # 各类型架构模式 (cli, c-ffi, wasm, parser, async, lib)
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
    ├── moonbit-init: Agent 配置 git hooks → 项目就绪
    ├── moonbit-plan: Agent 问清楚 + 展示方案 → 用户决定架构 + 设计 API
    ├── moonbit-scaffold: Agent 生成骨架 → 用户确认
    ├── moonbit-implement: Agent 逐个任务 TDD → 用户审查/调整
    └── moonbit-evaluate: Agent 验证 → 用户判断"好了"或"再改"
```

**用户做决策，Agent 做执行。**

## Key Constraints

- `skills/` 包含 6 个核心技能，每个自包含：何时用、做什么、用户 vs Agent 角色
- `references/` 是知识库，不是技能 — Agent 参考用，不直接执行
- `templates/` 是脚手架模板，按类型分目录