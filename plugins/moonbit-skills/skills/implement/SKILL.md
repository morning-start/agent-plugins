---
name: moonbit-implement
description: "Use when implementing MoonBit features, fixing bugs, or debugging code — before writing any production code. Activated by user phrases like 'implement', 'write code', 'add feature', 'fix this bug', 'debug', 'error', or after a plan is approved."
---

# Implement — TDD 实现

## 职责

逐任务实现功能。**Agent 做 TDD（Red-Green-Verify），每个任务完成后展示给用户看。** 调试失败自动修复，3 次失败后问用户。

**实现要分功能模块、小步推进**：一次只实现一个功能点/模块，不一次性实现太大目标。任务过大时回到 `moonbit-writing-plans` 拆分，而不是在实现中"顺手"扩展范围。

## The Iron Law

```
NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST
```

Write code before the test? **Delete it. Start over.**

测试组织决策必须遵循 `moonbit-testing` 契约。详见 [`testing/SKILL.md`](../testing/SKILL.md) 和 [`references/testing.md`](../../references/testing.md)。

No exceptions:
- Don't keep it as "reference"
- Don't "adapt" it while writing tests
- Don't look at it
- Delete means delete

Implement fresh from tests. Period.

## Red Flags — STOP and Start Over

If you catch yourself thinking any of these, you are violating TDD:

