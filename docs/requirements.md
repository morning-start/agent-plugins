# Requirements: 拆分 moonbit-testing 独立技能

## 项目类型

skill 仓库自身架构演进（非 MoonBit 项目）

## 背景

现有 `moonbit-implement` 同时承担"写测试"和"写实现"两项职责，但测试代码本身需要独立迭代（重构测试、补充边界、调整分类），且"正常测试流程"与"TDD 流程"并不一致。现有设计无法干净表达"补测试""测试重构""非 TDD 流程"等场景。

## 核心问题

1. **测试无法一次性写好**：测试代码需要独立迭代，现有 implement 假设测试一次成型
2. **流程不一致**：TDD（测试先→实现后）与补测试（实现先→测试后）、测试重构（测试独立迭代）共享同一入口，职责混乱
3. **组合空间不足**：用户无法灵活组合 testing ↔ implement，只能走单一 TDD 路径

## 目标

从 `moonbit-implement` 中拆分出 `moonbit-testing` 独立技能，承担测试设计与编写职责，与 implement 形成"设计→实现"契约，保留 TDD 循环完整性。

## 架构决策

### 决策 1：testing 职责边界 = 测试设计与编写

- **职责**：测试策略选择、测试文件组织、命名约定、测试重构与迭代、补测试场景、跨项目类型测试模式
- **不可越权**：不写实现代码；不运行门禁判定（归 verify）；不接管 implement 的 TDD Red 阶段（提供决策，不接管执行）

### 决策 2：implement Iron Law 不变，补充组织契约

- **原 Iron Law**：`NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST`（保留）
- **补充约束**：测试组织决策必须遵循 `moonbit-testing` 契约
- **TDD 循环**：Red-Green-Verify 不变，Red 阶段遵循 testing 决策

### 决策 3：writing-plans 任务结构不变

- 保留 Step 1-5 TDD 循环（任务是行为增量，测试与实现同属一个行为）
- Step 1 写测试时引用 testing 组织决策

### 决策 4：提取 references/testing.md 作为单一权威

- 从 `references/patterns/*.md` 中提取散落的测试内容到 `references/testing.md`
- 各 pattern 的测试章节改为引用 `references/testing.md`

### 决策 5：一次性完成迁移

- 所有同步项一个 PR 完成
- 覆盖：SKILL.md、references、路由表、不变量、README、SVG、evals、关联 skill 微调、patterns 提取

## 三者契约

```
testing（设计）→ implement（实现，TDD 循环不变）→ verify（验证）
```

| 技能 | 职责 | 不可越权 |
|---|---|---|
| `moonbit-testing` | 测试设计、组织、写法、迭代；产出测试代码；覆盖 TDD Red 阶段决策、补测试、测试重构 | 不写实现代码；不运行门禁判定；不接管 implement 的 TDD Red 阶段执行 |
| `moonbit-implement` | 实现编写、调试、修复；产出实现代码；TDD 循环 Red-Green-Verify | 无测试不写实现代码（Iron Law 不变）；测试组织决策遵循 testing 契约 |
| `moonbit-verify` | 全量验证门禁，含 H3 功能完整性（测试运行） | 不写测试；不写实现 |

## 受影响范围

### 核心创建（2 项）

- `skills/testing/SKILL.md`（新建）
- `references/testing.md`（新建，提取自 patterns）

### 路由与不变量（4 项）

- `skills/using-moonbit-skills/SKILL.md`（路由表、Trigger Matrix、Available Skills、Pipeline）
- `AGENTS.md` + `CLAUDE.md`（不变量 9→10，技能职责边界表新增行）
- `GEMINI.md`（检查是否含不变量）
- `references/orchestration.md`（技能全景、独立技能表、依赖关系图）

### 关联 skill 微调（5 项）

- `skills/implement/SKILL.md`（Iron Law 补充约束、引用 testing）
- `skills/writing-plans/SKILL.md`（Step 1 引用 testing）
- `skills/code-review/SKILL.md`（审查清单引用 testing）
- `skills/learn/SKILL.md`（归类表新增 test-pitfall）
- `skills/scaffold/SKILL.md`（生成 test.mbt 时引用 testing）

### patterns 提取（6 项）

- `references/patterns/lib.md`、`cli.md`、`wasm.md`、`ffi.md`、`parser.md`、`performance.md`
- 测试章节改为引用 `references/testing.md`

### 用户文档与资产（2 项）

- `README.md`（9→10，新增 testing 章节，工作流图）
- `assets/readme/*.svg`（hero、section-skills、workflow 重新生成）

### 评估（1 项）

- `evals/evals.json`（新增 testing 评估场景）

### 平台清单（无需修改）

8 个 plugin.json + opencode.json + pi 扩展均不列出具体 skill 名，通过 sessionStart 注入 using-moonbit-skills，无需同步。

## API 表面

### moonbit-testing SKILL.md 结构

- name: moonbit-testing
- description: 触发词 "how to test", "write tests", "test organization", "测试架构", "写测试", "测试组织"
- 职责：测试设计与编写
- Iron Law: NO TEST CODE WITHOUT TEST STRATEGY（测试代码必须有明确策略）
- 停止条件：测试策略未确认；测试无法编写（设计缺陷）
- 各项目类型测试策略表
- 测试文件组织决策树
- 与 implement/verify 的契约

### references/testing.md 结构

- 官方测试机制（`_test.mbt`/`_wbtest.mbt`/内联 test 块）
- 黑盒 vs 白盒测试
- 快照测试（Show/JSON/anything）
- 按项目类型的测试组织
- 测试文件命名约定
- 过滤运行策略
- 决策路径

## 验证

- `python scripts/check-plugin-metadata.py`（插件元数据一致性）
- JSON 文件语法验证（evals.json）
- Markdown 链接和路径检查
- 跨文件事实一致性检查（"9 个"→"10 个"全替换）
- 无占位符检查

## 下一步

进入 `moonbit-writing-plans` 产出 `docs/plans/2026-07-29-testing-skill-split-plan.md`
