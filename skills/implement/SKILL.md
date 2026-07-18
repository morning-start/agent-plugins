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

> 基于 moonbitlang/core 0.1.20260713 (v0.10.4) 版本。工具链更新后请用 `moon ide doc` 确认最新 API。

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
// ✅ 正确（0.9.0+）
debug_inspect(value, content=Some("expected_output"))

// ❌ 已废弃（0.9.0）
// inspect(value, content?=Some("expected_output"))

// 使用 Debug trait 而非 Show
derive(Debug, Eq, ToJson)
// derive(Show, Eq, ToJson)  // ❌ 已废弃，0.9.0 起用 Debug

// 调试断言（0.8.0+）
@debug.assert_eq(a, b)
// assert_eq(a, b)  // ❌ 已废弃
```

### 调试输出

```moonbit
// 调试插值（0.9.0+）
"\{to_repr(value)}"  // 通过 Debug 输出
"\{value}"           // 通过 Show 输出（用于用户可见的输出）

// Debug 特征支持 ignore 参数（0.8.0+）
derive(Debug(ignore=[ExternalType]))
```

### 字符串插值

```moonbit
// ✅ 正确（0.10.0+ 编译为 StringBuilder 写入，性能更好）
"Hello, \{name}!"

// ❌ 已废弃
// "Hello, \(name)!"

// const 支持字符串插值（0.8.3+）
const Hello = "Hello"
const Message = "\{Hello} World"

// Bytes 字符串插值（0.10.4+）
let b : Bytes = b"value=\{x}"
```

### 循环语法

```moonbit
// for..in 带额外循环变量（0.8.3+）
for x in xs; sum = 0 {
  continue sum + x
} nobreak {
  sum
}

// for..in 带状态变量更新（0.10.0+）
for i in 0..<10; p1 = 1, p2 = 0; p1 = p1 + p2, p2 = p1 {
  // 每次循环自动更新 p1, p2
}

// 无限循环（0.8.0+）
for ;; { ... }
// for { ... }  // ❌ 已废弃

// 反向 range（0.8.0+）
for x in 4>..0 { ... }    // 反向，不包含
for x in 4>=..0 { ... }   // 反向，包含

// 闭合 range 语法（0.8.0+）
for i in 0..<=10 { ... }  // 包含 10
// for i in 0..=10 { ... }  // ❌ 已废弃，用 ..<=

// nobreak 替代 else（0.8.0+）
for i = 0; i < 10; i = i + 1 {
} nobreak {
  i
}
// 循环的 else 块 → nobreak

// List comprehension（0.9.0+）
let evens = [ for i in 0..<100 if i % 2 == 0 => i ]

// List comprehension 带额外循环变量（0.10.0+）
let fibs = [
  for _ in 0..<10
      p1 = 1, p2 = 0
      p1 = p1 + p2, p2 = p1 => { p1 }
]

// Iter 字面量（0.10.4+）
let xs : Iter[Int] = [| 1, 2, 3 |]
let ys = [| ..xs, 4, 5 |]
```

### 模板写入语法（0.10.0+）

```moonbit
// 用 buf <+ "string" 替代 buf.write_string("string")
let buf = StringBuilder()
buf <+ "Hello, \{name}!"
buf <+ "More text"
buf.to_string()

// 条件写入（0.10.4+）
let logger : Option[StringBuilder] = Some(StringBuilder())
logger <? "[debug] message"  // 仅当 logger 为 Some 时写入
```

### Map 初始化

```moonbit
// ✅ 正确（0.10.4+ 推荐 Map([]) 而非 Map::new()）
let map : Map[String, Int] = Map([])

// 旧写法仍可用，但可能产生歧义警告
// let map = Map::new()  // 类型推断可能失败，需显式标注
```

### 类型定义

```moonbit
// suberror 语法（0.8.0+）
suberror Err {
  Err(String)
}
// suberror Err String  // ❌ 已废弃

// declare 关键字（0.8.0+，spec-first 开发）
declare type T
declare fn T::f(x : T) -> Int
declare impl Show for S

// trait 和 impl 需要 fn 关键字（0.10.0+）
trait I {
  fn f(Self) -> Unit
}
impl I for Int with fn f(_) {}

// extend 语法（0.10.4+，替代 impl 隐式方法挂载）
extend Type with Trait::{f, g}
pub extend Type with Trait::{f, g}  // 公开挂载

// 多态 trait 方法（0.10.0+）
trait Logger {
  fn[X : Show] write_object(Self, X) -> Unit
}

// 自定义构造器（0.8.0+）
struct Point {
  x : Int
  y : Int
}
fn Point::Point(x : Int, y : Int) -> Point { { x, y } }
// 使用: let p = Point(1, 2)

// extensible enum（0.9.0+）
pub(all) extenum LogEvent[T] {
  Info(T)
  Warning(T)
}
// 在另一个包中扩展:
// extenum @base.LogEvent[T] += { Debug(T) }

// 反向 range 语法（0.8.0+）
// x>..y  — 反向不包含
// x>=..y — 反向包含
// x..<=y — 正向包含（替代 x..=y）
```

### 管道语法

```moonbit
// 反向管道 <|（0.9.0+）
div <| [ text("hello") ]
obj.method(args) <| last_arg

// 正向管道 |>（可用）
42 |> Some
```

### 项目配置（0.10.4+）

```moonbit
// moon.pkg 使用 pkgtype 替代 options("is-main": true)
pkgtype(kind: "executable")       // 可执行包
pkgtype(kind: "foreign_library")  // 外部库（C FFI）
pkgtype(kind: "library")          // 库（默认）

// 使用 #export_name 指定导出符号名
#export_name("my_func")
pub fn my_func() -> Int { 42 }

// moon.mod 顶层配置（0.10.4+）
// source = "src" 等配置项提升到 moon.mod 顶层

// supported-targets 支持 +js+wasm+wasm-gc 语法（0.8.3+）
// supported_targets = "+all-js"  // 不支持 js
```

### 包配置格式（0.10.4+）

```moonbit
// ✅ 新格式: moon.mod / moon.pkg
// moon.mod:
// name = "namespace/package"
// version = "0.1.0"
// preferred_target = "native"
// supported_targets = ["native", "wasm", "js"]
// source = "src"

// moon.pkg:
// import {
//   "moonbitlang/core",
// }

// ❌ 旧格式 moon.mod.json / moon.pkg.json 将在下个版本移除
// 使用 moon fmt 自动迁移
```

### 其他语法

```moonbit
// 正则表达式（0.9.0+）
const PATTERN = re"abc"
let matched = s =~ re"abc"

// or pattern with 默认值（0.10.4+）
match s {
  Some(x) | None with x = 0 => ... // 处理 x
}

// 数组条件展开（0.10.4+）
let xs = [1, 2, ..if cond { extra }, 3]

// 反向 pipeline（0.9.0+）
fn view() -> Html {
  div <| [ text("hello") ]
}

// const 字符串拼接（0.8.3+）
const Hello = "Hello"
const HelloWorld = Hello + " World"

// #alias 和 #as_free_fn 的独立属性控制（0.8.0+）
#alias(g2, deprecated)
#deprecated
fn f() -> Unit
```