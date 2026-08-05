# Superpowers 架构分析与 moonbit-skills 优化方案

> 生成日期: 2026-07-28
> 分析范围: superpowers v6.2.0 ↔ moonbit-skills v0.1.0

---

## 第一部分：Superpowers 架构学习汇总

### 一、整体组织结构

#### 1.1 顶层目录结构

```
superpowers/
├── AGENTS.md              # 贡献者指引（PR 规范、质量门禁）
├── CLAUDE.md              # Claude Code 入口（跳转到 using-superpowers）
├── GEMINI.md              # Gemini CLI 入口（@include using-superpowers）
├── README.md              # 项目介绍 + 多平台安装说明
├── package.json           # Node.js 包描述（Pi 包集成）
├── gemini-extension.json  # Gemini 扩展注册
├── .gitignore
├── .gitattributes
├── .pre-commit-config.yaml
├── .version-bump.json
│
├── skills/                # ← 核心：全部技能文件
│   ├── using-superpowers/  # 引导入口（SessionStart 注入）
│   ├── brainstorming/      # 设计头脑风暴
│   ├── writing-plans/      # 编写实现计划
│   ├── test-driven-development/
│   ├── systematic-debugging/
│   ├── subagent-driven-development/
│   ├── executing-plans/
│   ├── using-git-worktrees/
│   ├── requesting-code-review/
│   ├── receiving-code-review/
│   ├── dispatching-parallel-agents/
│   ├── verification-before-completion/
│   ├── finishing-a-development-branch/
│   └── writing-skills/     # 元技能：编写新技能
│
├── .claude-plugin/        # Claude Code 插件注册
├── .codex-plugin/         # Codex 插件注册
├── .cursor-plugin/        # Cursor 插件注册
├── .kimi-plugin/          # Kimi Code 插件注册
├── .opencode/             # OpenCode 集成
├── .pi/                   # Pi 包扩展
├── .agents/               # Antigravity 等通用 agent
├── .github/               # PR 模板 + CI
│
├── hooks/                 # 钩子系统
│   ├── hooks.json          # 钩子配置（SessionStart）
│   ├── session-start       # 注入 using-superpowers 技能到会话
│   ├── run-hook.cmd        # Windows 执行器
│   ├── pre-commit.sh
│   ├── pre-push.sh
│   └── pre-completion.sh
│
├── assets/                # 品牌资源
├── docs/                  # 文档
├── scripts/               # 自动化工具
└── tests/                 # 基础设施测试
```

#### 1.2 架构设计哲学

| 维度 | Superpowers 设计原则 |
|------|---------------------|
| **零依赖** | 纯 markdown/shell，无 npm/pip 依赖 |
| **技能自包含** | 每个技能一个目录，内含 SKILL.md + 辅助文件 |
| **扁平命名空间** | 所有技能平铺在 `skills/` 下，无子分类目录 |
| **SessionStart 注入** | 通过 hook 引导技能自动触发，非手动选择 |
| **多平台适配** | Claude/Cursor/Codex/Gemini 等各自插件配置 |
| **行为即代码** | 技能通过 Iron Law + Red Flags 约束 agent 行为 |
| **TDD 元方法论** | 编写技能本身也遵循 TDD 循环 |

#### 1.3 技能调用链路

```
Session Start
    │
    ▼
hooks/session-start  ─── 注入 using-superpowers 技能到系统提示
    │
    ▼
using-superpowers SKILL.md  ─── 核心规则：
    │                          - 任何操作前必须先检查技能
    │                          - 技能优先于自行决策
    │                          - EXTREMELY IMPORTANT 不可绕过
    ▼
匹配用户意图 → 触发对应技能

典型工作流：
"Let's build X" → brainstorming → writing-plans → subagent-driven-development
                                                    │
                                                    ├── using-git-worktrees
                                                    ├── test-driven-development (每个任务)
                                                    ├── requesting-code-review (每个任务后)
                                                    └── finishing-a-development-branch (全部完成)
```

