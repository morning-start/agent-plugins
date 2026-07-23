# MoonBit 惯用写法

## 类型

```moonbit
// ✅ 用 T? 而不是 Option[T]
fn find(id: Int) -> User?

// ✅ Result 用于可恢复错误
pub fn parse(input: StringView) -> Result[Ast, ParseError]

// ✅ suberror 用于不可恢复错误
pub(all) suberror IoError {
  NotFound
  PermissionDenied
} derive(Debug, Eq)

// ✅ Debug 替代 Show（0.9.0+）
derive(Debug, Eq, ToJson)
```

## 字符串

```moonbit
// ✅ 用 StringView 参数（零拷贝）
pub fn parse(input: StringView) -> Result[Ast, ParseError]

// ✅ StringView → String（✅ 正确）
let s: String = view.to_owned()

// ✅ 用 StringBuilder 构建 + 模板写入（0.10.0+）
let buf = StringBuilder()
buf <+ "Hello, \{name}!"
buf.to_string()

// ✅ 字符串插值（0.10.0+）
"Hello, \{name}!"

// ✅ 检查前缀/后缀
"hello".has_prefix("he")
"hello".has_suffix("lo")

// ✅ 字符串切片
let s = "hello"
s[1:4]   // "ell" (StringView)
```

## 错误处理

```moonbit
// ✅ 层间错误转换
fn wrap[X](f: () -> X raise @raw.Errno) -> X raise Errno {
  try f() catch {
    raw_err => raise Errno::from_raw(raw_err)
  }
}

// ❌ 空 catch
try risky() catch { _ => () }
```

## 资源管理

```moonbit
// ✅ 用 with_closed RAII
fn with_file(file: File, work: (File) -> X raise Error) -> X raise Error {
  try work(file) catch {
    err => try file.close() catch { _ => _ } noraise { _ => raise err }
  } noraise {
    value => { file.close(); value }
  }
}
```

## FFI 所有权注解

```moonbit
// #borrow — C 不持有引用，MoonBit GC 管理
extern "c" fn process(data: #borrow Bytes) -> Unit = "process"

// #owned — 所有权转移给 C
extern "c" fn take_buffer(buf: #owned Bytes) -> Unit = "take_buffer"

// #external — C 管理生命周期，MoonBit 不追踪
type Handle = #external UInt64
```

## 测试断言

```moonbit
// ✅ 正确（0.9.0+）
debug_inspect(value, content=Some("expected_output"))

// ✅ 使用 Debug trait 而非 Show
derive(Debug, Eq, ToJson)

// ✅ 调试断言
@debug.assert_eq(a, b)
```

## 循环语法

```moonbit
// for..in 带额外循环变量
for x in xs; sum = 0 {
  continue sum + x
} nobreak { sum }

// 无限循环
for ;; { ... }

// 反向 range
for x in 4>..0 { ... }

// 闭合 range
for i in 0..<=10 { ... }
```

## 项目配置（0.10.4+）

```moonbit
// moon.pkg: pkgtype 替代 options
pkgtype(kind: "executable")       // 可执行包
pkgtype(kind: "foreign_library")  // 外部库（C FFI）
pkgtype(kind: "library")          // 库（默认）

// moon.mod 新格式
// name = "namespace/package"
// version = "0.1.0"
// preferred_target = "native"
// source = "src"
```

## 类型转换

```moonbit
// String → Int64
let n = "123".parse_int64().or(0i64)
// String → Int
let i = "42".parse_int().or(0)
// String → Double
let f = "3.14".parse_double().or(0.0)
```

## 反模式

| 反模式 | 问题 | 修复 |
|--------|------|------|
| `pub` 滥用 | API 膨胀 | 默认 private |
| 空 `catch` | 吞错误 | 至少 log |
| `Option[T]` | 冗长 | 用 `T?` |
| String 参数 | 分配 | 用 `StringView` |

## 常见陷阱

| # | 陷阱 | 正确做法 |
|---|------|---------|
| 1 | 变量/函数大写开头 | 变量小写，类型大写 |
| 2 | 忘记 `mut` | 需修改的字段加 `mut` |
| 3 | 滥用 `return` | 最后表达式即返回值 |
| 4 | 方法缺少 `Type::` 前缀 | `fn Type::method(self) { ... }` |
| 5 | 忘记 `@package` 前缀 | `@json.parse(...)` |
| 6 | 使用 `++` / `--` | 用 `i = i + 1` |
| 7 | main 写空参数列表 | `fn main { ... }` |
| 8 | C 风格 for 循环 | `for i in 0..<10 { ... }` |
| 9 | 使用 `await` 关键字 | async 函数直接调用 |
| 10 | 文件路径用于类型路径 | 文件只做组织用 |