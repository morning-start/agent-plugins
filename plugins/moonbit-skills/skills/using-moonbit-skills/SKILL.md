---
name: using-moonbit-skills
description: "Use ONLY in a MoonBit project (moon.mod / *.mbt present) or when the user explicitly mentions MoonBit/moon CLI; do NOT activate outside one. Routes user intent to the correct moonbit-* skill before any action. Check this before ANY response or action."
alwaysApply: true
---

# Using MoonBit Skills

<EXTREMELY-IMPORTANT>
You are running with MoonBit Skills loaded.

If you think there is even a 1% chance a skill might apply to your task, you MUST check it.

IF A SKILL APPLIES TO YOUR TASK, YOU DO NOT HAVE A CHOICE. YOU MUST USE IT.

This is not negotiable. You cannot rationalize your way out of this.
</EXTREMELY-IMPORTANT>

## The Iron Law

```
ALWAYS CHECK SKILL BEFORE ANY ACTION
```

在任何响应或操作之前，必须先检查是否有匹配的技能。包括澄清问题、探索代码库、文件检查。如果技能存在，必须使用。

## The Rule

**Invoke relevant skills BEFORE any response or action** — including clarifying questions, codebase exploration, or file checks. If it turns out wrong for the situation, you don't have to use it.

Announce with "Using [skill] to [purpose]" and follow the skill exactly.

## Skill Priority（互斥路由）

When multiple skills match, route by intent:

| 状态 / 意图 | 技能 |
|-------------|------|
| 新项目或未决定架构/API | `moonbit-plan` |
| 已有 MoonBit 项目、接入 moonbit-skills | `moonbit-init` |
| 设计已批准、需要任务分解 | `moonbit-writing-plans` |
| 生成项目骨架 | `moonbit-scaffold` |
| 配置本地 git hooks 质量门禁 | `moonbit-init` |
| CI 配置、GitHub Actions、hooks 增强 | `moonbit-ci` |
| 文档编写、维护、更新 | `moonbit-docs` |
| 安全设计审查、威胁建模 | `moonbit-security` |
| 测试设计、组织、写法 | `moonbit-testing` |
| 已有项目、需求明确、要写代码 | `moonbit-implement` (Feature TDD) |
| 单一任务、单模块功能、逐项验收交付 | `moonbit-task` (Single Task TDD) |
| Git 分支/提交/合并/worktree 操作 | `moonbit-git` |
| 修复已有 bug、调试失败 | `moonbit-implement` (Bug Fix Mode) |
| 性能优化、瓶颈分析 | `moonbit-perform` |
| 重构、技术债务、坏味 | `moonbit-refactor` |
| 审查代码差异和设计问题 | `moonbit-code-review` |
| 检查质量或完成状态 | `moonbit-verify` |
| 发布准备 | `moonbit-evaluate` |
| 部署执行、回滚管理 | `moonbit-cd` |
| 从已定位问题中沉淀知识 | `moonbit-learn` |

## Trigger Matrix

> ⚠️ **前置条件**：以下触发词**仅在 MoonBit 项目上下文**（当前目录存在 `moon.mod`
> 或 `*.mbt` 文件，或用户明确提及 MoonBit / moon CLI 命令）时生效。非 MoonBit
> 项目（Python/JS/Rust/其他）中的同名词（build/docs/check/test/git 等）**不得**
> 路由到 moonbit-* 技能——直接回答或按其他插件流程处理。