---

### 二、插件体系

#### 2.1 多平台插件配置

| 平台 | 配置目录/文件 | 核心字段 |
|------|-----------|---------|
| **Claude Code** | `.claude-plugin/plugin.json` | name, description, version, author |
| **Codex** | `.codex-plugin/plugin.json` | name, skills (指向./skills/), interface (displayName, shortDescription, category, capabilities) |
| **Cursor** | `.cursor-plugin/` | 类似 Claude |
| **Kimi Code** | `.kimi-plugin/` | 类似 Codex |
| **OpenCode** | `.opencode/opencode.json` | instructions: 直接列出 SKILL.md 路径 |
| **Gemini CLI** | `gemini-extension.json` + `GEMINI.md` | @include 语法加载技能 |
| **Pi** | `package.json` → `pi.skills` | native skills 支持 |
| **Antigravity** | `.agents/plugins/` | 通用 agent 插件 |

#### 2.2 插件注册方式对比

| 方式 | 代表平台 | 特点 |
|------|---------|------|
| 官方 Marketplace | Claude Code: `/plugin install superpowers@claude-plugins-official` | 官方审核，一键安装 |
| 自定义 Marketplace | Claude/Copilot: 先 add marketplace 再 install | 非官方仓库 |
| GitHub 直装 | Antigravity/Cursor/Kimi/Codex CLI | `install https://github.com/...` |
| 文件引用 | OpenCode: 直接引用 SKILL.md 路径 | 最简洁，无版本管理 |
| 包管理器 | Pi: `pi install git:github.com/...` | 原生包管理 |

#### 2.3 钩子（Hook）机制

Superpowers 的钩子系统通过 `hooks/hooks.json` 定义：

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup|clear|compact",
        "hooks": [{ "type": "command", "command": "...", "async": false }]
      }
    ]
  }
}
```

三个关键钩子事件：
- **SessionStart** (matcher: `startup|clear|compact`) — 会话启动、清除、压缩后注入技能
- **PreCommit** — commit 前检查（superpowers 未使用）
- **PreCompletion** — 完成前检查（superpowers 未使用）

SessionStart hook 的核心职责：
1. 读取 `skills/using-superpowers/SKILL.md` 内容
2. 转义为 JSON 字符串
3. 通过 `additionalContext` 注入到 agent 的系统提示
4. 注：Claude Code 和 Cursor 的输出格式不同，通过环境变量区分

#### 2.4 插件 vs 技能的关系

| | 插件 (Plugin) | 技能 (Skill) |
|--|-------------|-------------|
| 定义 | 平台识别单元，含元数据 | 行为指引单元，含规则 |
| 载体 | plugin.json | SKILL.md |
| 粒度 | 一个仓库 = 一个插件 | 一个插件 = 多个技能 |
| 挂载 | 平台 Marketplace 或 CLI | SessionStart hook 注入 |
| 依赖 | 无 | 技能间可交叉引用 |

---

### 三、子 Skill 设计规则

#### 3.1 技能目录规范

```
skills/{skill-name}/
    ├── SKILL.md           # 主文件（必需）
    ├── references/        # 辅助参考（按需）
    │   └── {platform}-tools.md  # 平台适配说明
    └── *.md / *.ts        # 模板或工具脚本（按需）
