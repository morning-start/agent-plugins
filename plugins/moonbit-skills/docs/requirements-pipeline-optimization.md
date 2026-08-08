# Requirements: 管线优化 — 设计回溯 + 性能优化 + 重构循环

## 项目类型

skill 仓库自身架构演进（非 MoonBit 项目）

## 背景

当前管线是"线性+局部双向"：testing↔implement、implement↔code-review、verify→implement 回落已支持，但本质仍是线性推进。现代软件工程的三个关键迭代循环缺失：

1. **设计回溯**：implement 发现 API 不可测/架构错误时，文字写"建议回到 plan"但管线图无回路
2. **性能优化**：[performance.md](../references/patterns/performance.md) 已有基线对比工作流，但管线无入口
3. **重构**：作为 implement 子任务，无法表达"独立技术债务管理"的关注点

## 核心问题

1. **设计回溯无回路**：implement 停止条件提"建议回到 plan"，但这是文字描述不是管线契约，agent 实际不会主动回退
2. **性能优化无入口**：性能是 MoonBit（系统语言）的核心卖点，但管线没有独立性能阶段
3. **重构无独立关注点**：技术债务管理需要"识别→测试保护→小步重构→验证→重复"的独立循环，混在 implement 中容易被"顺手改"

## 目标

1. 契约修改：明确 plan ↔ implement 双向回路（设计回溯）
2. 新增 `moonbit-perform` skill：性能优化的独立迭代循环
3. 新增 `moonbit-refactor` skill：重构的独立迭代循环
4. 更新管线图、路由表、不变量、关联 skill 契约

## 架构决策

### 决策 1：设计回溯 = 契约修改（不新增 skill）

- **判断依据**：设计回溯本质是 plan 和 implement 的双向关系，不是独立活动
- **修改**：plan/SKILL.md 新增"设计回溯"章节；implement/SKILL.md 停止条件升级为"设计回溯触发条件"；orchestration.md 管线图新增回路
- **触发条件**：API 不可测、架构假设错误、依赖不兼容、性能瓶颈是设计问题、技术债务是设计缺陷

### 决策 2：性能优化 = 新增 moonbit-perform skill

- **判断依据**：独立迭代循环（measure→analyze→optimize→re-measure）；MoonBit 系统语言性能是核心卖点；功能正确≠性能达标
- **Iron Law**：`NO OPTIMIZATION WITHOUT MEASUREMENT`
- **循环**：measure（建立基线）→ analyze（定位瓶颈）→ optimize（改进实现）→ re-measure（对比验证）
- **与 implement 边界**：perform 不改变功能行为，只改变性能特性
- **与 verify 边界**：perform 产出的优化需通过 verify 确认无回归；verify S3 提供粗粒度性能信号
- **消费**：references/patterns/performance.md

### 决策 3：重构 = 新增 moonbit-refactor skill

- **判断依据**：独立迭代循环（identify→ensure tests→refactor→verify→repeat）；技术债务管理是独立关注点；与 TDD 微重构不同
- **Iron Law**：`NO REFACTORING WITHOUT GREEN TESTS`
- **循环**：identify（识别坏味）→ ensure tests（确认测试覆盖）→ refactor（小步重构）→ verify（回归验证）→ repeat
- **与 implement 边界**：refactor 不改变可观察行为，只改善内部结构
- **与 testing 边界**：refactor 前确认测试覆盖充分，testing 提供安全网
- **与 verify 边界**：refactor 产出的变更需通过 verify 确认无回归

## 优化后的管线

```
                            ┌──── 设计回溯 ────┐
                            ↓                   │
plan ↔ writing-plans → scaffold → [testing ↔] implement ↔ code-review → [perform ↔] → [refactor ↔] → verify → evaluate
                            ↑                                                      │
                            └──────────────── 设计回溯 ────────────────────────────┘
```

三个循环共同特征：
1. 都不改变可观察行为（perform 改变性能特性，refactor 改善内部结构，设计回溯重新设计）
2. 都有独立停止条件
3. 都依赖测试保护
4. 都可触发设计回溯（发现根本问题是设计缺陷时回到 plan）

