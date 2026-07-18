# MoonBit 惯用写法

## 类型

```moonbit
// ✅ 用 T? 而不是 Option[T]
fn find(id: Int) -> User?

// ✅ Result 用于可恢复错误
pub fn parse(input: StringView) -> Result[Ast, ParseError]

// ✅ suberror 用于不可恢复错误
pub(all) suberror IoError { NotFound | PermissionDenied } derive(Show, Eq)
```

## 字符串

```moonbit
// ✅ 用 StringView 参数（零拷贝）
pub fn parse(input: StringView) -> Result[Ast, ParseError]

// ✅ 用 StringBuilder 构建
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