```

#### 3.2 SKILL.md 文件规范

**Frontmatter（YAML 头）:**

```yaml
---
name: skill-name-with-hyphens
description: "Use when [触发条件描述] — 必须仅描述何时用，不总结工作流"
---
```

核心约束：
- `name`: 字母、数字、连字符（无括号/特殊字符）
- `description`: 第三人称，以 "Use when" 开头，不超过 500 字符
- **禁止**在 description 中总结技能的工作流（否则 agent 会跳过正文直接执行 description）

**正文结构：**

| 章节 | 是否必需 | 说明 |
|------|---------|------|
| `# Skill Name` | 必需 | 一级标题 |
| `## Overview` | 推荐 | 一句话核心原则 |
| `## When to Use` | 推荐 | 触发条件 + 流程图（可选） |
| `## The Iron Law` | 行为约束型 | 不可违背的铁律 |
| `## Checklist / The Process` | 流程型 | 分步骤执行流程 |
| `## Red Flags` | 行为约束型 | 阻止 agent 的常见合理化借口 |
| `## Common Rationalizations` | 推荐 | 借口 → 现实的对照表 |
| `## Quick Reference` | 推荐 | 速查表 |

#### 3.3 技能类型分类

| 类型 | 示例 | 核心要素 |
|------|------|---------|
| **行为约束型** | TDD, verification-before-completion, using-superpowers | Iron Law, Red Flags, Rationalizations |
| **流程型** | brainstorming, subagent-driven-development | Process Flow, Checklist, 流程图 |
| **技术型** | writing-skills, condition-based-waiting | 代码示例、Before/After 对比 |
| **工具型** | using-git-worktrees, finishing-a-development-branch | 命令脚本、决策树 |

#### 3.4 技能间调用规则

```
使用前置技能                                     产生输出
──────────────────────────────────────────     ─────────────
brainstorming ───→ docs/superpowers/specs/     → 设计文档
    │
    ▼
writing-plans  ───→ docs/superpowers/plans/     → 实现计划
    │
    ▼
subagent-driven-development  ───→ 代码提交       → 完成功能
    │
    ▼
finishing-a-development-branch                 → 合并/PR/清理
```

**关键行为规则：**
- `using-superpowers` 是唯一 alwaysApply 的技能，控制所有技能的入口
- skills 间用 `**REQUIRED SUB-SKILL:** Use superpowers:xxx` 声明依赖
- 禁止在正文中直接 `@include` 其他技能文件（浪费上下文）
- 技能间的输出传参通过文件（spec/plan 文档）而非内存

#### 3.5 技能触发方式

| 方式 | 机制 | 示例 |
|------|------|------|
| **SessionStart 注入** | hook 把技能注入系统提示 | `using-superpowers` |
| **用户意图匹配** | agent 根据用户话自动选 | `brainstorming` |
| **上游技能强制** | 当前技能强制调用下一技能 | `brainstorming` → `writing-plans` |
| **use_skill 工具** | agent 或用户手动调用 | 其他全部技能 |

#### 3.6 红牌机制（Red Flags）

这是 superpowers 的核心行为约束设计——每个约束型技能都包含一个 **Red Flags** 表，列出 agent 可能用来跳过技能的合理化借口：

```
| 想法 | 真相 |
|------|------|
| "这只是一个简单问题" | 问题也是任务，检查技能 |
| "我需要更多上下文" | 技能检查在澄清问题之前 |
| "让我先探索代码库" | 技能告诉你如何探索 |
| "我记得这个技能" | 技能在进化，重读当前版本 |
```

设计目的：**预先阻断 agent 最常见的跳过行为**。

---

## 第二部分：moonbit-skills 现状问题盘点

### 一、与 Superpowers 架构规范对照

#### 1.1 ✅ 符合项

| 维度 | moonbit-skills 现状 | 状态 |
|------|-------------------|------|
| 技能以目录组织 | `skills/{name}/SKILL.md` | ✅ |
| 插件配置存在 | `.claude-plugin/`, `.codex-plugin/` | ✅ |
| SessionStart hook | `hooks/session-start` 注入 plan 技能 | ✅ |
| 钩子脚本 | pre-commit.sh, pre-push.sh, pre-completion.sh, run-hook.cmd | ✅ |
| 多平台支持 | Claude Code + Codex + OpenCode + AtomCode | ✅ |
| 结构化 frontmatter | 每个 SKILL.md 有 name + description | ✅ |
| 引用知识库 | `references/patterns/`, `references/idioms.md` | ✅ |
| 协作模型清晰 | 用户决策→Agent 执行 | ✅ |

