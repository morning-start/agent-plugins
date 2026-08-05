# Pipeline Gap Analysis

- **日期**: 2026-07-29
- **背景**: 在完成 testing 拆分、perform/refactor 新增和设计回溯回路引入后，对当前管线进行回顾性分析，识别现代软件开发中天然需要迭代但尚未建模的环节。
- **当前管线**: `plan ↔ writing-plans → scaffold → [testing ↔] implement ↔ code-review → [perform ↔] → [refactor ↔] → verify → evaluate`

---

## Gap 1: Bug 生命周期 — 最大的实操缺口

### 问题

Bug 修复不是"再实现一次"。它有独特的流程结构，目前被模糊地归入 `moonbit-implement`，但管线层面完全不可见。

### 理想的 Bug 修复流程

```
Bug 来源 (用户报告 / 测试发现 / 审查发现 / 运行时异常)
    │
    ├── 1. 复现: 先写 regression test 证实 bug 存在
    ├── 2. 诊断: 定位根因（文件、函数、错误码）
    ├── 3. 修复: 最小改动
    ├── 4. 验证: regression test 通过 + 全部现有测试仍绿
    └── 5. 吸收: → moonbit-learn (自动触发，记录根因)
```

### 当前管线的问题

- Bug 的入口是**多源的**（用户、测试、审查、运行时），从不同位置进入管线，但没有任何一个入口被显式建模
- implement 的"快速任务模式"表中有一条 Bug Fix 流程，但它和功能 TDD 共用同一套 Iron Law 和停止条件
- Bug 修复后应该**自动触发** `moonbit-learn`，当前 learn 只在 3 次修复失败后触发
- "复现"步骤需要一个独立的 regression test，这可能先调用 testing 技能

### 建议方案

**选项 A：为 implement 增加显式 Bug Fix Mode**
在 implement 内部分为两种模式：Feature Mode（现有 TDD）和 Bug Fix Mode（reproduce → diagnose → fix → verify → learn）。管线图不变，但 implement SKILL.md 内部流程修改。

**选项 B：新增独立入口**
在 using-moonbit-skills 的路由表中增加 Bug Report 路由，直接将 Bug 映射到 implement 的 Bug Fix Mode。

**选项 C：新增 `moonbit-bugfix` 技能**
将 Bug 生命周期独立为技能，与 implement 平级。成本最高，但职责最清晰。

---

## Gap 2: 文档管理 — 结构性缺失

### 问题

当前管线中**完全没有**文档相关的职责、门禁或约束。但现代软件开发中，文档随代码持续演化，不是"写一次"的东西。

### 涉及的文档类型

| 文档类型 | 触发时机 | 当前状况 |
|---------|--------|---------|
| API 文档（docstrings、moon info 输出） | 每次 pub API 新增/修改时 | 完全无约束 |
| README / 用户手册 | 新功能、CLI 接口变更、发布前 | evaluate 仅对 lib 生成 README，但不保证与当前代码同步 |
| 内部设计文档（ADR、架构决策） | 设计回溯后、重构后 | plan 产出的设计文档在管线后续从不更新 |
| 变更日志 / 发布说明 | 每次 evaluate 前 | 不存在 |

### 问题链

1. implement 改了 pub API → API 文档未更新 → 用户看到过期文档
2. refactor 重命名了内部模块 → 设计文档未同步 → 新人不理解结构
3. evaluate 生成 README 时用了静态模板 → 文档和实际行为不匹配
4. 没有文档审查门禁 → 文档质量不可控

### 建议方案

**选项 A：给每个技能增加"文档同步"契约约束**
不新增技能，而是在 implement/refactor/perform 的"下一步"或"门禁"中增加文档检查：当 pub API 变更时，必须同步更新 docstring 和相关文档。

**选项 B：新增 `moonbit-document` 技能**
独立技能负责文档生成、审查和同步。在 implement/refactor 之后、verify 之前调用。

---

## Gap 3: Code Review 多轮迭代 — 过程不够真实

### 问题

当前 code-review 是每任务后的**单次**审查：审查通过就继续，不通过就修改然后继续。但现实中代码审查是**多轮交互**：

```
提交 → 审查 → 反馈 → 修改 → 重新审查 → 批准（可能循环 2-3 轮）
```

### 当前管线的问题

- 修改后没有"自动回到 code-review"的回路
- 审查反馈可能涉及多个轮次，当前模型无法表示"第 2 轮审查"和"第 1 轮审查"的区别
- 审查发现的设计问题已经可以回到 plan，但审查发现的测试缺失、实现质量问题没有对应的回路

### 建议方案

**选项 A：给 code-review 增加多轮循环契约**
修改 code-review SKILL.md：
- 输出增加 `review_round` 字段
- 如果审查有 Critical/Important 问题未被修复，则标记 `needs_revision`，管线自动回到 implement
- 修复后再次自动触发 code-review（同一技能实例，接管上下文）
- 当所有问题被解决或用户显式接受已知问题后，标记 `approved`

**选项 B：管线图中增加 code-review 自循环箭头**
```
implement → code-review → implement（若未批准）→ code-review（下一轮）
```

---

## Gap 4: 原型 / Spike 探索路径 — Iron Law 的盲区

### 问题

当前 implement 的 Iron Law 非常严格：**NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST**，"exploration code must be thrown away"。这是正确的 TDD 纪律，但缺少一个**合法性探索**的安全阀。

### 何时需要 Spike

- **API 可用性验证**：不确定 API 设计是否好用，想快速写一段消费代码试试
- **技术可行性验证**：不确定 FFI/WASM 边界能否工作
- **性能假设验证**：不确定某算法的性能表现，想快速基准测试
- **依赖评估**：不确定第三方库是否满足需求

### 当前管线的矛盾