| User says (English) | User says (中文) | Skill |
|---|---|---|
| "init", "setup", "hooks", "initialize", "onboard", "adopt", "existing project" | "初始化", "设置", "钩子", "接入", "已有项目" | `moonbit-init` |
| "ci", "github actions", "workflow", "continuous integration", "commit-msg" | "CI", "工作流", "持续集成", "commit message" | `moonbit-ci` |
| "docs", "documentation", "readme", "changelog", "docstring", "adr" | "文档", "README", "CHANGELOG", "docstring", "写文档" | `moonbit-docs` |
| "build", "create", "new", "I want to make" | "我要做", "写一个", "创建", "开发" | `moonbit-plan` |
| "plan", "design", "architecture" | "设计", "架构", "规划" | `moonbit-plan` |
| "decompose", "tasks", "breakdown", "steps" | "拆解", "任务", "步骤" | `moonbit-writing-plans` |
| "scaffold", "generate", "skeleton" | "骨架", "模板", "生成" | `moonbit-scaffold` |
| "how to test", "write tests", "test organization" | "如何测试", "写测试", "测试组织", "补测试", "测试重构" | `moonbit-testing` |
| "optimize performance", "benchmark", "profile" | "性能优化", "性能瓶颈", "测量", "基线对比" | `moonbit-perform` |
| "refactor", "technical debt", "code smell" | "重构", "技术债务", "坏味", "清理代码" | `moonbit-refactor` |
| "implement", "write code", "add feature", "build" | "实现", "写代码", "加功能" | `moonbit-implement` |
| "single task", "implement this task", "finish this task", "one module" | "实现这个任务", "单一任务", "单模块", "逐项验收" | `moonbit-task` |
| "branch", "git commit", "merge", "worktree", "git workflow" | "分支", "提交", "合并", "worktree", "git 操作" | `moonbit-git` |
| "review", "code review" | "审查", "评审", "检查" | `moonbit-code-review` |
| "verify", "check", "quality", "audit", "is it ready", "does it pass" | "验证", "检查", "质量", "审计", "是否完成", "是否通过" | `moonbit-verify` |
| "threat model", "security review", "secure design", "vulnerability" | "安全设计", "威胁建模", "安全审查", "漏洞扫描" | `moonbit-security` |
| "evaluate", "publish", "release", "ship" | "发布验收", "发布", "版本", "上线前检查" | `moonbit-evaluate` |
| "deploy", "rollout", "deployment", "rollback" | "部署", "回滚", "发布到生产" | `moonbit-cd`（evaluate 批准后） |
| "learn", "remember", "don't repeat" | "学习", "记住", "教训" | `moonbit-learn` |
| "debug", "fix", "error", "bug", "fail" | "调试", "修bug", "出错" | `moonbit-implement` (Bug Fix Mode) |

## Red Flags

These thoughts mean STOP — you are rationalizing:

| Thought | Reality |
|---------|---------|
| "This is just a simple question" | Questions are tasks. Check for skills. |
| "I need more context first" | Skill check comes BEFORE clarifying questions. |
| "Let me explore the codebase first" | Skills tell you HOW to explore. Check first. |
| "This is not a MoonBit project" | Do NOT route to moonbit skills — answer directly. |
| "I'll just fix this quickly" | Skill check comes BEFORE any action. |
| "I remember this skill" | Skills evolve. Read current version. |
| "I don't need a skill for this" | If a skill exists, use it. |
| "Let me gather information first" | Skills tell you HOW to gather information. |
| "This feels productive" | Undisciplined action wastes time. Skills prevent this. |

## 停止条件

- 无法匹配任何技能且不属于 MoonBit 领域 → 声明 "This scenario is not covered by current skills"，建议提交 issue
- 匹配到技能但技能文件不可用 → 报告缺失的技能，回退到 references/ 知识库
- 多个技能同时匹配且无法通过优先级消歧 → 列出匹配的技能，让用户选择

## 错误恢复

| 问题 | 诊断 | 修复 |
|------|------|------|
| 路由匹配失败 | 触发词不明确或多义 | 展示候选技能列表，让用户选择 |
| 目标技能文件不存在 | 技能路径错误 | 回退到 `references/` 知识库，标记缺失技能 |
| 技能加载后执行失败 | 技能内部错误 | 报告失败技能和原因，尝试降级方案 |
| 意图识别错误 | 用户说"不是这个意思" | 重新分类，使用修正后的技能 |

## 流程框架选择（flowstate 优先）

**检测**：会话中若存在 flowstate 插件（`fst-init` / `fst-change` / `fst-review` / `fst-iterate` 技能可用，或 `using-flowstate` 可加载，或项目根存在 `.agent-workplace/` 且含 flowstate 结构）→ **采用 flowstate 流程框架**。

| 情形 | 流程框架 | moonbit-skills 角色 |
|------|---------|-------------------|
| **有 flowstate** | flowstate 执行图（N1~N9）：`fst-init`（立项/冻结/设计）→ `fst-iterate`（迭代/闭环）→ `fst-review`（验收/灰度）→ `fst-change`（变更/紧急） | **MoonBit 专项执行层**：在 flowstate 节点内提供 MoonBit 专属能力（`moonbit-testing` / `moonbit-implement` / `moonbit-verify` / `moonbit-git` 等），遵循其 Iron Law 与验证门禁 |
| **无 flowstate** | moonbit-skills 自包含管线（现状不变）：`plan → writing-plans → scaffold → [testing ↔] implement → [perform ↔ refactor ↔] verify → evaluate` | 完整管线：流程 + MoonBit 专项都由本插件承担 |

