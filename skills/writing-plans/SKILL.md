---
name: moonbit-writing-plans
description: "Use when transitioning from design to implementation — after moonbit-plan completes and the architecture/API are decided, but before moonbit-implement starts. Breaks the design into bite-sized implementation tasks."
---

# Writing Plans — MoonBit 实现计划

## 职责

将设计文档拆解为可执行的实现任务列表。**每个任务代表一个行为增量，可独立审查、可验证。规划分阶段、分步骤、可实现。**

**核心原则：** 假设执行者对你代码库零上下文、品味堪忧。文档写清楚每一步。

## The Iron Law

```
NO IMPLEMENTATION WITHOUT A WRITTEN PLAN FIRST
```

设计完成后直接跳进实现？**停下来。先写计划。**

### 可机械化自检

- [ ] 已生成 `docs/plans/YYYY-MM-DD-{feature}-plan.md` 计划文件
- [ ] 任务按 **Phase（阶段）** 分组：每个 Phase 对应一个模块，有明确的阶段目标和交付物
- [ ] 每个任务含明确的文件操作（Create/Modify/Test）和接口签名
- [ ] 每个任务含验证命令（如 `moon test -f "test_name"`）
- [ ] 每个任务聚焦**单个功能点**，目标过大已拆分（单任务不跨多个模块）
- [ ] 计划文件中无占位符（搜索 `TODO`、`TBD`、`参照`、`类似上面`）

未满足以上任一 → Iron Law 触发：停止，先完善计划。

## Red Flags — STOP and Re-evaluate

If you catch yourself doing any of these, you are violating the writing-plans contract:

- 任务中用占位符代替实际代码（"TODO: 实现解析逻辑"）
- 任务粒度过大（"实现整个解析器"）
- 用"参照 task 2"代替具体接口签名
- 跳过验证步骤（"这个任务不需要测试"）
- 不标注文件操作类型（Create/Modify/Test）

**All of these mean: Stop. Make each task independently verifiable.**

## 停止条件

- 设计文档（plan 输出）未确认 → 等待 plan 完成
- 任务拆解后用户认为粒度不合适 → 调整后重新输出
- 需求中存在无法拆解的模糊点 → 标记为 blocked，请求澄清
- 计划文档保存失败（目录不存在）→ 创建 `docs/plans/` 目录，重试

## 输入

从 `moonbit-plan` 输出获取：
- `project_type` — lib/cli/ffi/wasm/parser/async
- `architecture` — 架构模式
- `api_surface` — API 签名列表

如果 plan 阶段执行了 Spike 原型验证，还将 Spike 的经验纳入：
- 可行性结论（假设成立/不成立/部分成立）
- 关键发现（边界条件、性能特征、兼容性）
- Spike 经验直接转化为 task 拆解中的验证重点
- 需求文档（`docs/requirements.md`）

## 执行流程

### 1. 文件结构规划

列出将要创建或修改的所有文件，以及每个文件的职责：

```
src/
├── lib.mbt          # 公共 API 入口
├── tokenize.mbt     # Tokenizer 实现
├── parser.mbt       # 解析器
└── lib_test.mbt     # 测试
```

### 2. 任务拆解

先按**模块 → Phase → Task** 三层组织，每个任务以 **TDD 循环**或变更类型验证为粒度。见 `moonbit-implement` 的变更类型路由表。

#### Phase（阶段）定义

- 每个 **Phase 对应一个模块**（来自 plan 的模块划分），有明确的阶段目标和交付物
- Phase 内任务按依赖拓扑排序；Phase 之间按模块依赖方向排序
- 每个 Phase 结束时模块可独立验证（该模块的测试全绿）
- 单个 Task 聚焦**单个功能点**：一个函数、一个类型、一个行为；目标过大 → 继续拆分

#### 维护 Phase（长期维护规划）

规划不止到"实现完成"，还要考虑**实现之后怎么维护**。若 plan 的「长期维护规划」有明确内容（升级兼容策略、持续维护机制），在实现 Phase 之后追加一个**维护 Phase**：

```markdown
## Phase N: maintenance（长期维护准备）
阶段目标：让项目可长期维护
依赖：全部实现 Phase
- Task N.1: 公共 API 稳定性基线（SemVer 承诺 + pkg.generated.mbti 基线）
- Task N.2: 维护文档（README 维护章节 / ADR / 升级指南）
- Task N.3: CI 持续维护（自动测试/依赖审计/文档示例验证）
```

- 维护 Phase 是**可选**的：只有 plan 确认了维护需求才追加，不默认膨胀范围
- 维护 Phase 的任务同样按「单功能点 + 验证命令」拆解，交付物可独立验收
- 若 plan 未定义维护规划，跳过此 Phase，不猜测填充

```markdown
## Phase 1: lexer（词法分析模块）
阶段目标：字符串 → Token 列表；交付物：src/tokenize.mbt + 测试
依赖：无

### Task 1.1: Token 类型定义
...

### Task 1.2: 基本 tokenize 函数
...

## Phase 2: parser（AST 构建模块）
阶段目标：Token 列表 → AST；交付物：src/parser.mbt + 测试
依赖：Phase 1
...
```

