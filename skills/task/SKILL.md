---
name: moonbit-task
description: "Use when executing a single implementation task end-to-end — implementing one module or feature with test-first TDD (RED → GREEN → VERIFY), item-by-item acceptance, and quality delivery. Activated by user phrases like 'implement this task', 'finish this task', '实现这个任务', '完成单一模块', '逐项验收', or after moonbit-writing-plans hands off a single task."
---

# Task — 单一任务实现

## 职责

执行**单个实现任务**：按现代化开发流程，实现单一模块功能，**测试前置、逐项验收、保质保量交付**给用户。

每个 Task 均按 TDD（RED → GREEN → VERIFY）执行。任务是实现的最小交付单元：一个任务 = 一个可独立验证的行为增量。

**与 `moonbit-implement` 的分工**：`moonbit-implement` 面向 Feature/Bug 的双模式 TDD 循环；本技能面向**单个任务的完整交付闭环**——从验收标准定义到逐项验收通过，强调可交付性而非只完成代码。

## The Iron Law

```
NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST
NO TASK DELIVERY WITHOUT ALL ACCEPTANCE ITEMS VERIFIED
```

先写测试再写实现？**是。** 测试未失败就写实现？**删掉，重来。**
验收清单未逐项确认就声称完成？**不算完成。**

## 执行流程

### 1. 任务接收（INGEST）

- 从 `moonbit-writing-plans` 任务列表接收任务，或接收用户描述的单模块需求
- 确认：任务边界（做什么/不做什么）、输入输出、依赖的上游任务产物
- 若任务目标含糊 → 停止，向用户澄清，不猜测实现

### 2. 定义验收标准（ACCEPTANCE）

实现前先写**验收清单**，每个验收项必须可观察、可验证：

```
验收清单（示例）:
[ ] A1: 输入 X 时返回 Y（moon test -f "task_x_valid" 通过）
[ ] A2: 非法输入返回错误而非 panic（moon test -f "task_x_invalid" 通过）
[ ] A3: 边界条件 B 处理正确（moon test -f "task_x_edge" 通过）
[ ] A4: 全量验证通过（moon fmt --check + moon check + moon test）
```

- 验收项即测试目标：**每个验收项对应至少一个测试**
- 测试组织决策遵循 `moonbit-testing` 契约（见 [`testing/SKILL.md`](../testing/SKILL.md)）

### 3. TDD 循环（RED → GREEN → VERIFY）

```
┌─ RED:    写一个会失败的测试 → moon test -f "task_x_*" (预期: 失败)
├─ GREEN:  写最小实现 → moon test -f "task_x_*" (预期: 通过)
├─ VERIFY: 全量验证 → moon fmt --check + moon check --warn-list +73 + moon test
└─ 失败 → 诊断修复（有界重试，见错误恢复）；3 次失败 → 停止问用户
```

- 一次只写一个测试，一个测试对应一个验收项
- 最小实现：只做让当前测试通过的事，不提前扩展功能
- 测试通过后**标记对应验收项**，逐项推进

### 4. 逐项验收（ACCEPT）

- 重新执行全部测试，逐项核对验收清单
- 任一验收项失败 → 回到 TDD 循环，不得跳过
- 全部验收项通过 → 向用户展示：验收清单 + 测试结果 + 变更文件

### 5. 交付（DELIVER）

- 向用户报告：任务完成、验收清单逐项结果、关键变更、验证证据
- 输出 JSON（见下），更新 `.moonbit-pipeline.json` 进度
- **任务验收后的处理**（Git 操作遵循 `moonbit-git` 技能，见 [`git/SKILL.md`](../git/SKILL.md)）：
  - **单个任务** → 交给用户确认，**不自动提交 git**。展示变更（验收清单 + diff）后等待用户决定（确认、修改或提交）。
  - **多个任务且用户已授权提交 git** → 验收后按授权在功能分支上提交（遵循 `moonbit-git` 分支工作流）。
  - **分支规范**：不在主分支直接修改；单个功能在功能分支上实现，合并后再建新分支。
  - **worktree 并行**：必须获得用户明确同意；不同意则顺序实现。
  - **前提检查**：项目本身是 git 仓库（存在 `.git` 或 `git rev-parse` 成功）才可提交；非 git 仓库只展示变更，不执行 `git` 命令。

## Red Flags — STOP and Start Over

- 写实现代码时还没有失败测试（"接口很简单，直接写"）
- 测试一次就绿（没看过它失败，说明没先写测试）
- 验收项与测试不对应（"这个验收项不用测"）
- 任务范围蔓延（"顺便把下一个任务也做了"）
- 跳过全量验证（"刚才那个测试过了就行"）
- 用旧结果声称验收通过（"上次跑过了"）

**All of these mean: Stop. 回到 TDD 起点。**

## 停止条件

- 任务目标无法澄清 → 停止，向用户提问
- 3 次自动修复全部失败 → 停止，展示失败历史，请求方向（可回到 `moonbit-plan` 重设计）
- 变更涉及 public API / ABI / WASM 导出 / C 所有权 → 停止自动修复，请求用户确认
- 测试无法编写（设计缺陷导致不可测试）→ 触发设计回溯，回到 `moonbit-plan`
- 全量验证失败且不属于本任务范围 → 报告，由用户决定是否扩展任务边界

## 错误恢复

| 问题 | 诊断 | 修复 |
|------|------|------|
| `moon test -f` 失败 | 断言不匹配或实现逻辑错误 | 检查 inspect! 期望，修正实现；3 次失败后停止问用户 |
| `moon check` 类型错误 | 类型签名不匹配 | `moon explain --diagnostic E####` 定位，查 `references/error-codes.json` |
| `moon fmt --check` 失败 | 格式不规范 | `moon fmt` 自动修复，重新检查 |
| 验收项对应测试缺失 | 验收标准未转成测试 | 补写测试，回到 RED |
| 上游任务产物不可用 | 依赖未实现 | 报告依赖缺失，请求先完成上游任务 |

## 输出 JSON

```json
{
  "status": "delivered | paused | blocked",
  "task": "task-4",
  "acceptance": {
    "total": 4,
    "passed": 4,
    "items": [
      {"id": "A1", "status": "pass", "test": "task_x_valid"},
      {"id": "A2", "status": "pass", "test": "task_x_invalid"}
    ]
  },
  "test_results": {"passed": 6, "failed": 0},
  "files_changed": ["src/task_x.mbt", "src/task_x_test.mbt"],
  "state_file": ".moonbit-pipeline.json",
  "next": "implement | code-review | verify"
}
```

## 下一步

任务交付后：若本任务存在设计风险或复杂变更 → `moonbit-code-review`；全部任务完成后 → `moonbit-verify` 做全量门禁，再进入 `moonbit-evaluate`。