- Code before test
- Test after implementation
- Test passes immediately (means you didn't watch it fail)
- Can't explain why test failed
- Tests added "later"
- Rationalizing "just this once"
- "I already manually tested it"
- "Keep existing code as reference, write tests"
- "Already spent X hours, deleting is wasteful"
- "TDD is dogmatic, I'm being pragmatic"

**All of these mean: Delete code. Start over with TDD.**

## 停止条件

- 3 次自动修复全部失败 → 停止，向用户展示失败历史和当前状态，请求方向
- 变更涉及 public API、ABI、WASM 导出或 C 所有权 → 停止自动修复，请求用户确认
- 工具链报错无法通过 `moon explain` 解决 → 报告错误码和上下文，请求用户介入
- 测试无法编写（设计缺陷导致不可测试）→ **触发设计回溯**，回到 `moonbit-plan` 重新设计 API（详见 [plan 的设计回溯章节](../plan/SKILL.md#设计回溯)）

## Common Rationalizations

| Excuse | Reality |
|--------|---------|
| "Too simple to test" | Simple code breaks. Test takes 30 seconds. |
| "I'll test after" | Tests written after pass immediately — which proves nothing. They may test the wrong thing. You never watched them fail. |
| "Already manually tested" | Manual testing is ad-hoc: no record, no re-runs. |
| "Deleting X hours is wasteful" | Sunk cost fallacy. Rewrite with TDD (high confidence) vs. keep untrustworthy code. |
| "I need to explore first" | 在 plan 阶段使用 Spike 原型验证。验证后丢弃，再进入 TDD。 |
| "Test hard = design unclear" | Listen to test. Hard to test = hard to use. Simplify. |
| "This is just a quick fix" | Quick fixes without tests break things. Write the test. |

## TDD 循环

```
┌─ RED:    写一个会失败的测试 → moon test -f "test_name" (预期: 失败)
│          （测试组织遵循 moonbit-testing 决策；测试时机遵循 testing 的先行/后补决策）
├─ GREEN:  写最小实现 → moon test -f "test_name" (预期: 通过)
├─ VERIFY: 全量验证 → moon fmt --check + moon check --warn-list +73 + moon test
└─ 失败 → 自动诊断 (debug 内置, 3 次上限 → 问用户)

设计回溯触发条件: API 不可测、架构假设错误、依赖不兼容 → 回到 plan（详见 [plan 设计回溯](../plan/SKILL.md#设计回溯)）
```

### 模块化小步实现

- 按 `writing-plans` 的任务粒度推进：一个 Task = 一个功能点/模块，**不跨多个模块同时大改**
- 任务目标过大（预计改动 >3 文件或跨模块）→ **回到 `moonbit-writing-plans` 拆分**，不在实现中临时扩范围
- 每个模块的 Phase 完成时，该模块测试应全绿且可独立验证
- 实现范围以当前 Task 的验收项为准，不"顺手"实现相邻功能

### 批次上限（Batch Limit）— 连续执行最多 5 个任务

多任务连续执行会拉长上下文窗口（测试输出、诊断日志、diff 逐任务累积）。执行批次约束：

- **连续执行最多 5 个任务**，之后**停止并汇报**，等待用户确认或进入提交检查点
- 达到批次上限时的处理：
  1. 汇报本批已完成任务 + 剩余任务清单（指向 `writing-plans` 的批次边界）
  2. 按 `moonbit-git` 一次性授权协议自动提交合并（每任务验收后已按授权提交；批次检查点确认工作区干净）
  3. 继续前压缩会话或开始新上下文（平台支持时），再进入下一批
- 批次边界与 `writing-plans` 标注的 Batch 一致；**不要为了赶进度超出批次上限**
- 平台不支持会话压缩 → 批次上限收紧（≤3），并在批间强制提交检查点

### 批次内执行 — 同背景任务连续完成

批次的划分遵循内聚原则（`moonbit-writing-plans` 的批次划分规则：同模块/同文件/同主题优先同批），执行时同样按内聚推进：

- **按批内任务顺序连续完成**，不跳跃执行（批内是依赖序 + 同背景任务，跳跃会丢上下文）
- 批内任务共享的上下文（模块类型定义、测试文件、错误处理约定）**一次加载、连续复用**，不重复读取
- 批内前一任务的产出（类型、函数、测试模式）直接供后一任务复用，无需跨批回忆
- 批内每个任务仍独立走 RED → GREEN → VERIFY；批结束时整体验证一次（该批测试全绿）再进入提交检查点
- 遇到批内某任务阻塞 → 先解决或标记，不跳过后续依赖它的任务（防止上下文割裂）

---

## Bug Fix Mode

当用户请求是修复现有 bug（而非新增功能）时，进入 Bug Fix Mode，与 Feature TDD 模式并列。

### The Iron Law (Bug Fix)

```
NO BUG FIX WITHOUT REGRESSION TEST FIRST
```

不写 regression test 就修 bug？**先写测试再修。** regression test 必须：
1. **能复现 bug**：修之前跑是红的
2. **能证明修复有效**：修之后跑是绿的
3. 命名规则：`regr_{bug_id_or_desc}`，放在测试文件末尾

### Bug Fix 流程

```
┌─ INGEST (可选): 若源自 CI 失败，接纳 ANSI/Raw CI 日志 → 提取 Target/测试名/错误码
├─ REPRODUCE:    写 regression test 复现 bug → moon test --target <target> -f "regr_*" (预期: 失败)
├─ DIAGNOSE:     定位根因（文件/函数/错误码）
├─ FIX:          最小修复 → moon test --target <target> -f "regr_*" (预期: 通过)
├─ VERIFY:       全量测试 + fmt + check + 跨平台校验 → 全部通过
└─ LEARN:        自动触发 moonbit-learn，记录根因
```

#### CI Failure Log Ingestion (CI 失败日志接入规范)
当 Bug 来自远程/异步 CI 失败（GitHub Actions 等）时，按以下步骤解析并接入：
1. **日志解析**：从用户粘贴或 CI 输出中提取 3 关键要素：
   - 目标平台：`native` | `wasm` | `wasm-gc` | `js`
   - 失败文件名/测试名：如 `test_foo_bar`
   - 诊断码/堆栈：如 `E4053` 或 panic 信息
2. **本地模拟复现**：使用目标平台命令在本地重现错误（如 `moon test --target wasm -f "test_foo"` 或 `moon check --target all`）。
3. **构造 Regression Test**：将引发 CI 差异的场景收录为本地 `regr_*` 测试，确保本地亦能稳定触发红绿循环。
### Red Flags — STOP and Start Over

- 没有 regression test 就定位代码（"我知道 bug 在哪"）
- 修完才写 regression test（"验证一下就行"）
- regression test 一开始就绿（说明没复现真正的 bug）
- 一次修多个不相关的 bug
- 修复比最小改动大（顺手重构、顺手优化）

### 停止条件

- Bug 无法稳定复现 → 停止，请求用户提供更多信息或复现步骤
- 根因跨多个模块或涉及公共 API → 报告影响范围，请求用户确认修复方向
- Fix 引入回归（其他测试变红）→ 回滚 fix，重新诊断根因
- 3 次修复全部失败 → 停止，请求用户介入

### Bug Fix vs Feature TDD

| 维度 | Feature TDD | Bug Fix Mode |
|------|-------------|-------------|
| 起点 | 新功能需求 | 已有代码行为异常 |
| 第一个测试 | 描述期望行为（RED） | 复现异常行为（RED） |
| 最小改动 | 实现新功能 | 修复根因，不改范围 |
| 完成后 | 可选进入 code-review | 自动触发 moonbit-learn |
| 设计回溯 | API 不可测时触发 | 架构缺陷导致无法修时触发 |

---

## 项目类型检测

进入 TDD 前，先检测项目类型。检测逻辑详见 [`references/type-detection.md`](../../references/type-detection.md)，与 verify 共用同一份检测逻辑，避免漂移。

类型决定 TDD 验证链路的差异。

## 各类型 TDD 策略

> 测试文件组织和命名约定详见 `references/testing.md`，此处仅列出验证重点。

| 类型 | 项目分类 | 验证目标 | 额外验证 | 文档要求 |
|------|---------|---------|---------|---------|
| lib | library | `moon test --target native` | `moon check --target all` 跨平台 | pub fn 有 docstring |
| cli | main | `moon test --target native` | `moon run .` 验证可执行 + stdout 输出 | README 用法示例与实际输出一致 |
| ffi | library | `moon check --target native` | — | FFI 函数有使用说明 |
| wasm | library | `moon test --target wasm` | `moon check --target wasm-gc` | WASM 导出函数有文档 |
| parser | library | `moon test --target native` | valid/invalid/edge 分类测试 | 输入格式有说明 |
| async | library | `moon test --target native` | 并发测试、超时测试 | 并发模型有说明 |

## 调试内置（debug 集成）

```bash
# 收集失败信息
moon test --target native 2>&1 | tail -50
moon check --target native --warn-list +73 2>&1
moon explain --diagnostic E#### 2>&1

# 分类失败
# 类型错误 → moon explain 修复 | 断言失败 → 修正逻辑 | 运行时 panic → 检查空值/边界
# ffi: 检查 C 编译 | wasm: 检查 extern "wasm" 声明

# 修复并验证
moon test --target native -f "failing_test"
moon fmt --check && moon check --warn-list +73 && moon test
```

## 常见类型错误速查

常见类型陷阱（如 `String[i]` 返回 `UInt16` 而非 `Char`、`@json.parse` 返回 `Json` 而非 `Result`、同名枚举构造器歧义、`for` 不支持元组解构、`match` 嵌套在 `+` 中等）详见 `references/idioms.md` 的"常见陷阱"章节，此处不再重复以避免漂移。

## 快速任务模式

当变更类型不适配完整 TDD 循环时，按以下路由执行验证：

| 变更类型 | 必需证据 |
|----------|----------|
| **Bug Fix** | 先复现 bug，再证明复现消失 |
| **New Behavior** | failing test → implementation → pass |
| **Refactor** | 现有测试先绿，重构后仍绿 |
| **Config / Hook** | 执行真实 hook 或配置 smoke test |
| **Documentation** | 路径、命令和示例验证 |
| **Scaffold** | 临时目录端到端生成测试 |
| **Dependency** | `moon add` → `moon check` → `moon test` → `moon-audit` |

| 场景 | 最小流程 |
|------|---------|
| **Bug Fix** | 复现失败 → `moon ide peek-def` 定位 → 最小修复 → `moon check + test + fmt + info` |
| **Refactor** | `moon ide rename` 语义重命名 → `moon check + test + fmt + info` (API 不变) |
| **New Feature** | `moon ide doc` 发现现有 API → 添加实现 → 黑盒测试 → `moon check + test + fmt + info` |

## 依赖管理契约

当涉及依赖操作（`moon add` / `moon remove` / `moon update`）时，必须执行完整验证链：

```
moon add <pkg> → moon check（类型兼容性）→ moon test（行为不变）→ moon-audit（安全审计）
```

- 依赖变更可能触发连锁重构（上游 breaking change），通知用户确认
- 跨平台依赖（native/wasm-gc/js）可能有不同的支持度，`moon check --target all` 验证
- `moon-audit` 未安装时提示 `moon add minie135/moon-audit`，不阻断
- 任何步骤失败 → 调整依赖版本或代码结构 → 重新循环

## 持久化状态与输出

在每完成一个 Task（通过 RED → GREEN → VERIFY 并经 `code-review` 批准）后，Agent 必须更新根目录的 `.moonbit-pipeline.json` 文件：

> **断点恢复衔接**：`plan_file` 必须始终指向「当前工作对应的拆解文档」。进入新 Phase（如 Phase 2）前，先把 `plan_file` 更新为新 Phase 拆解文档路径（`tasks.total/completed/current` 重置为该 Phase 计数），再开始该 Phase 任务——这是 Context 压缩/多 Session 后断点恢复的关键一环，详见 `moonbit-writing-plans` 的「断点恢复契约」。恢复会话时若 `plan_file` 过期（指向已完成 Phase），先纠正指针再继续。

```json
{
  "schema_version": 1,
  "pipeline": "development",
  "phase": "implement",
  "status": "in_progress",
  "project_type": "lib",
  "targets": ["native"],
  "plan_file": ".agent-workplace/docs/plan/PLAN.md",
  "tasks": {
    "total": 7,
    "completed": 3,
    "current": 4
  },
  "last_verification": "2026-07-29T10:25:00Z",
  "last_updated": "2026-07-29T10:30:00Z",
  "next": "implement:task-4"
}
```

### 输出 JSON

```json
{
  "status": "done | paused",
  "mode": "feature | bugfix",
  "project_type": "lib",
  "completed_tasks": ["task-1", "task-2", "task-3"],
  "current_task": "task-4",
  "test_results": {"passed": 5, "failed": 0},
  "bugfix": {
    "regression_test": "regr_null_check",
    "root_cause": "空指针未检查",
    "fixed_file": "src/parser.mbt"
  },
  "state_file": ".moonbit-pipeline.json",
  "next": "implement | evaluate | learn"
}
```

## Git 操作契约（引用 moonbit-git）

任务验收（RED → GREEN → VERIFY → code-review 通过）之后，涉及分支、提交、合并、worktree 等 Git 操作时，**遵循 `moonbit-git` 技能**（见 [`git/SKILL.md`](../git/SKILL.md)，按一次性授权协议执行），此处不重复定义以避免漂移。核心约定：

- **功能分支**：不在主分支直接修改；每个任务一个分支，验收提交后合并回主分支，再建新分支
- **一次性授权**：检测目标项目 AGENTS.md 是否有「自动提交授权」记录——已有 → 每个任务验收后自动执行「建分支 → 提交（Conventional Commits）→ 合并（`--no-ff`）→ 删除分支」；无 → 询问一次，用户允许则写入授权记录再自动执行，拒绝则只展示 diff
- **worktree 并行**：必须获得用户明确同意；不同意则顺序实现
- 单次提交只含一个 Task 产物，遵循 Conventional Commits

## 错误恢复

| 问题 | 诊断 | 修复 |
|------|------|------|
| `moon test -f "test_name"` 失败 | 断言不匹配或实现逻辑错误 | 检查 inspect! 期望内容，修正实现；3 次失败后停止问用户 |
| `moon check` 类型错误 | 类型签名不匹配、未推断、不可达分支 | `moon explain --diagnostic E####` 定位，按错误码查 `references/error-codes.json` |
| `moon fmt --check` 失败 | 格式不规范 | `moon fmt` 自动修复，重新检查 |
| `moon run .` 失败（main 项目） | main 包声明缺失或运行时 panic | 检查 `moon.pkg` 的 `pkgtype(kind: "executable")`，排查边界/空值 |
| 临时 consumer 编译失败（lib 项目） | 对外 API 不完整或导出符号不可达 | 检查 `pub` 可见性、跨包构造器是否用 `pub(all) enum` |
| 3 次自动修复全部失败 | 理解偏差或设计缺陷 | 停止，向用户展示失败历史，请求方向或回到 `moonbit-plan` 重新设计 |
| 变更涉及 public API/ABI/WASM 导出/C 所有权 | 影响发布契约 | 停止自动修复，请求用户确认后再继续 |
| 工具链报错且 `moon explain` 无法解决 | 编译器内部错误或工具链 bug | 报告错误码和上下文，请求用户介入 |
| 测试无法编写（设计缺陷） | 不可测试的 API 设计 | **触发设计回溯**，回到 `moonbit-plan` 重新设计 API |

## 下一步

实现完成后，先调用 `moonbit-verify` 做全量门禁检查，然后进入 `moonbit-evaluate` 做最终验收和发布准备。

如果用户请求的是调试/修复现有代码，不需要走完整管线——直接在当前项目上执行 TDD 循环即可。

如果已验证的代码在 CI 中失败（跨平台、集成测试、lint），回到本技能修复。CI 失败日志作为诊断输入，定位根因后修复并重新验证。