> "I need to explore first" → "Fine. Throw away exploration, start with TDD."

这没有给探索留下合法空间。开发者要么跳过探索直接做 TDD（可能走错方向），要么偷偷把探索代码"留着做参考"（破坏 Iron Law）。

### 建议方案

**选项 A：在 plan 之后、implement 之前增加可选 Spike 步骤**
```
plan → [spike (可选)] → writing-plans → scaffold → implement ...
```
Spike 的契约：
- 写探索代码，验证关键假设
- **验证完成即丢弃所有 Spike 代码**
- 产出物是"经验"（记录到 writing-plans 的任务拆解中），而非代码
- 不能进入版本控制、不能成为生产代码

**选项 B：在 plan 中增加原型验证阶段**
plan 产出设计后，增加一个"原型验证"阶段——用最快的路径验证设计假设，验证后丢弃原型，再进入完整管线。

---

## Gap 5: 依赖管理迭代 — 无流程

### 问题

添加或更新依赖是一个**迭代过程**，涉及兼容性检查、测试调整和安全审查，但当前完全无建模。

### 典型流程

```
moon add <pkg>
    → 编译（依赖解析、版本兼容性）
    → 类型检查（API 是否匹配）
    → 测试（行为是否改变）
    → 安全审计（是否有已知漏洞）
    └─任何步骤失败 → 调整依赖版本或代码结构 → 重新循环
```

### 影响面

- 依赖版本更新可能触发连锁重构（上游 breaking change）
- 依赖可能引入安全漏洞（需要定期审计）
- 跨平台依赖（native/wasm-gc/JavaScript）可能有不同的支持度
- 当前 `moon-audit` 已出现在 verify 的 S2 软性检查中，但"更新依赖→重新审计"的循环未建模

### 建议方案

在 implement 或 verify 中增加依赖管理契约：当涉及 `moon add` / `moon remove` / `moon update` 时，必须执行完整的依赖迭代流程（编译 → 类型检查 → 测试 → 安全审查），并将检查结果与用户确认。

---

## Gap 6: CI/CD 反馈回路 — 管线止步于本地

### 问题

当前管线假定所有工作在**同一 session** 内完成。但现实往往不是这样：

```
本地通过 (verify/evaluate)
    → push / PR
    → CI 失败 (跨平台、边缘情况、集成测试、lint)
    → 回到 implement / plan 修复
    → 重新 push
    → ...
```

### 回滚 / Hotfix 流程也未被建模

```
发布后
    → 用户报告 bug
    → hotfix 分支
    → 修复 → 验证 → 重新发布
    → 回溯到主分支
```

### 影响面

- 跨平台兼容问题（`moon check --target all`）可能在本地遗漏，CI 上才暴露
- 集成测试依赖外部资源（数据库、网络），本地无法完整模拟
- 多 session 工作没有进度保持机制——当前管线的 JSON 进度状态是静态示例，没有持久化和恢复能力

### 建议方案

**选项 A：在管线中增加 CI 门禁反查**
在 verify 或 evaluate 中，当检测到 CI 配置文件存在时，提醒用户 CI 可能发现本地遗漏的问题。但本质上 CI 反馈是离线事件，Agent 无法实时接收。

**选项 B：CI 故障时的重新进入方式**
明确说明 CI 失败后的重新进入点：CI 失败日志 → 人工判断 → 回到 `moonbit-implement` 或 `moonbit-plan`。

---

## 优先级评估总表

| # | 缺口 | 影响频率 | 修复成本 | 建议优先级 |
|---|------|---------|---------|-----------|
| 1 | Bug 生命周期 | 每天 | 中 (~3 文件) | P0 — 日常必遇 |
| 2 | 文档管理 | 每个项目 | 中 (~4 文件) | P0 — 质量门禁 |
| 3 | Code Review 多轮 | 每次审查 | 低 (~2 文件) | P1 — 流程完善 |
| 4 | Spike 探索路径 | 设计决策时 | 中 (~3 文件) | P1 — 流程弹性 |
| 5 | 依赖管理 | 每次加依赖 | 低 (~1 文件) | P2 — 约束补充 |
| 6 | CI/CD 反馈回路 | 发布后 | 低 (~1 文件) | P2 — 边界建模 |

## 实施路线图

分 3 批实施，每批一个独立 PR，避免改动叠加难以审查。

```
Batch 1 — P0（质量门禁，刚需）
  ├── Gap 1: Bug 生命周期
  └── Gap 2: 文档管理
  预计 10-15 个任务

Batch 2 — P1（流程完善）
  ├── Gap 3: Code Review 多轮
  └── Gap 4: Spike 探索路径
  预计 6-10 个任务

Batch 3 — P2（边界建模）
  ├── Gap 5: 依赖管理
  └── Gap 6: CI/CD 反馈回路
  预计 3-5 个任务
```

### 分批原则

- **不跨批叠加同一文件**：如果两个 Gap 要改同一个文件，尽量排在不同的批，或明确先后顺序
- **每批结束后给使用间隔**：批与批之间有实操反馈周期，第二批可以吸收第一批的经验
- **每批独立走完整管线**：plan → writing-plans → implement + code-review + verify，按本项目自己的规则执行

### 决策依据

| 因素 | 倾向分批 | 不倾向逐个单做 | 不倾向一口气全做 |
|------|---------|--------------|----------------|
| 验证成本 | 每批一次全量验证 | 每次都要全量，重复 | 验证检查项过多 |
| 文件冲突 | 可安排不重叠 | 无优势 | 多技能改同一文件难审 |
| 反馈吸收 | 下一批可吸收经验 | 无优势 | 来不及调整 |
| 确认开销 | 每批一次方向确认 | 每个 Gap 重复确认 | 方案太大难一次性批准 |