### 3. 输出计划文档

保存到 `docs/plans/YYYY-MM-DD-{feature}-plan.md`

## 任务结构

```markdown
### Task N: [组件名]

**文件：**
- Create: `src/xxx.mbt`
- Modify: `src/lib.mbt:10-25`
- Test: `src/lib_test.mbt`

**接口：**
- 消费: 依赖上游 Task 的输出
- 产出: 函数签名、类型定义

#### Step 1: 写会失败的测试
  （测试组织决策遵循 `moonbit-testing` 契约，详见 [`references/testing.md`](../../references/testing.md)）
  ```moonbit
  test "描述" {
    let result = function(input)
    inspect!(result, content="expected")
  }
  ```

- [ ] **Step 2: 确认测试失败**
  Run: `moon test -f "test_name"` (预期: FAIL)

- [ ] **Step 3: 写最小实现**
  ```moonbit
  pub fn function(input: Type) -> Result[Output, Error] {
    // 接口签名和测试行为已在此定义
  }
  ```

- [ ] **Step 4: 确认测试通过**
  Run: `moon test -f "test_name"` (预期: PASS)

- [ ] **Step 5: 全量验证**
  Run: `moon fmt --check && moon check --warn-list +73 && moon test`

- [ ] **Step 6: 提交（可选，用户或仓库规则要求时）**
  ```bash
  git add -A && git commit -m "feat: add function"
  ```
```

## 任务粒度规则

任务结构支持可选阶段:
- implement 完成后，可选进入 `moonbit-perform` 性能优化
- implement 完成后，可选进入 `moonbit-refactor` 重构
- 任一阶段发现设计问题，可触发设计回溯回到 plan

| 规则 | 说明 | 反例 |
|------|------|------|
| 每个任务独立可验证 | 做完后能独立跑测试 | "实现整个解析器"（太大） |
| 单次变更建议 3 个文件以内 | Create + Modify + Test | "改 8 个文件"（考虑拆分） |
| 每个任务含完整代码 | 不写 "类似上面" | "参照 task 2 写"（模棱两可） |
| 无占位符 | 每行代码都实际写成 | "TODO: 加错误处理"（不可执行） |
| **单任务聚焦单功能点** | 一个 Task = 一个函数/类型/行为 | "实现 lexer + parser + validate"（跨模块） |
| **任务目标过大时拆分** | 拆到可独立验证的最小增量 | "实现完整格式化输出"（拆成：结构遍历→格式生成→IO） |

**注意：** 文件数是提示，不是硬限制。如果行为内聚性要求跨更多文件，优先保留语义完整性，不强行拆分。

**关于提交：** commit 仅在用户或仓库规则要求时加入。计划中不预设提交边界。

**关于实现代码：** 计划中写接口签名、测试行为、验证命令和预期结果。不生成无法提前确定的完整实现代码（如复杂的算法逻辑）。

## 用户 vs Agent 分工

| 谁 | 做什么 |
|---|--------|
| **Agent** | 拆解任务、编写计划文档、确保可执行 |
| **用户** | 审查计划、调整任务粒度、确认执行顺序 |

## 持久化状态与输出

计划文档生成后， Agent 必须在项目根目录初始化轻量级持久化状态文件 `.moonbit-pipeline.json`（用于多 Session / Context 压缩后的断点恢复）：

```json
{
  "pipeline": "development",
  "phase": "implement",
  "plan_file": "docs/plans/2026-07-29-topic-plan.md",
  "progress": {
    "total_tasks": 7,
    "completed_tasks": 0,
    "current_task": 1
  },
  "last_updated": "2026-07-29T10:00:00Z"
}
```

### 输出 JSON

```json
{
  "status": "planned | blocked",
  "total_phases": 3,
  "phases": [
    {"name": "lexer", "tasks": ["task-1", "task-2"], "depends_on": []},
    {"name": "parser", "tasks": ["task-3", "task-4"], "depends_on": ["lexer"]}
  ],
  "total_tasks": 7,
  "total_files": 5,
  "plan_file": "docs/plans/2026-07-28-parser-plan.md",
  "state_file": ".moonbit-pipeline.json",
  "next": "implement"
}
```

## 下一步

计划确认后，进入 `moonbit-implement` 开始逐个任务实现。

## 错误恢复

| 问题 | 诊断 | 修复 |
|------|------|------|
| 设计文档不存在 | 缺少 `docs/requirements.md` | 提示先执行 `moonbit-plan` |
| 任务拆解不完整 | 用户指出遗漏 | 补充缺失任务，重新编号 |
| 计划文档保存失败 | 目录不存在 | 创建 `docs/plans/` 目录 |
| 任务间依赖不清晰 | 用户无法确定执行顺序 | 标注依赖关系，按拓扑排序 |
| API 签名不明确 | plan 输出信息不足 | 回到 plan 补充 API 细节 |
