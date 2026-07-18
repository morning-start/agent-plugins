# MoonBit Skill — Collaborative Development

## Mission

用户做架构决策和 API 设计，Agent 做实现和验证。通过对话模式协作，不是流水线。

## Layout

```
moonbit-skills/
├── AGENTS.md              ← this file
├── CLAUDE.md              ← agent instruction
├── SKILL.md               ← main entry: 协作模型 + 技能入口
├── skills/                ← 对话模式 + 原子能力 (每个子目录含 SKILL.md)
│   ├── clarify/SKILL.md   # 模式: 需求澄清
│   ├── design/SKILL.md    # 模式: 设计决策
│   ├── implement/SKILL.md # 模式: TDD 实现
│   ├── evaluate/SKILL.md  # 模式: 评估验收
│   ├── scaffold/SKILL.md  # 能力: 项目脚手架
│   ├── debug/SKILL.md     # 能力: 调试
│   ├── review/SKILL.md    # 能力: 代码审查
│   ├── verify/SKILL.md    # 能力: 验证门禁
│   └── publish/SKILL.md   # 能力: 发布
├── hooks/                 ← 钩子注入
│   ├── hooks.json
│   ├── session-start
│   └── run-hook.cmd
├── .claude-plugin/        ← Claude Code 插件
│   └── plugin.json
├── .codex-plugin/         ← Codex 插件
│   └── plugin.json
├── docs/                  ← 文档和计划
│   ├── README.md
│   ├── plans/
│   └── specs/
├── scripts/               ← 自动化脚本
│   └── README.md
├── references/            ← 知识库
│   ├── arch-patterns.md
│   ├── commands.md
│   ├── idioms.md
│   └── decision-tree.md
├── templates/             ← 模板
│   ├── moon.mod.json
│   ├── moon.pkg.json
│   ├── lib.mbt
│   ├── test.mbt
│   └── ffi.mbt
├── .agents/               ← agent definitions
│   ├── agent/
│   └── skills/
├── analysis_reference/    ← to be deleted
└── draft/                 ← to be deleted
```

## 协作模型

```
用户说"我要做 X"
    │
    ├── clarify: Agent 问清楚 → 用户描述需求
    ├── design: Agent 展示知识 → 用户决定架构 + 设计 API
    ├── implement: Agent 逐个任务 TDD → 用户审查/调整
    └── evaluate: Agent 验证 → 用户判断"好了"或"再改"
```

**用户做决策，Agent 做执行。**

## Key Constraints

- `draft/` and `analysis_reference/` are learning materials — delete after migration
- `skills/` contains patterns (how to collaborate) and capabilities (what to execute)
- Each skill file is self-contained: when to use, what happens, user vs Agent roles