#### 1.2 ❌ 不符合项（需要优化）

| # | 问题 | 严重程度 | 说明 |
|---|------|---------|------|
| **P1** | **没有 using-moonbit-skills 的自引导机制** | **高** | 当前是最外层的引导技能，但未作为 SessionStart 注入的系统提示核心（superpowers 的 using-superpowers 是 EXTREMELY-IMPORTANT 级的实体）。目前 hooks/session-start 注入的是 `plan/SKILL.md`，而非引导入口 |
| **P2** | **只有 2 个平台插件，缺失多平台适配** | **中** | superpowers 支持 10+ 平台；moonbit-skills 只有 Claude Code 和 Codex，缺少 Cursor、Gemini CLI、Kimi Code、Copilot CLI、Pi、Antigravity |
| **P3** | **缺少 Iron Law 约束机制** | **高** | superpowers 每个约束型技能都有 Iron Law 铁律段；moonbit-skills 的技能以中文描述为主，缺少 agent 不可绕过的硬约束声明 |
| **P4** | **缺少 Red Flags / Rationalizations 表** | **高** | moonbit-skills 技能中没有阻止 agent 跳过行为的关键约束表；agent 遇到非 MoonBit 任务可能直接跳过 |
| **P5** | **SessionStart hook 注入的是 plan 而非引导入口** | **高** | 当前注入 `plan/SKILL.md`，跳过了 `using-moonbit-skills` 的路由逻辑；应注入引导入口，让引导入口负责路由 |
| **P6** | **技能以中文命名，不合 superpowers 规范** | **低** | superpowers 要求技能名用字母和连字符；moonbit-skills 的 description 和正文以中文为主——这适应 MoonBit 中文社区是合理的，但技能名不含中文字符 |
| **P7** | **缺少代码审查技能** | **中** | superpowers 有独立的 `requesting-code-review` 和 `receiving-code-review` 技能；moonbit-skills 把审查合并到 verify 中，职责不够单一 |
| **P8** | **优先级/触发引导不够强** | **中** | using-moonbit-skills 中 "If a skill applies, you MUST use it" 符合规范，但缺少 EXTREMELY-IMPORTANT 强调标签和完整的 Red Flags 表 |
| **P9** | **缺少 workspace worktree 支持** | **中** | superpowers 有 `using-git-worktrees` 隔离开发环境；moonbit-skills 缺少此机制 |
| **P10** | **缺少 plan 到 implement 的衔接技能 writing-plans** | **中** | superpowers 设计为 brainstorming → writing-plans → TDD/implement；moonbit-skills 直接从 plan → implement，缺少实现计划生成的显式步骤 |
| **P11** | **hooks/session-start 输出格式只有 Claude Code** | **中** | superpowers 的 session-start 区分 CURSOR_PLUGIN_ROOT / CLAUDE_PLUGIN_ROOT / COPILOT_CLI 三种输出格式；moonbit-skills 的实现只处理 Claude Code 格式 |
| **P12** | **技能 description 中包含工作流描述** | **中** | superpowers 明确禁止在 description 中总结工作流（会导致 agent 跳过正文）。moonbit-skills 几乎所有技能的 description 都包含了流程描述 |

---

## 第三部分：完整优化方案

### 一、目录结构调整

#### 3.1 新目录结构（建议）

