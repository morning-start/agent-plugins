# plugin-factory 技能优化分析报告

> 生成日期：2026-08-02
> 当前版本：0.1.0
> 覆盖范围：7 个核心技能 + 跨技能优化

---

## 目录

1. [pf-intent — 意图澄清](#1-pf-intent--意图澄清)
2. [pf-design — 插件设计](#2-pf-design--插件设计)
3. [pf-build — 插件构建](#3-pf-build--插件构建)
4. [pf-verify — 验证审计](#4-pf-verify--验证审计)
5. [pf-lifecycle — 生命周期分析](#5-pf-lifecycle--生命周期分析)
6. [pf-git — Git 工程](#6-pf-git--git-工程)
7. [using-pf — 统一入口编排](#7-using-pf--统一入口编排)
8. [跨技能优化](#8-跨技能优化)
9. [路线图与优先级](#9-路线图与优先级)

---

## 1. pf-intent — 意图澄清

### 当前状态

8 道面试题 + 复杂度门禁 + PRD 模板 + 签收门禁。结构完整，但所有流程都是手工程序，无结构化输出校验。

### 优化点

| ID | 严重度 | 问题 | 优化方向 | 工作量 |
|----|--------|------|----------|--------|
| INT-1 | **P0** | 无 PRD schema 校验 | 创建 `references/schemas/prd.schema.json`，pf-intent 产出 PRD 后自动校验结构完整性（必填字段、字段类型、值枚举） | 小 |
| INT-2 | **P0** | 复杂度门禁是手动计分 | 抽象为 `scoreComplexity()` 函数，接受技能数/hooks/多 harness 等参数，自动计算 score 并输出 verdict；移除询问中的手动计算 | 中 |
| INT-3 | **P1** | 面试缺乏自适应追问 | 基于前一个回答动态选择下一题，而非固定顺序。例如用户说"只做 Claude Code" → 跳过其他 harness 问题 | 中 |
| INT-4 | **P1** | Change mode 无固定模板 | 创建 "Change PRD delta" 模板（`docs/templates/change-prd-delta.md`），替代 S2-S8 场景的 8 题全跑流程 | 小 |
| INT-5 | **P2** | 无会话状态持久化 | 面试过程中记录 `intent-state.json`，支持断点续接；下次会话可恢复上次的面试进度 | 大 |

### 来源

- 内部审计：INT-1, INT-2, INT-4
- 行业实践：自适应追问（adaptive questioning）来自[Agent Skills 设计模式](https://docs.anthropic.com/en/docs/agents-and-tools/claude-code/overview)
- 用户反馈：会话中断后需重新面试（INT-5）

---

## 2. pf-design — 插件设计

### 当前状态

PRD → component manifest 分解，含编排设计、ADR。架构完整但偏重文档驱动，缺少自动化工具。

### 优化点

| ID | 严重度 | 问题 | 优化方向 | 工作量 |
|----|--------|------|----------|--------|
| DES-1 | **P0** | 无 component-manifest schema 校验 | 创建 `references/schemas/component-manifest.schema.json`，产出 manifest 后自动校验所有字段 | 小 |
| DES-2 | **P0** | 技能分解全手动，无自动化 | 引入 PRD-to-component mapper：自动扫描 PRD features → 推荐技能列表 + 边界分析 + 建议触发词 | 大 |
| DES-3 | **P1** | "Skills name actions, not tools" 无强制 | 生成 `references/<harness>-tools.md` 时自动检查 skill body 中是否引用了具体工具名；如有则发出 WARN | 中 |
| DES-4 | **P1** | 设计审核清单是手写的 | 基于 manifest schema 自动生成审核 checklist，用户逐项确认 | 小 |
| DES-5 | **P2** | 编排设计缺冲突检测 | 自动检测 trigger domain 重叠（当前靠人工在 `orchestration.conflicts` 声明），使用 Jaccard 相似度 | 中 |

### 来源

- 内部审计：DES-1, DES-3, DES-4
- 行业实践：架构设计中的 schema-driven validation 来自[生产级 AI Agent 架构模式](https://firecrawl.dev/blog/ai-agent-architecture-patterns)
- verify.mjs 已实现的 trigger-overlap 探针可复用（DES-5）

---

## 3. pf-build — 插件构建

### 当前状态

Scaffold engine + skill-creator TDD loop + 多 harness 渲染。项目中最完善的技能之一。已通过 dogfood 测试。

### 优化点

| ID | 严重度 | 问题 | 优化方向 | 工作量 |
|----|--------|------|----------|--------|
| BLD-1 | **P0** | skill-creator 可用性检查是手动的 | 实现 `checkCreator()` 函数：自动检测全局路径（`~/.pi/agent/skills/skill-creator`）和项目 local 路径（`.agents/skills/skill-creator`），返回可用状态 | 中 |
| BLD-2 | **P0** | 生成项目后不自动运行 verifier | scaffold 完成后自动执行 `npm run validate`，通过 `--auto-verify` flag 控制；失败时提示用户而非静默 | 小 |
| BLD-3 | **P1** | scaffold 失败无回滚 | 实现 `scaffoldPlugin()` 的事务性写入：先写入临时目录，全部成功后 rename 到目标路径；失败则 rm -rf | 中 |
| BLD-4 | **P1** | 语言策略执行靠人工检查 | 生成后自动检查所有文件的语言层归属：`references/`、`docs/`、`README.*.md` 应为 `user_lang`，其余为 `agent_lang` | 中 |
| BLD-5 | **P2** | 生成项目缺少 MCP 服务器模板 | 为需要外部 API 的插件模板增加 MCP 服务器桩（`mcp-servers/` 目录 + 示例 tool 实现） | 大 |

### 来源

- 内部审计：BLD-1, BLD-2, BLD-3
- 行业实践：MCP 服务器模板来自[Model Context Protocol 规范](https://modelcontextprotocol.io/)
- 用户反馈：scaffold 失败后残留目录（BLD-3）

---

## 4. pf-verify — 验证审计

### 当前状态

三层引擎（structure / harness / orchestration），多 shell wrapper，dogfood 测试（T5）。项目中最完善的技能之一。

### 发现的问题

**章节编号错误**：SKILL.md 中 sections 编号跳跃（5 → 7 → 8 → 7），缺少 section 6。

### 优化点

| ID | 严重度 | 问题 | 优化方向 | 工作量 |
|----|--------|------|----------|--------|
| VFY-1 | **P0** | 章节编号跳跃 | 重编号：5 → 6. Test coverage, 7. Docs & packaging, 8. Report | 小 |
| VFY-2 | **P1** | 测试覆盖检查固定为 WARN | 支持 `--coverage=FAIL` 参数，项目可配置测试覆盖为阻塞级 | 小 |
| VFY-3 | **P1** | 无外部安全扫描集成 | 增加 `--security` 开关：运行 `npm audit` 和基本依赖安全性检查 | 中 |
| VFY-4 | **P2** | 无性能基准线 | 增加 `--benchmark` 模式：测量 verify.mjs 各阶段执行时间，输出基线报告 | 小 |
| VFY-5 | **P2** | 报告格式单一 | 支持 `--format markdown` 输出，可直接贴入 PR 评论和 CI 输出 | 中 |

### 来源

- 内部审计：VFY-1, VFY-2, VFY-5
- 行业实践：CI 集成中的安全扫描来自[生产级 Agent 验证](https://docs.anthropic.com/en/docs/agents-and-tools/claude-code/overview)

---

## 5. pf-lifecycle — 生命周期分析

### 当前状态

12 个可执行探针，严重度排序，决策矩阵。纯结构分析，无运行时数据。

### 优化点

| ID | 严重度 | 问题 | 优化方向 | 工作量 |
|----|--------|------|----------|--------|
| LIF-1 | **P0** | v1 未来信号是空承诺 | 补充具体 v2 roadmap：触发频率探针、eval 通过率、用户反馈主题聚类、安装数统计 | 中 |
| LIF-2 | **P0** | 无自动生命周期报告 | 实现 `npm run lifecycle:report` 生成 markdown 报告（含信号分布、趋势、建议） | 中 |
| LIF-3 | **P1** | 无 TTL 规则 | 对 `deprecated` 状态的技能设置 TTL（如 90 天后自动从 WARN 升级为 FAIL），配置在 `lifecycle-matrix.md` 中 | 小 |
| LIF-4 | **P1** | 建议执行全靠人 | 输出 `lifecycle-actions.json`（机器可读），供 `pf-analyze` 自动路由到 pf-design/pf-build/pf-verify | 小 |
| LIF-5 | **P2** | 缺跨技能依赖分析 | 当技能 A 引用技能 B 时，B 的退役/弃用应产生 WARN 给 A；需解析 handoff 和 chain 引用 | 大 |

### 来源

- 内部审计：LIF-1, LIF-2, LIF-4
- 行业实践：TTL 规则来自[Agent Skill 生命周期管理](https://medium.com/enterprise-genai/agent-skill-lifecycle-management)（retain/retire/expand 策略）
- 用户反馈：每次跑 `lifecycle` 都要手动看表格（LIF-2）

---

## 6. pf-git — Git 工程

### 当前状态

Feature branch + worktree + Conventional Commits + version management。全面但偏被动——用户必须主动触发。

### 优化点

| ID | 严重度 | 问题 | 优化方向 | 工作量 |
|----|--------|------|----------|--------|
| GIT-1 | **P0** | 无合并冲突指导 | 增加 merge conflict resolution 章节：`git mergetool`、三方合并策略、冲突标记解析 | 小 |
| GIT-2 | **P1** | 无 git hooks 指导 | 增加 `hooks/` 章节：commit-msg hook（Conventional Commit 格式校验）、pre-commit hook（lint/structure check） | 中 |
| GIT-3 | **P1** | 版本管理是被动式的 | 实现 `suggestVersion()` 自动分析 git log → 提出版本建议（复用 `scripts/version.mjs`） | 中 |
| GIT-4 | **P2** | 无大文件/二进制指导 | 增加 git LFS 章节：何时使用 LFS、如何配置、与 plugin manifest 的兼容性 | 小 |

### 来源

- 内部审计：GIT-1, GIT-2, GIT-4
- 行业实践：自动版本建议来自 Conventional Commits 标准工具链（如 `semantic-release`）
- 用户反馈：合并冲突时无指导（GIT-1）

---

## 7. using-pf — 统一入口编排

### 当前状态

触发矩阵（10 场景 S1-S10） + red flags + 错误恢复 + 自检清单。路由清晰，但全靠人工判断。

### 优化点

| ID | 严重度 | 问题 | 优化方向 | 工作量 |
|----|--------|------|----------|--------|
| ENT-1 | **P0** | 路由全是手动判断 | 增加 `routeIntent()` 辅助函数：输入自然语言 → 匹配 skill 优先级表 → 输出目标场景 + routing 证据 | 中 |
| ENT-2 | **P1** | "No scenario matches" 是死胡同 | 增加 fallback 操作：自动创建 GitHub issue 模板（`docs/templates/scenario-request.md`），引导用户提交新场景 | 小 |
| ENT-3 | **P1** | 自检清单是手写的 | 改为 JSON schema 驱动：`references/schemas/routing-self-check.schema.json`，输出后自动校验 | 小 |
| ENT-4 | **P2** | 场景 ID（S1-S10）与代码脱节 | 创建 `docs/scenarios/` 目录，每个场景一个 `S1.md` 等，含场景描述 + 入口条件 + 产出物 | 中 |

### 来源

- 内部审计：ENT-1, ENT-3, ENT-4
- 行业实践：Orchestrator skill 模式来自[AI Agent 编排模式](https://firecrawl.dev/blog/ai-agent-architecture-patterns)（Coordinator pattern）

---

## 8. 跨技能优化

| ID | 优化 | 涉及技能 | 严重度 | 工作量 | 说明 |
|----|------|----------|--------|--------|------|
| X-1 | **Schema 契约**：创建 `prd.schema.json`、`component-manifest.schema.json`、`audit-report.schema.json` | pf-intent, pf-design, pf-verify | **P0** | 小 | 每个交接产物有正式 schema，产出时自动校验 |
| X-2 | **Eval 集成**：每个 skill 的 eval 结果自动记录到 `evals/` | pf-build, pf-verify | P1 | 中 | 当前 `evals/` 目录存在但未集成到 workflow |
| X-3 | **MCP 化**：关键的 verify.mjs 引擎暴露为 MCP 工具 | pf-verify, pf-lifecycle | P2 | 大 | 允许其他工具/agent 调用 verify 能力 |
| X-4 | **i18n 文档同步**：英文版优化报告同步更新 | 全技能 | P2 | 中 | 当前所有文档为中文，缺英文版 |

---

## 9. 路线图与优先级

### P0 — 当前迭代（高影响，低工作量）

| 顺序 | ID | 描述 | 预计时间 |
|------|----|------|----------|
| 1 | VFY-1 | pf-verify 章节编号修复 | 5 min |
| 2 | INT-1, DES-1, X-1 | Schema 契约（3 个 schema 文件） | 30 min |
| 3 | INT-2 | 复杂度门禁自动化 | 1 h |
| 4 | INT-4 | Change mode 模板 | 20 min |
| 5 | ENT-1 | 路由辅助函数 | 1 h |

### P1 — 下个迭代

| 顺序 | ID | 描述 | 预计时间 |
|------|----|------|----------|
| 6 | DES-3 | 工具名引用检查 | 1 h |
| 7 | BLD-1 | skill-creator 可用性检查 | 30 min |
| 8 | BLD-2 | 自动 verify 生成项目 | 20 min |
| 9 | LIF-1 | v2 roadmap 补充 | 20 min |
| 10 | LIF-2 | lifecycle 报告生成 | 1 h |
| 11 | GIT-2 | git hooks 指导 | 30 min |
| 12 | VFY-2 | 可配置测试覆盖阈值 | 20 min |
| 13 | ENT-2 | fallback 模板 | 15 min |
| 14 | X-2 | Eval 集成 | 1.5 h |

### P2 — 未来

| 顺序 | ID | 描述 | 预计时间 |
|------|----|------|----------|
| 15 | DES-5 | 自动冲突检测 | 1.5 h |
| 16 | BLD-5 | MCP 模板 | 2 h |
| 17 | LIF-5 | 跨技能依赖分析 | 3 h |
| 18 | X-3 | MCP 化 verify.mjs | 4 h |

---

## 附录 A：引用来源

- [Claude Code Agent Skills 规范](https://docs.anthropic.com/en/docs/agents-and-tools/claude-code/overview) — SKILL.md 标准、CSO 格式
- [Agent Skill 生命周期管理](https://medium.com/enterprise-genai/agent-skill-lifecycle-management) — retain/retire/expand 策略、SemVer
- [AI Agent 架构模式](https://firecrawl.dev/blog/ai-agent-architecture-patterns) — 编排模式、插件架构
- [生产级 Agent 开发](https://sap.com/ai-agent-production) — 验证/安全/可观测性
- [Model Context Protocol](https://modelcontextprotocol.io/) — MCP 服务器规范
- [Evaluation-Driven Development](https://github.com/anthropics/skills) — skill-creator 的 TDD 循环

## 附录 B：技能依赖图

```
using-pf ──→ pf-intent ──→ pf-design ──→ pf-build ──→ pf-verify ──→ pf-git ──→ /pf-release
                │              │                            │
                └── 轻量 ──────┘                            │
                                                            │
                                                    pf-lifecycle ──→ pf-analyze
                                                            │
                                                            └──→ pf-design/pf-build/pf-verify
```

## 附录 C：术语表

| 术语 | 英文 | 定义 |
|------|------|------|
| CSO | Condition-Situation-Outcome | 技能描述格式：纯触发条件，无 workflow/outcome/guidance |
| TDD | Test-Driven Development | 测试驱动开发：Red → Green → Refactor 循环 |
| PRD | Product Requirements Document | 产品需求文档，plugin-factory 的核心交接产物 |
| Component Manifest | 构件清单 | 技能/hooks/commands 的完整清单，pf-design 的产出 |
| Iron Law | 铁律 | 不可违反的设计原则，见 `references/design-principles.md` |
| harness | 适配层 | AI agent 平台（Claude Code / pi / opencode / oh-my-pi） |
| skill-creator | 技能创作器 | Anthropic 提供的技能创作工具，plugin-factory 委托其创作技能 |
| MCP | Model Context Protocol | 模型上下文协议，标准化的工具/资源暴露协议 |
| Schema Contract | Schema 契约 | 正式化的 JSON Schema，用于自动校验交接产物 |