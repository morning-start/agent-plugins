# MoonBit 惯用写法

## 类型

```moonbit
// ✅ 用 T? 而不是 Option[T]
fn find(id: Int) -> User?

// ✅ Result 用于可恢复错误
pub fn parse(input: StringView) -> Result[Ast, ParseError]

// ✅ suberror 用于不可恢复错误（0.8.0+ 语法）
pub(all) suberror IoError {
  NotFound
  PermissionDenied
} derive(Debug, Eq)
// suberror IoError { NotFound | PermissionDenied }  // 也支持行内语法
// suberror IoError NotFound | PermissionDenied       // ❌ 0.8.0 前语法，已废弃

// ✅ Debug 替代 Show（0.9.0+）
derive(Debug, Eq, ToJson)
// derive(Show, Eq, ToJson)  // ❌ 已废弃
```

## 字符串

```moonbit
// ✅ 用 StringView 参数（零拷贝）
pub fn parse(input: StringView) -> Result[Ast, ParseError]

// ✅ 用 StringBuilder 构建 + 模板写入（0.10.0+）
let buf = StringBuilder()
buf <+ "Hello, \{name}!"
buf.to_string()

// ✅ 旧写法 still valid
let mut sb = StringBuilder::new()
sb.write_string("Hello, ")
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
fn[X] with_file(file: File, work: (File) -> X raise Error) -> X raise Error {
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

## 重构模式

```moonbit
// 函数转方法 + 向后兼容
#as_free_fn(reader_next, deprecated="Use Reader::next instead")
fn Reader::next(self : Reader) -> Char? { ... }

// 保持向后兼容的重命名
#alias(old_api, deprecated)
```

## 工具链模式

```bash
# 语义导航（比 grep 更精确）
moon ide find-references <symbol>
moon ide rename <symbol> <new_name>
moon ide outline
moon ide peek-def <symbol>

# 精确测试
moon test [dirname|filename] --filter 'glob'
moon test --update  # 更新快照
```

## 反模式

| 反模式 | 问题 | 修复 |
|--------|------|------|
| `pub` 滥用 | API 膨胀 | 默认 private |
| 空 `catch` | 吞错误 | 至少 log |
| `Option[T]` | 冗长 | 用 `T?` |
| String 参数 | 分配 | 用 `StringView` |

## 常见陷阱（Common Pitfalls）

> 来源: `moonbit-agent-guide` + MoonBit 更新日志

| # | 陷阱 | 说明 | 正确做法 |
|---|------|------|---------|
| 1 | 变量/函数大写开头 | 编译错误 | 变量/函数用小写，类型用大写 |
| 2 | 忘记 `mut` | 结构体字段默认不可变 | 需要修改的字段加 `mut` |
| 3 | 忽略错误处理 | 错误被静默吞掉 | 要么声明 `raise` 传播，要么 `catch` 处理 |
| 4 | 滥用 `return` | 冗余 | 最后一个表达式就是返回值，不需要 `return` |
| 5 | 方法缺少 `Type::` 前缀 | 语法错误 | 方法定义: `fn Type::method(self) { ... }` |
| 6 | 数组越界 | 运行时 panic | 用 `get()` 安全访问 |
| 7 | 忘记 `@package` 前缀 | 调用其他包的函数/类型时 | `@json.parse(...)` 而非 `parse(...)` |
| 8 | 使用 `++` / `--` | 不支持 | 用 `i = i + 1` 或 `i += 1` |
| 9 | 显式 `try` 标记 | MoonBit 不需要 | 在 `raise` 函数中正常调用即可传播 |
| 10 | `main` 写空参数列表 | `fn main() { ... }` 错误 | 用 `fn main { ... }` 或 `fn main raise { ... }` |
| 11 | 枚举构造器字段语法错误 | 用 `:` 而非 `~` | 用 `label~ : Type` 语法 |
| 12 | C 风格 for 循环 | MoonBit 不支持 | 用 `for i in 0..<(n-1) { ... }` |
| 13 | `derive(Show)` 用于调试 | Show 是用户输出（0.9.0+ 废弃） | 用 `derive(Debug)` + `debug_inspect()` |
| 14 | 调用 `@json.inspect()` | 包前缀多余 | 直接用 `json_inspect(value, ...)` |
| 15 | 给 async 函数加 `raise` | async 默认可以 raise | 不要加 `raise`，除非要限制为 `noraise` |
| 16 | 使用 `await` 关键字 | MoonBit 没有 | async 函数直接调用，不需要 await |
| 17 | 用 `for { ... }` 做无限循环 | 0.8.0 起废弃 | 用 `for ;; { ... }` |
| 18 | 文件路径用于类型路径 | 文件名不创建命名空间 | 文件只做组织用，类型路径用 `@package.Type` |
| 19 | 用 `inspect()` 替代 `debug_inspect()` | 0.9.0+ 废弃 | 用 `debug_inspect(value, content=...)` |
| 20 | 使用 `assert_eq()` | 0.8.0+ 废弃 | 用 `@debug.assert_eq(a, b)` |
| 21 | 使用 `moon.mod.json`/`moon.pkg.json` | 下版本移除 | 用 `moon.mod`/`moon.pkg`，`moon fmt` 自动迁移 |
| 22 | 忘记 `fn` 关键字在 `trait`/`impl` 中 | 0.10.0+ 需要 | 用 `trait I { fn f(Self) }` + `impl I for T with fn f(_) {}` |
| 23 | 使用 `options("is-main": true)` | 0.10.4+ 废弃 | 用 `pkgtype(kind: "executable")` |
| 24 | 使用 `options("native-stub": [...])` | 0.10.4+ 废弃 | 用 `pkgtype(kind: "foreign_library")` |
| 25 | 使用 `for { ... }` 替代 `for ;; { ... }` | 0.8.0+ 废弃 | 用 `for ;; { ... }` 或 `while true { ... }` |
| 26 | 使用 `x..=y` 范围语法 | 0.8.0+ 废弃 | 用 `x..<=y` |