**分层原则（有 flowstate 时）**：
- **流程层**（flowstate 负责）：节点流转、DoD 判据、HITL 闸门、Checkpoint、变更分级、工作区（`.agent-workplace/`）
- **专项层**（moonbit-skills 负责）：MoonBit 工具链命令、项目类型模式、测试策略、安全审计、发布验收——**只提供能力，不重新定义流程**
- 冲突时按 AGENTS.md「指令优先级」：用户要求 > 仓库约束 > 技能 > 参考

**插件自身 vs 用户项目**：
- **插件自身开发**（本仓库）：`.agent-workplace/` 为 flowstate **完整版**（modes/ + state/ + docs/spec/），按 flowstate 规范执行——本仓库开发即采用 flowstate 框架。
- **用户 MoonBit 项目**（目标项目）：无 flowstate 时用**简化版**——仅 `docs/plan/`（计划→阶段→批次→任务）、`docs/task/`（任务拆解）、`scripts/`（脚本尝试）三目录，由 `moonbit-writing-plans` / `moonbit-implement` 自行创建，**无需模板、不依赖 flowstate**（避免用户使用插件时有依赖）；有 flowstate 时按上述流程层执行。

## Pipeline (recommended flow)

```
Plan → [Spike (可选)] → [Writing-Plans] → Scaffold → [Testing ↔] Implement ↔ [Code-Review] → [Perform ↔ Refactor ↔] → Verify → Evaluate → CD
                                          ↑                    │
                                          └──── 设计回溯 ──────┘
```

注: Perform 和 Refactor 为可选双向步骤，在 implement 之后、verify 之前。两者之间可双向跳转（优化引入坏味 → refactor；重构影响热路径 → perform）。Spike 为可选原型验证步骤，在 plan 之后、writing-plans 之前。设计回溯可从 implement/perform/refactor 回到 plan。
Code-Review 支持多轮循环：未批准时回到 implement 修复，修复后自动再次触发 review。

Steps can be skipped — the pipeline is recommended, not mandatory. If the project already exists, skip scaffold. If no release is needed, skip evaluate.

## Available Skills

| Skill | When to Use |
|-------|-------------|
| `moonbit-init` | Project onboarding (existing or new), assess state, setup .agent-workplace/, git hooks, quality gates |
| `moonbit-ci` | CI pipeline, GitHub Actions workflow, local hooks enhancement, commit-msg enforcement |
| `moonbit-docs` | Write and maintain API docs, README, CHANGELOG, user guides, ADRs |
| `moonbit-security` | Threat modeling, security design review, dependency vulnerability scanning |
| `moonbit-plan` | Clarify requirements (goal/scenario/customer/boundary/maintenance), design architecture and API; macro design + module breakdown + rule carrying + maintainability |
| `moonbit-writing-plans` | Break design into executable tasks (phased, stepped, granular, maintenance phase) |
| `moonbit-scaffold` | Generate project skeleton from templates |
| `moonbit-testing` | Design tests, organize test files, timing decisions (test-first vs post-impl) |
| `moonbit-perform` | Optimize performance with measurement-driven cycle |
| `moonbit-refactor` | Refactor code with test protection, eliminate code smells |
| `moonbit-implement` | Write code via TDD (test → implement → verify); modular small-step implementation; batch limit (≤5 tasks per batch); git commit contract (one-time authorization: if the target project's AGENTS.md already records auto-commit approval → auto branch → commit → merge after acceptance; otherwise ask once and record it) |
| `moonbit-task` | Deliver a single task end-to-end: test-first TDD, item-by-item acceptance, auto commit & merge on delivery per one-time authorization, batch checkpoint on completion |
| `moonbit-git` | Branch-per-task workflow, one-time authorization commit contract (ask once → record in target project AGENTS.md → auto commit & merge afterwards), worktree (user consent required), batch checkpoints |
| `moonbit-code-review` | Review code diff and design between tasks |
| `moonbit-verify` | Full quality gate: fmt, check, test, audit |
| `moonbit-evaluate` | Release readiness, README/CHANGELOG preview, release notes, rollback assessment |
| `moonbit-cd` | Deployment execution, artifact management, rollback planning |
| `moonbit-learn` | Extract lessons from bugs, update skills |

## 路由后自检清单

路由到目标技能后，agent 应在执行前自报以下信息，确保 Iron Law 可落地：

- [ ] **目标技能**：已路由到 `moonbit-{skill}`
- [ ] **Iron Law**：已读取并理解该技能的 Iron Law（复述核心约束）
- [ ] **停止条件**：已确认本次任务的停止边界（如 3 次失败上限、用户确认点）
- [ ] **验证命令**：已确认本次任务将执行的验证命令（如 `moon test`、`moon fmt --check`）
- [ ] **输出契约**：已确认技能的 JSON 输出格式

未完成自检 → 重新读取目标技能文件，补全理解后再行动。
