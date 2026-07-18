---
name: implement
description: "Implement MoonBit features with TDD. Use when the user says 'implement', 'write code', 'add feature', 'make it work', or after design/planning is done. Type-aware: different TDD strategies for lib, cli, c-ffi, wasm. Agent does Red-Green-Verify per task, then presents results to user. Also includes Fast Task Playbooks for Bug Fix, Refactor, and New Feature scenarios."
---

# Implement — TDD 实现

## 职责

逐任务实现功能。**Agent 做 TDD，每个任务完成后展示给用户看。** 根据 `project_type` 使用不同的 TDD 策略和验证目标。

## 各类型的 TDD 策略

### lib — 单元测试驱动

```bash
# 目标: moon test --target native
# 重点: 公共 API 覆盖、边界情况、错误处理
# 测试命名: valid/*, invalid/*, edge/*, regression/*
```

### cli — 集成测试驱动

```bash
# 目标: moon test --target native
# 重点: 命令解析、参数传递、标准 I/O
# 测试: 核心逻辑单元测试 + CLI 输出集成测试
```

### c-ffi — 安全包装驱动

```bash
# 目标: moon check --target native
# 重点: 从 L0(L1) 向外写: extern → raw wrapper → public API
# 测试: 内存安全、错误转换、边界值
# 可选: ASan 验证
```

### wasm — 内存安全驱动

```bash
# 目标: moon test --target wasm
# 重点: 从 L0 向外写: store32/load32 → raw → public
# 测试: 内存操作、边界值、WASI 调用
```

### RED: 写失败测试

```bash
# 针对当前任务写一个会失败的测试
moon test --target native -f "<task_test_name>"
# 预期: 测试失败（红）
# 如果测试意外通过: 检查测试断言是否足够严格
```

## Checkpoint: red

```bash
# 验证测试确实失败
moon test --target native -f "<task_test_name>"
# 预期: 至少 1 个测试失败
# 如果全绿: 测试可能太弱，强化断言后重试
```

```bash
# GREEN: 写最小实现让测试通过
moon test --target native -f "<task_test_name>"
# 预期: 测试通过
# 如果失败: 检查实现是否正确
```

## Checkpoint: green

```bash
# 验证当前任务测试通过
moon test --target native -f "<task_test_name>"
# 预期: 通过
# 如果失败: 回到实现步骤
```

```bash
# VERIFY: 全量验证不影响其他功能
moon fmt --check && moon check --target native --warn-list +73 --target native && moon test --target native
# c-ffi: 额外验证 C 编译
# wasm: 额外验证 WASM 目标
```

## Checkpoint: verify

```bash
# 全量验证
moon fmt --check && moon check --target native --warn-list +73 && moon test --target native && moon info --target native
# 预期: 全部通过
# 如果失败: 定位并修复回归
```

## 错误恢复速查表

| 命令 | 诊断 | 修复 | 升级 |
|------|------|------|------|
| `moon test -f` | 测试未失败 | 强化断言 | 换一个更具体的测试场景 |
| `moon test -f` | 实现后仍失败 | 检查逻辑 | 调试单步执行 |
| `moon check` | E#### | `moon check --explain` | 检查类型签名 |
| `moon test` | 其他测试失败 | 检查回归 | 回滚本任务改动 |
| `moon fmt --check` | 格式问题 | `moon fmt` | 编辑器配置冲突 |

### 失败处理

| 情况 | 处理 |
|------|------|
| 测试失败 | Agent 自动诊断并修复（最多 3 次） |
| 3 次修复失败 | Agent 暂停，展示问题，问用户方向 |
| 用户说「改这里」 | Agent 修改，重新验证，再次展示 |

## 用户 vs Agent 分工

| 谁做 | 做什么 |
|------|--------|
| **Agent** | 写测试、写实现、跑验证、诊断失败 |
| **用户** | 审查结果、说「改这里」、卡住时给方向 |

## 输出

```json
{
  "status": "done | paused",
  "project_type": "lib",
  "completed_tasks": ["task-1", "task-2"],
  "current_task": "task-3",
  "test_results": {"passed": 5, "failed": 0},
  "user_feedback": null,
  "next": "implement | evaluate"
}
```

## Idempotency

本技能可安全重复运行：

- **TDD 循环**: 每个任务独立，重跑单个任务不影响其他任务
- **测试过滤**: `-f` 参数确保只运行指定测试
- **验证管道**: 无状态，每次运行产生相同结果

```bash
# Idempotency check: 重跑同一任务测试
moon test --target native -f "<task_test_name>"
# 预期: 始终通过（同一工具链版本）
```
## 类型感知分支

根据 `project_type` 调整 TDD 策略：