## 三者契约

| 技能 | 职责 | Iron Law | 不可越权 |
|---|---|---|---|
| `moonbit-plan`（修改） | 需求澄清、设计决策、**设计回溯** | NO CODE WITHOUT APPROVED DESIGN | — |
| `moonbit-implement`（修改） | TDD 实现、调试、修复 | NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST | 设计回溯触发时回到 plan |
| `moonbit-perform`（新增） | 性能测量、瓶颈分析、优化实现 | NO OPTIMIZATION WITHOUT MEASUREMENT | 不改变功能行为；不替代 verify 门禁 |
| `moonbit-refactor`（新增） | 技术债务识别、小步重构、回归验证 | NO REFACTORING WITHOUT GREEN TESTS | 不改变可观察行为；不替代 testing 测试设计 |
| `moonbit-verify`（不变） | 全量验证门禁 | NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE | — |

## 受影响范围

### 核心创建（2 项）

- `skills/perform/SKILL.md`（新建）
- `skills/refactor/SKILL.md`（新建）

### 契约修改（4 项）

- `skills/plan/SKILL.md`（新增"设计回溯"章节）
- `skills/implement/SKILL.md`（停止条件升级为设计回溯触发条件）
- `references/orchestration.md`（管线图新增回路、技能全景、依赖关系图）
- `skills/using-moonbit-skills/SKILL.md`（路由表、Trigger Matrix、Available Skills、Pipeline）

### 关联 skill 微调（4 项）

- `skills/code-review/SKILL.md`（审查清单新增 perform/refactor 产出审查）
- `skills/verify/SKILL.md`（S3 性能基线引用 perform，回落链新增 perform/refactor）
- `skills/learn/SKILL.md`（归类表新增 perf-pitfall、refactor-pitfall）
- `skills/writing-plans/SKILL.md`（任务结构引用 perform/refactor 可选阶段）

### 不变量与用户文档（3 项）

- `AGENTS.md` + `CLAUDE.md`（不变量 10→12，技能职责边界表新增 2 行）
- `GEMINI.md`（检查同步）
- `README.md`（10→12，新增 perform/refactor 章节，工作流图）

### 资产与评估（2 项）

- `assets/readme/*.svg`（hero、section-skills、workflow 重新生成）
- `evals/evals.json`（新增 perform/refactor/设计回溯评估场景）

### 平台清单（无需修改）

8 个 plugin.json + opencode.json + pi 扩展均不列出具体 skill 名，通过 sessionStart 注入 using-moonbit-skills，无需同步。

## API 表面

### moonbit-perform SKILL.md 结构

- name: moonbit-perform
- description: 触发词 "optimize performance", "benchmark", "性能优化", "性能瓶颈", "测量"
- Iron Law: NO OPTIMIZATION WITHOUT MEASUREMENT
- 循环: measure → analyze → optimize → re-measure
- 停止条件: 性能目标达成；优化无收益；需架构变更（回到 plan）
- 各项目类型性能关注点
- 与 implement/verify 的契约
- 引用 references/patterns/performance.md

### moonbit-refactor SKILL.md 结构

- name: moonbit-refactor
- description: 触发词 "refactor", "技术债务", "code smell", "重构", "坏味"
- Iron Law: NO REFACTORING WITHOUT GREEN TESTS
- 循环: identify → ensure tests → refactor → verify → repeat
- 停止条件: 技术债务清零；重构无收益；需设计变更（回到 plan）
- 重构类型分类（命名、提取、简化、搬迁）
- 与 implement/testing/verify 的契约

## 验证

- `python scripts/check-plugin-metadata.py`（插件元数据一致性）
- JSON 文件语法验证（evals.json）
- 跨文件事实一致性检查（"10 个"→"12 个"全替换）
- Markdown 链接和路径检查
- 无占位符检查
- 设计回溯回路契约完整性检查

## 下一步

进入 `moonbit-writing-plans` 产出 `.agent-workplace/docs/plan/PLAN.md`
