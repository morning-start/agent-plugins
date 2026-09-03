# MoonBit 反模式与常见陷阱

> 正确写法见 [`idioms.md`](./idioms.md)。

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
| 2 | `mut` 用于 push/mutate | `mut` 仅在变量重新赋值时需要，push 不需要 |
| 3 | 滥用 `return` | 最后表达式即返回值 |
| 4 | 方法缺少 `Type::` 前缀 | `fn Type::method(self) { ... }` |
| 5 | 忘记 `@package` 前缀 | `@json.parse(...)` |
| 6 | 使用 `++` / `--` | 用 `i = i + 1` |
| 7 | main 写空参数列表 | `fn main { ... }` |
| 8 | C 风格 for 循环 | `for i in 0..<10 { ... }` |
| 9 | 使用 `await` 关键字 | async 函数直接调用 |
| 10 | 文件路径用于类型路径 | 文件只做组织用 |
| 11 | `String[i]` 当 Char | 返回 `UInt16`（编码点数值），需 `Char::from_int(s[i].to_int())` |
| 12 | `to_string()` 转 StringView | 废弃，用 `to_owned()` |
| 13 | `split` 返回 Array | 返回 `Iter[StringView]`，需 `.to_array()` 后索引 |
| 14 | `split` 用 Char 参数 | 参数类型是 `String`，用 `"\n"` 而非 `'\n'` |
| 15 | Tuple2 用 `._0`/`._1` | 必须模式匹配：`match t { (k, v) => ... }` |
| 16 | `for (k,v) in map` 解构 | `for` 不支持元组解构，用 `for entry in map { match entry { (k,v) => ... } }` |
| 17 | `match` 嵌套在 `+` 中 | 先提取变量再拼接：`let part = match ... { ... }` |
| 18 | `@json.parse(s).unwrap()` | `@json.parse` 返回 `Json` 不是 `Result`，直接使用 |
| 19 | 同名枚举构造器歧义 | 用 `Type::Variant` 显式消歧 |
| 20 | 白盒测试用短名跨包类型 | 需加包前缀：`@pkg.Type::method(...)` |
| 21 | `Buffer::new(size_hint=100)` | 用 `Buffer(size_hint=100)` 字面量构造 |
| 22 | `String` 方法不存在 | 很多常用方法（`startsWith`/`indexOf`/`replace`）不存在，需查 API |