```
moonbit-skills/
├── AGENTS.md                    # 项目指引（保留）
├── CLAUDE.md                    # 精简，指向 using-moonbit-skills
├── README.md                    # 更新安装说明
├── package.json                 # 添加 Pi 包支持
│
├── skills/                      # 技能扁平目录
│   ├── using-moonbit-skills/    # 引导入口（alwaysApply，增强版）
│   │   └── SKILL.md             # EXTREMELY-IMPORTANT + Red Flags + 路由表
│   ├── moonbit-init/
│   │   └── SKILL.md
│   ├── moonbit-plan/
│   │   └── SKILL.md
│   ├── moonbit-scaffold/
│   │   └── SKILL.md
│   ├── moonbit-writing-plans/   # [新增] 实现计划生成
│   │   └── SKILL.md
│   ├── moonbit-implement/
│   │   └── SKILL.md
│   ├── moonbit-code-review/     # [新增] 代码审查（从 verify 拆分）
│   │   └── SKILL.md
│   ├── moonbit-verify/
│   │   └── SKILL.md
│   ├── moonbit-evaluate/
│   │   └── SKILL.md
│   └── moonbit-learn/
│       └── SKILL.md
│
├── references/                  # 知识库（保持不变）
├── templates/                   # 模板（保持不变）
├── hooks/                       # 钩子系统（增强）
│   ├── hooks.json
│   ├── session-start            # 注入 using-moonbit-skills（修复）
│   ├── run-hook.cmd
│   ├── pre-commit.sh
│   ├── pre-push.sh
│   └── pre-completion.sh
│
├── plugins/                     # 外部插件目录
│
├── .claude-plugin/              # 插件注册（所有平台）
├── .codex-plugin/
├── .cursor-plugin/              # [新增]
├── .kimi-plugin/                # [新增]
├── .opencode/
├── .pi/                         # [新增]
│
├── evals/                       # 评估测试
├── scripts/                     # 自动化脚本
└── docs/                        # [新增] 设计文档和计划
    └── superpowers/
        ├── specs/
        └── plans/
```

### 二、关键改造点详解

#### 2.1 SessionStart hook 修复（高优先级）

**问题**：当前注入的是 `plan/SKILL.md`，跳过了引导入口。

**改造方案**：改为注入 `using-moonbit-skills/SKILL.md`，并支持多平台输出格式。

改造后的 `hooks/session-start` 行为：
1. 读取 `skills/using-moonbit-skills/SKILL.md`
2. 用 EXTREMELY-IMPORTANT 包裹注入
3. 根据平台选择输出格式：
   - CLAUDE_PLUGIN_ROOT + COPILOT_CLI=1 → Copilot CLI 格式
   - CLAUDE_PLUGIN_ROOT → Claude Code 格式
   - CURSOR_PLUGIN_ROOT → Cursor 格式
   - 其他 → 通用格式

#### 2.2 using-moonbit-skills 增强（高优先级）

加入以下关键要素：

```markdown
---
name: using-moonbit-skills
description: "Bootstrap skill — use at session start. Establishes the MoonBit Skills workflow: routes user intent to the correct moonbit-* skill. Check this before any action."
alwaysApply: true
---

<EXTREMELY-IMPORTANT>
You are running with MoonBit Skills loaded.

If you think there is even a 1% chance a skill might apply, you MUST check.
IF A SKILL APPLIES TO YOUR TASK, YOU DO NOT HAVE A CHOICE. YOU MUST USE IT.
This is not negotiable.
</EXTREMELY-IMPORTANT>

## The Rule

**Invoke relevant skills BEFORE any response or action** — including clarifying questions, exploring the codebase, or checking files.

## Trigger Matrix

| User says | Skill |
|-----------|-------|
| "init", "setup", "hooks" | moonbit-init |
| "build", "create", "new", "我要做" | moonbit-plan (entry to pipeline) |
| "plan", "design", "architecture" | moonbit-plan |
| "scaffold", "generate" | moonbit-scaffold |
| "implement", "write code", "add feature" | moonbit-implement |
| "review", "audit", "verify", "quality" | moonbit-verify |
| "evaluate", "publish", "release" | moonbit-evaluate |
| "learn", "remember", "记住" | moonbit-learn |
| "debug", "fix", "error", "bug", "fail" | moonbit-implement (debug mode) |

## Skill Priority

Process skills first (plan → scaffold → implement), quality skills after (verify → evaluate).

## Red Flags

| Thought | Reality |
|---------|---------|
| "This is not a MoonBit project" | Skills still apply — check intent matching |
| "I'll just fix this quickly" | Skill check comes BEFORE any action |
| "I remember this skill" | Skills evolve — read the current version |
| "Let me explore the codebase first" | Skills tell you HOW to explore |

## Pipeline

Plan → Scaffold → Implement → Verify → Evaluate
(Steps can be skipped — pipeline is recommended, not mandatory)
```

