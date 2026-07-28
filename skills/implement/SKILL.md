---
name: moonbit-implement
description: "Use when implementing MoonBit features, fixing bugs, or refactoring code — before writing any production code. Activated by user phrases like 'implement', 'write code', 'add feature', 'fix this bug', 'refactor', or after a plan is approved."
---

# Implement — TDD 实现

## 职责

逐任务实现功能。**Agent 做 TDD（Red-Green-Verify），每个任务完成后展示给用户看。** 调试失败自动修复，3 次失败后问用户。

## The Iron Law

```
NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST
```

Write code before the test? **Delete it. Start over.**

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

## Common Rationalizations

| Excuse | Reality |
|--------|---------|
| "Too simple to test" | Simple code breaks. Test takes 30 seconds. |
| "I'll test after" | Tests written after pass immediately — which proves nothing. They may test the wrong thing. You never watched them fail. |
| "Already manually tested" | Manual testing is ad-hoc: no record, no re-runs. |
| "Deleting X hours is wasteful" | Sunk cost fallacy. Rewrite with TDD (high confidence) vs. keep untrustworthy code. |
| "I need to explore first" | Fine. Throw away exploration, start with TDD. |
| "Test hard = design unclear" | Listen to test. Hard to test = hard to use. Simplify. |
| "This is just a quick fix" | Quick fixes without tests break things. Write the test. |

## TDD 循环

```
┌─ RED:    写一个会失败的测试 → moon test -f "test_name" (预期: 失败)
├─ GREEN:  写最小实现 → moon test -f "test_name" (预期: 通过)
├─ VERIFY: 全量验证 → moon fmt --check + moon check --warn-list +73 + moon test
└─ 失败 → 自动诊断 (debug 内置, 3 次上限 → 问用户)
```

## 各类型 TDD 策略

| 类型 | 验证目标 | 重点 |
|------|---------|------|
| lib | `moon test --target native` | 公共 API 覆盖、边界情况、错误处理 |
| cli | `moon test --target native` | 命令解析、参数传递、标准 I/O |
| c-ffi | `moon check --target native` | 从 L0(L1) 向外写，内存安全 |
| wasm | `moon test --target wasm` | 内存操作、边界值、WASI |
| parser | `moon test --target native` | valid/invalid/edge 分类测试 |
| async | `moon test --target native` | 协程测试、超时、取消 |

## 调试内置（debug 集成）

```bash
# 收集失败信息
moon test --target native -- --show-output 2>&1 | tail -50
moon check --target native --warn-list +73 2>&1
moon check --explain E#### 2>&1

# 分类失败
# 类型错误 → --explain 修复 | 断言失败 → 修正逻辑 | 运行时 panic → 检查空值/边界
# c-ffi: 检查 C 编译 | wasm: 检查 extern "wasm" 声明

# 修复并验证
moon test --target native -f "failing_test"
moon fmt --check && moon check --warn-list +73 && moon test
```

## 常见类型错误速查

| 现象 | 原因 | 修复 |
|------|------|------|
| `String[i]` 类型不匹配 | `String[i]` 返回 `UInt16`（编码点数值），不是 `Char` | 用 `Char::from_int(s[i].to_int())` 转换后再使用 |
| `Json` 没有 `unwrap` 方法 | `@json.parse` 返回 `Json`，不是 `Result` | 直接使用 `@json.parse(s)`，错误处理用 `try/catch` |
| `Error` 构造器歧义 | 多个枚举同名变体 | 用 `Type::Variant` 显式消歧：`FinishReason::Error` |
| Char→String 得到数字 | `UInt16.to_string()` 输出数值字符串 | 先 `Char::from_int(s[i].to_int())`，再插值 `"\{ch}"` |
| `for (k, v) in map` 解析错误 | `for` 循环不支持元组解构 | `for entry in map { match entry { (k, v) => ... } }` |
| `match` 嵌套在 `+` 中报错 | MoonBit 不允许 `+` 操作数内直接嵌套 `match` | 先提取 `let part = match ... { ... }`，再拼接 |

## 快速任务模式

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
  "project_type": "lib",
  "completed_tasks": ["task-1", "task-2"],
  "current_task": "task-3",
  "test_results": {"passed": 5, "failed": 0},
  "next": "implement | evaluate"
}
```

## 下一步

实现完成后，先调用 `moonbit-verify` 做全量门禁检查，然后进入 `moonbit-evaluate` 做最终验收和发布准备。

如果用户请求的是调试/修复现有代码，不需要走完整管线——直接在当前项目上执行 TDD 循环即可。