| 项目类型 | TDD 重点 | 验证目标 |
|---------|---------|---------|
| `lib` | 公共 API 覆盖、边界情况 | `moon test --target native` |
| `cli` | 命令解析、参数传递、标准 I/O | `moon test --target native` + 集成测试 |
| `c-ffi` | 内存安全、错误转换、边界值 | `moon check --target native` + ASan |
| `wasm` | 内存操作、边界值、WASI | `moon test --target wasm` |
| `parser` | valid/invalid/edge 分类测试 | `moon test --target native` |
| `async` | 协程测试、超时、取消安全 | `moon test --target native` |

## 幂等性

本技能可安全重复运行：

- **TDD 循环**: 每个任务独立，重跑单个任务不影响其他任务
- **测试过滤**: `-f` 参数确保只运行指定测试
- **验证管道**: 无状态，每次运行产生相同结果

```bash
# Idempotency check: 重跑同一任务测试
moon test --target native -f "<task_test_name>"
# 预期: 始终通过（同一工具链版本）
```

## 快速任务模式（Fast Task Playbooks）

> 来源: `moonbit-agent-guide`

根据任务类型选择最小执行流程：

### Bug Fix — 修复 Bug

```bash
# 1. 复现或定位失败行为
moon test --target native -f "<failing_test>"
# 2. 定位符号
moon ide outline | grep <symbol>
moon ide peek-def <symbol>
moon ide find-references <symbol>
# 3. 最小修复
# 4. 验证
moon check && moon test [dirname|filename] --filter 'glob' && moon fmt && moon info
# 预期: pkg.generated.mbti 不变（API 无变化）
```

### Refactor — 重构

```bash
# 1. 确认行为不变
# 2. 语义重命名/导航
moon ide rename <symbol> <new_name>
# 同名符号: moon ide rename <symbol> <new_name> --loc filename:line:col
# 3. 保持编辑包局部
# 4. 验证
moon check && moon test [dirname|filename] && moon fmt && moon info
# 预期: API 保持不变
```

### New Feature — 新功能

```bash
# 1. 发现现有 API 避免重复
moon ide doc '<query>'
# 2. 添加实现，用 ///| 分隔
# 3. 添加黑盒测试 + 文档示例
# 4. 验证
moon check && moon test [dirname|filename] && moon fmt && moon info
# 预期: pkg.generated.mbti 反映新增 API
```

## IDE 工具链

在实现前和使用期间，优先用语义工具代替文本搜索：

```bash
# 发现现有 API
moon ide doc '<query>'

# 查看符号定义
moon ide peek-def <symbol>

# 查找引用，确认调用点
moon ide find-references <symbol>

# 安全重命名
moon ide rename <old> <new>
# 同名符号加 --loc filename:line:col
```

## 上游参考

- `moonbit-agent-guide` — 通用 MoonBit 工作流与验证循环
- `moonbit-refactoring` — API 最小化、方法化、模式匹配重构
- `moonbit-c-binding` — FFI 绑定细节（适用于 c-ffi/wasm）

## MoonBit API 速查

> 基于 moonbitlang/core 0.1.20260713 版本。工具链更新后请用 `moon ide doc` 确认最新 API。

### 类型转换

```moonbit
// StringView → String（✅ 正确）
let s: String = view.to_owned()

// StringView → String（❌ 已废弃，0.1.20260713 起移除）
// let s: String = view.to_string()

// String → Int64
let n = "123".parse_int64().or(0i64)

// String → Double
let f = "3.14".parse_double().or(0.0)

// String → Int
let i = "42".parse_int().or(0)

// Int64 → String
let s = 42i64.to_string()
```

### 字符串操作

```moonbit
// 检查前缀/后缀（✅ 正确）
"hello".has_prefix("he")      // true
"hello".has_suffix("lo")      // true

// 检查前缀/后缀（❌ 已废弃）
// "hello".starts_with("he")
// "hello".ends_with("lo")

// 查找子串
"key = value".find("=")  // Some(3)
"no eq".find("=")        // None

// 字符串切片
let s = "hello"
s[1:4]   // "ell" (StringView)
s[1:4].to_owned()  // "ell" (String)
```

### 测试断言

```moonbit
// 检查输出（✅ 正确）
inspect(value, content?=Some("expected_output"))

// 检查输出（❌ 已废弃）
// inspect(value, content?="expected_output")

// 使用 Debug trait 而非 Show
derive(Debug, Eq, ToJson)
// derive(Show, Eq, ToJson)  // ❌ 已废弃，用 Debug
```

### 字符串插值

```moonbit
// ✅ 正确
"Hello, \{name}!"

// ❌ 已废弃
// "Hello, \(name)!"
```

### Map 初始化

```moonbit
// ✅ 正确
let map : Map[String, Int] = Map::new()

// ❌ 已废弃
// let map = Map::new()  // 类型推断可能失败，需显式标注
```