#### 2.3 增加 Iron Law + Red Flags 到每个约束型技能（高优先级）

以 `moonbit-implement/SKILL.md` 为例，加入：

```markdown
## The Iron Law

```
NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST
```

Write code before the test? Delete it. Start over.

## Red Flags

| 想法 | 真相 |
|------|------|
| "太简单了不需要测试" | 简单代码也会出问题 |
| "我一会儿再补测试" | 事后的测试证明不了什么 |
| "这个手动验证过了" | 手动验证没法重跑 |
```

#### 2.4 新增 moonbit-writing-plans 技能（中优先级）

在 plan 和 implement 之间增加实现计划生成环节：

```
moonbit-plan → moonbit-writing-plans → moonbit-implement
```

职责：将设计文档拆解为可执行的实现任务列表，每个任务包含：
- 文件路径
- 接口定义（consumes/produces）
- TDD 步骤（Red-Green-Verify）
- 测试命令

#### 2.5 新增 moonbit-code-review 技能（中优先级）

从 `moonbit-verify` 中拆分出独立的代码审查技能：
- `requesting-code-review`: 任务完成后 Agent 发起审查
- 与 superpowers 的 review 流程对齐：spec compliance → code quality 两级审查

#### 2.6 多平台插件配置（低优先级）

新增以下平台的注册文件：

| 平台 | 配置文件 |
|------|---------|
| Cursor | `.cursor-plugin/plugin.json` |
| Kimi Code | `.kimi-plugin/plugin.json` |
| Pi | `package.json` → `pi.skills` |
| Gemini CLI | `gemini-extension.json` + 简短 `GEMINI.md` |

#### 2.7 技能 description 修复

清理所有 description 中总结工作流的部分，改为纯触发条件描述：

```
❌ 改前:
"Plan a MoonBit project — figure out requirements, architecture, and API surface before writing code..."

✅ 改后:
"Use when starting a new MoonBit project or before writing MoonBit code."
```

### 三、技能拆分重组细则

| 当前技能 | 操作 | 说明 |
|---------|------|------|
| `using-moonbit-skills` | **增强** | 加入 EXTREMELY-IMPORTANT、Red Flags、多平台路由 |
| `moonbit-init` | **保留** | 内容已较完整，补充 Iron Law |
| `moonbit-plan` | **保留** | 补充 Red Flags，修复 description |
| `moonbit-scaffold` | **保留** | 内容合理，补充约束声明 |
| `moonbit-implement` | **保留 + 增强** | 加入 Iron Law + Red Flags + 常见Rationalizations |
| `moonbit-verify` | **拆分** | 拆分出 moonbit-code-review，保留纯验证管道 |
| `moonbit-evaluate` | **保留** | 内容已较完整 |
| `moonbit-learn` | **保留** | 内容合理 |
| **[新增] moonbit-writing-plans** | **新增** | plan → implement 的衔接 |
| **[新增] moonbit-code-review** | **新增** | 从 verify 拆分 |

---

## 第四部分：落地执行步骤

### 一、执行优先级排序

