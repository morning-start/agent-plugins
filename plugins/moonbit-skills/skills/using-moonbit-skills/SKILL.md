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

## 能力边界

moonbit-skills 聚焦 **MoonBit 专属**能力，只承载 **设计、骨架生成、测试设计、验证、CI 基础设施** 五类：

- **设计** — `moonbit-plan`：需求澄清、架构与 API 决策、模块划分、设计规则
- **骨架生成** — `moonbit-scaffold`：按已批准设计生成项目骨架
- **测试设计** — `moonbit-testing`：测试设计、组织、写法、时机决策
- **验证** — `moonbit-verify`：三级检验门禁（fmt/check/test/audit）
- **CI** — `moonbit-ci`：GitHub Actions、本地 hooks、分支保护

**不做**通用开发流程（实现、任务拆解、代码审查、发布、部署、性能、重构、git 操作、文档、安全、学习、接入初始化）。这些由 **用户、其他流程插件（如 flowstate/fst）或外部编排** 承担。若用户需要实现类能力且未安装流程插件，直接交付设计/骨架/测试/验证契约，交给用户或外部编排执行实现。

## Skill Priority（互斥路由）

When multiple skills match, route by intent:

| 状态 / 意图 | 技能 |
|-------------|------|
| 新项目或未决定架构/API | `moonbit-plan` |
| 设计已批准、生成项目骨架 | `moonbit-scaffold` |
| 测试设计、组织、写法 | `moonbit-testing` |
| 检查质量或完成状态 | `moonbit-verify` |
| CI 配置、GitHub Actions、hooks | `moonbit-ci` |

## Trigger Matrix

> ⚠️ **前置条件**：以下触发词**仅在 MoonBit 项目上下文**（当前目录存在 `moon.mod`
> 或 `*.mbt` 文件，或用户明确提及 MoonBit / moon CLI 命令）时生效。非 MoonBit
> 项目（Python/JS/Rust/其他）中的同名词（build/check/test/git 等）**不得**
> 路由到 moonbit-* 技能——直接回答或按其他插件流程处理。

| User says (English) | User says (中文) | Skill |
|---|---|---|
| "ci", "github actions", "workflow", "continuous integration", "commit-msg" | "CI", "工作流", "持续集成", "commit message" | `moonbit-ci` |
| "build", "create", "new", "I want to make" | "我要做", "写一个", "创建", "开发" | `moonbit-plan` |
| "plan", "design", "architecture" | "设计", "架构", "规划" | `moonbit-plan` |
| "scaffold", "generate", "skeleton" | "骨架", "模板", "生成" | `moonbit-scaffold` |
| "how to test", "write tests", "test organization" | "如何测试", "写测试", "测试组织", "补测试", "测试重构" | `moonbit-testing` |
| "verify", "check", "quality", "audit", "is it ready", "does it pass" | "验证", "检查", "质量", "审计", "是否完成", "是否通过" | `moonbit-verify` |

> **通用流程意图**（实现/拆解/审查/发布/部署/性能/重构/git/文档/安全/学习/接入）触发的
> 同名词**不路由**到 moonbit-* 技能；本插件不承载这些能力，直接交还用户或外部流程插件。

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
- 用户提出通用开发流程需求（实现/部署/发布等）→ 声明本插件不承载该能力，建议用户使用外部流程插件，但可交付设计/骨架/测试/验证契约

## 错误恢复

| 问题 | 诊断 | 修复 |
|------|------|------|
| 路由匹配失败 | 触发词不明确或多义 | 展示候选技能列表，让用户选择 |
| 目标技能文件不存在 | 技能路径错误 | 回退到 `references/` 知识库，标记缺失技能 |
| 技能加载后执行失败 | 技能内部错误 | 报告失败技能和原因，尝试降级方案 |
| 意图识别错误 | 用户说"不是这个意思" | 重新分类，使用修正后的技能 |
| 用户需求超出能力边界 | 需要实现/部署等 | 交付契约，交还用户或外部流程插件 |

## 定位

moonbit-skills 是 **MoonBit 专属**能力插件，**不包含**通用开发流程，也**不内置**自包含的完整开发管线：

- 设计 → 骨架 → 测试设计 → 验证 → CI 由本插件承担。
- **实现**（编码、TDD、提交）等流程由用户或外部流程插件（如 flowstate/fst）执行。
- `moonbit-*` 技能可在任何阶段被外部流程插件调用，与 fst 等插件可协同使用（本插件不与其冲突，也不接管其管线状态）。

## Pipeline (recommended flow)

```
Plan → [Spike (可选)] → Scaffold → [Testing ↔] Verify
                                    ↑            │
                                    └── 设计回溯 ─┘
```

注：Spike 为可选原型验证步骤，在 plan 之后、scaffold 之前。设计回溯可从实现/测试/验证阶段回到 plan 修正设计（本插件不承载实现，回溯触发由外部流程或用户发起）。
Testing 与 Verify 可交叉：测试设计指导验证门禁，验证结果反馈测试补充。

实现类步骤（Implement/Commit/Review/Deploy 等）由外部流程编排，不在此管线内。

Steps can be skipped — the pipeline is recommended, not mandatory. If the project already exists, skip scaffold. If no CI is needed, skip moonbit-ci.

## Available Skills

| Skill | When to Use | 阶段 |
|-------|-------------|---------------------------|
| `moonbit-plan` | Clarify requirements (goal/scenario/customer/boundary/maintenance), design architecture and API; macro design + module breakdown + rule carrying + maintainability | 设计 |
| `moonbit-scaffold` | Generate project skeleton from approved design | 骨架 |
| `moonbit-testing` | Design tests, organize test files, timing decisions (test-first vs post-impl) | 测试设计 |
| `moonbit-verify` | Full quality gate: fmt, check, test, audit | 验证 |
| `moonbit-ci` | CI pipeline, GitHub Actions workflow, local hooks, commit-msg enforcement | 随时可调用 |

## 路由后自检清单

路由到目标技能后，agent 应在执行前自报以下信息，确保 Iron Law 可落地：

- [ ] **目标技能**：已路由到 `moonbit-{skill}`
- [ ] **Iron Law**：已读取并理解该技能的 Iron Law（复述核心约束）
- [ ] **停止条件**：已确认本次任务的停止边界（如用户确认点、能力边界）
- [ ] **验证命令**：已确认本次任务将执行的验证命令（如 `moon test`、`moon fmt --check`）
- [ ] **输出契约**：已确认技能的 JSON 输出格式

未完成自检 → 重新读取目标技能文件，补全理解后再行动。