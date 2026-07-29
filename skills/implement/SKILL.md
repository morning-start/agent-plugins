---
name: moonbit-implement
description: "Use when implementing MoonBit features, fixing bugs, debugging, or refactoring code — before writing any production code. Activated by user phrases like 'implement', 'write code', 'add feature', 'fix this bug', 'debug', 'error', 'fail', 'refactor', or after a plan is approved."
---

# Implement — TDD 实现

## 职责

逐任务实现功能。**Agent 做 TDD（Red-Green-Verify），每个任务完成后展示给用户看。** 调试失败自动修复，3 次失败后问用户。

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
│          （测试组织遵循 moonbit-testing 决策）
├─ GREEN:  写最小实现 → moon test -f "test_name" (预期: 通过)
├─ VERIFY: 全量验证 → moon fmt --check + moon check --warn-list +73 + moon test
└─ 失败 → 自动诊断 (debug 内置, 3 次上限 → 问用户)

设计回溯触发条件: API 不可测、架构假设错误、依赖不兼容 → 回到 plan（详见 [plan 设计回溯](../plan/SKILL.md#设计回溯)）
```

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
┌─ REPRODUCE:  写 regression test 复现 bug → moon test -f "regr_*" (预期: 失败)
├─ DIAGNOSE:   定位根因（文件/函数/错误码）
├─ FIX:        最小修复 → moon test -f "regr_*" (预期: 通过)
├─ VERIFY:     全量测试 + fmt + check → 全部通过
└─ LEARN:      自动触发 moonbit-learn，记录根因
```

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

进入 TDD 前，先检测项目类型。检测逻辑详见 [`references/type-detection.md`](../references/type-detection.md)，与 verify 共用同一份检测逻辑，避免漂移。

类型决定 TDD 验证链路的差异。

## 各类型 TDD 策略

> 测试文件组织和命名约定详见 `references/testing.md`，此处仅列出验证重点。

| 类型 | 项目分类 | 验证目标 | 额外验证 | 文档要求 |
|------|---------|---------|---------|---------|
| lib | library | `moon test --target native` | `moon check --target all` 跨平台 | pub fn 有 docstring |
| cli | main | `moon test --target native` | `moon run .` 验证可执行 + stdout 输出 | README 用法示例与实际输出一致 |
| c-ffi | library | `moon check --target native` | — | FFI 函数有使用说明 |
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
# c-ffi: 检查 C 编译 | wasm: 检查 extern "wasm" 声明

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

| 场景 | 最小流程 |
|------|---------|
| **Bug Fix** | 复现失败 → `moon ide peek-def` 定位 → 最小修复 → `moon check + test + fmt + info` |
| **Refactor** | `moon ide rename` 语义重命名 → `moon check + test + fmt + info` (API 不变) |
| **New Feature** | `moon ide doc` 发现现有 API → 添加实现 → 黑盒测试 → `moon check + test + fmt + info` |

## 用户 vs Agent 分工

| 谁 | 做什么 |
|---|--------|
| Agent | 写测试、写实现、跑验证、诊断失败 |
| 用户 | 审查结果、说「改这里」、卡住时给方向 |

## 输出

```json
{
  "status": "done | paused",
  "mode": "feature | bugfix",
  "project_type": "lib",
  "completed_tasks": ["task-1", "task-2"],
  "current_task": "task-3",
  "test_results": {"passed": 5, "failed": 0},
  "bugfix": {
    "regression_test": "regr_null_check",
    "root_cause": "空指针未检查",
    "fixed_file": "src/parser.mbt"
  },
  "next": "implement | evaluate | learn"
}
```

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