| 优先级 | 改造项 | 工作量 | 交付物 |
|--------|-------|--------|--------|
| **P0** | SessionStart hook 修复 + using-moonbit-skills 增强 | 2h | 修改 `hooks/session-start` + `skills/using-moonbit-skills/SKILL.md` |
| **P0** | `moonbit-implement` 加入 Iron Law + Red Flags | 1h | 修改 `skills/implement/SKILL.md` |
| **P1** | 修复所有技能 description（去工作流描述） | 1h | 修改 7 个 SKILL.md 的 frontmatter |
| **P1** | 拆分 verify → verify + code-review | 3h | 新建 `skills/moonbit-code-review/SKILL.md`，修改 `skills/verify/SKILL.md` |
| **P2** | 新增 writing-plans 技能 | 4h | 新建 `skills/moonbit-writing-plans/SKILL.md` |
| **P2** | 多平台插件（Cursor/Kitimi/Pi/Gemini） | 3h | 新增 4 个平台注册文件 |
| **P3** | 新增 worktree 支持 | 2h | 新增 `skills/moonbit-worktrees/SKILL.md` |
| **P3** | 评估测试体系建设 | 4h | 新增 `evals/` 目录和测试用例 |

### 二、代码结构示例

#### 示例 1：改造后的 hooks/session-start

```bash
#!/usr/bin/env bash
# SessionStart hook for moonbit-skills plugin (multi-platform)
# Injects using-moonbit-skills bootstrap into agent session

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PLUGIN_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

skill_content=$(cat "${PLUGIN_ROOT}/skills/using-moonbit-skills/SKILL.md" 2>&1 || echo "Error reading bootstrap skill")

escape_for_json() {
    local s="$1"
    s="${s//\\/\\\\}"
    s="${s//\"/\\\"}"
    s="${s//$'\n'/\\n}"
    s="${s//$'\r'/\\r}"
    s="${s//$'\t'/\\t}"
    printf '%s' "$s"
}

skill_escaped=$(escape_for_json "$skill_content")

session_context="<EXTREMELY-IMPORTANT>\nYou have MoonBit Skills loaded.\n\n**Below is the full content of the MoonBit Skills bootstrap:**\n\n${skill_escaped}\n</EXTREMELY-IMPORTANT>"

# Multi-platform dispatch
if [ -n "${CURSOR_PLUGIN_ROOT:-}" ]; then
  printf '{\n  "additional_context": "%s"\n}\n' "$session_context"
elif [ -n "${CLAUDE_PLUGIN_ROOT:-}" ] && [ -z "${COPILOT_CLI:-}" ]; then
  printf '{\n  "hookSpecificOutput": {\n    "hookEventName": "SessionStart",\n    "additionalContext": "%s"\n  }\n}\n' "$session_context"
else
  printf '{\n  "additionalContext": "%s"\n}\n' "$session_context"
fi

exit 0
```

#### 示例 2：改造后的 using-moonbit-skills/SKILL.md（核心片段）

```markdown
---
name: using-moonbit-skills
description: "Bootstrap skill — use at session start. Establishes the MoonBit Skills workflow and routes user intent to the correct moonbit-* skill before any action."
alwaysApply: true
---

<EXTREMELY-IMPORTANT>
你已加载 MoonBit Skills 技能系统。

如果某个技能可能适用于当前任务，你**必须**检查并调用它。
如果某个技能适用于当前任务，你**没有选择**，必须使用。
这不可协商。

If you think there is even a 1% chance a skill might apply, you MUST check.
IF A SKILL APPLIES TO YOUR TASK, YOU DO NOT HAVE A CHOICE. YOU MUST USE IT.
This is not negotiable.
</EXTREMELY-IMPORTANT>

## 核心规则

**在任何响应或操作之前** — 包括提澄清问题、探索代码库、检查文件 — 先调用匹配的技能。
如果不确定，先加载技能再看是否适用。

## 技能匹配表

| 用户意图 | 触发的技能 |
|---------|-----------|
| "init/setup/hooks/初始化" | moonbit-init |
| "我要做/写/创建/构建/开发" | moonbit-plan（入口） |
| "设计/架构/规划/计划/plan" | moonbit-plan |
| "骨架/模板/生成/scaffold" | moonbit-scaffold |
| "实现/写代码/加功能/implement" | moonbit-implement |
| "检查/审查/审计/验证/verify" | moonbit-verify |
| "发布/部署/发布准备/evaluate" | moonbit-evaluate |
| "学习/记住/更新技能/learn" | moonbit-learn |
| "调试/修bug/错误/失败/debug" | moonbit-implement（调试模式） |

## 技能优先级

流程技能优先（plan → scaffold → implement），质量技能随后（verify → evaluate）。

## 红牌 — 立即停止

| 你的想法 | 真相 |
|---------|------|
| "这只是个简单问题" | 问题也是任务，检查技能 |
| "我要先看看代码库" | 技能告诉你怎么看，先检查 |
| "这不是 MoonBit 项目" | 技能可能仍然适用 |
| "我赶时间" | 越急越不能跳过规则 |
| "我记得这个技能" | 技能在进化，重读当前版本 |

## 管线流程

Plan → [Writing-Plans] → Scaffold → Implement → Verify → Evaluate
（步骤可按需跳过，非强制顺序）
```

## 第五部分：验收标准与兼容性说明

### 一、验收标准

#### 1.1 功能兼容性

| 检查项 | 验收条件 |
|--------|---------|
| 所有现有 7 个技能功能不变 | 改造后每个技能的输出 JSON 结构不变 |
| session-start hook 可用 | 在 Claude Code 中启动会话后，`/skills` 菜单正常显示 8+ 个技能 |
| 插件可安装 | `.claude-plugin/plugin.json` + `.codex-plugin/plugin.json` 格式正确 |
| 技能文件可读 | 所有 SKILL.md 的 frontmatter YAML 合法 |
| hooks 脚本可执行 | pre-commit.sh / pre-push.sh / pre-completion.sh 语法正确 |

#### 1.2 新增功能验收

| 检查项 | 验收条件 |
|--------|---------|
| SessionStart 注入引导入口 | 启动会话后 `using-moonbit-skills` 出现在系统提示中 |
| Red Flags生效 | agent 在尝试跳过技能时被约束 |
| code-review 独立可用 | `use_skill moonbit-code-review` 正常执行 |
| writing-plans 可生成 | 输入设计方案后输出结构化的计划文档 |
| 多平台插件注册 | `plugin.json` 符合 Cursor/Kimi 的格式要求 |

#### 1.3 行为验收

| 检查项 | 验收条件 |
|--------|---------|
| agent 不跳过技能 | 测试 "debug this bug" 时自动触发 implement 而非直接修改 |
| agent 遵守 Iron Law | TDD 任务中先写测试再写实现 |
| skill 不互相冲突 | 同时触发 plan 和 implement 时 plan 优先 |

### 二、兼容性说明

| 风险点 | 影响 | 缓解措施 |
|--------|------|---------|
| hooks/session-start 输出格式变更 | 旧版 Claude Code 可能不识别新字段 | 保留 `additionalContext` 回退字段 |
| skill 路径不变 | 不影响已安装的插件引用 | 不移动任何现有 skill 的目录路径 |
| skill description 精简 | 部分 agent 依赖旧 description 的流程描述 | 在正文中保留详细的流程说明 |
| 新增技能文件 | 不影响已有技能调用 | 新增文件不影响现有引用 |

### 三、后续拓展建议

| 方向 | 说明 | 优先级 |
|------|------|--------|
| 评估测试体系 | 建立 `evals/` 目录，参照 superpowers-evals 做行为测试 | 中 |
| 英文版本 | 技能正文提供中英双语版本，扩大受众 | 低 |
| CI/CD 集成 | 新增 `.github/workflows/` 用于技能格式自动化验证 | 低 |
| 社区插件市场 | 发布到 Claude/Cursor 官方市场 | 低 |
| 亚代理执行 | 集成 subagent-driven-development 模式 | 中 |
