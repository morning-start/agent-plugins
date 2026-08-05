# MoonBit FFI 绑定模式

## 适用场景
封装 C/C++/JS/Wasm 库，提供 MoonBit 类型安全 API。支持多后端（C、JavaScript、Wasm、Wasm GC）。

## 架构（四层 FFI）
```
L3: Traits — Reader/Writer/Data (模板方法)
L2: 公共 API — 安全封装 + 错误转换
L1: Raw 绑定 — 类型安全包装 + RAII
L0: FFI 原语 — extern "c" / "js" / "wasm" 声明
```

## 目录结构

### C 后端
```
src/
├── wrapper.c         # ABI 归一化 + 内存管理（可选，可用 #borrow 简化）
├── ffi.mbt           # L0: extern "C" 声明
├── raw/              # L1: 类型安全包装
│   ├── moon.pkg
│   └── raw.mbt
├── lib.mbt           # L2: 公共 API
├── io/               # L3: Traits (可选)
│   ├── moon.pkg
│   └── io.mbt
├── moon.pkg          # native-stub / cc-link-flags 配置
├── lib_test.mbt      # 测试
└── README.mbt.md     # 可执行文档
```

### JavaScript 后端
```
src/
├── ffi.mbt           # L0: extern "js" 声明
├── raw/              # L1: 类型安全包装
│   ├── moon.pkg
│   └── raw.mbt
├── lib.mbt           # L2: 公共 API
├── moon.pkg
└── lib_test.mbt
```

### Wasm 后端
```
src/
├── ffi.mbt           # L0: extern "wasm" 声明 / 模块导入
├── raw/              # L1: 类型安全包装
│   ├── moon.pkg
│   └── raw.mbt
├── lib.mbt           # L2: 公共 API
├── moon.pkg
└── lib_test.mbt
```

## 后端选择

MoonBit 目前有五个后端：
- **Wasm** — WebAssembly（含批量内存操作、多值、引用类型提案）
- **Wasm GC** — WebAssembly + 垃圾回收提案（使用引用类型 `struct`/`array`，不默认使用线性内存）
- **JavaScript** — 生成 CommonJS / ES 模块 / IIFE
- **C** — 生成 C 文件并编译为可执行文件或动态/静态库
- **LLVM**（实验性）— 生成对象文件，不支持 FFI

## 文件职责

### 通用
- `ffi.mbt` — 多后端 `extern` 声明、`with_closed_*` RAII 包装
- `raw/` — 类型安全包装层
- `moon.pkg` — 后端特定配置

### C 后端特有
- `wrapper.c` — ABI 归一化层（可选，`#borrow` 可减少胶水代码），需包含 `<stdlib.h>`、`<stdint.h>`
- `moon.pkg` 需 `native-stub` 配置

## 声明外部函数

### C 后端
```moonbit
// 通过函数名导入
extern "C" fn put_char(ch : UInt) -> Unit = "function_name"

// 带 C 链接库配置（moon.pkg）
// options("link": { "native": { "cc-link-flags": "-l<library>" } })
```

### JavaScript 后端
```moonbit
// 通过模块名和函数名导入
fn cos(d : Double) -> Double = "Math" "cos"

// 内联 JavaScript lambda
extern "js" fn cos(d : Double) -> Double =
  #|(d) => Math.cos(d)
```

### Wasm 后端
```moonbit
// 通过模块名和函数名导入
fn cos(d : Double) -> Double = "math" "cos"

// 内联 Wasm 指令
extern "wasm" fn identity(d : Double) -> Double =
  #|(func (param f64) (result f64))
```

## 类型映射

### C 后端 ABI

| MoonBit 类型 | C 类型 |
|-------------|--------|
| `Bool` | `int32_t` |
| `Int` | `int32_t` |
| `UInt` | `uint32_t` |
| `Int64` | `int64_t` |
| `UInt64` | `uint64_t` |
| `Float` | `float` |
| `Double` | `double` |
| 常量 `enum` | `int32_t` |
| 抽象类型 (`type T`) | pointer（必须是有效 MoonBit 对象） |
| 外部类型 (`#external type T`) | `void*` |
| `FixedArray[Byte]`/`Bytes` | `uint8_t*` |
| `FixedArray[T]` | `T*` |
| `FuncRef[T]` | 函数指针 |

### JavaScript 后端 ABI

| MoonBit 类型 | JS 类型 |
|-------------|---------|
| `Bool` | `boolean` |
| `Int` | `number` |
| `UInt` | `number` |
| `Float` | `number` |
| `Double` | `number` |
| 常量 `enum` | `number` |
| 外部类型 (`#external type T`) | `any` |
| `String` | `string` |
| `FixedArray[Byte]`/`Bytes` | `Uint8Array` |
| `FixedArray[T]` / `Array[T]` | `T[]` |
| `FuncRef[T]` | `Function` |

### Wasm 后端 ABI

| MoonBit 类型 | Wasm 类型 |
|-------------|-----------|
| `Bool` | `i32` |
| `Int` | `i32` |
| `UInt` | `i32` |
| `Int64` | `i64` |
| `UInt64` | `i64` |
| `Float` | `f32` |
| `Double` | `f64` |
| 常量 `enum` | `i32` |
| 外部类型 (`#external type T`) | `externref` |
| `FuncRef[T]` | `funcref` |

### Wasm GC 后端 ABI

| MoonBit 类型 | Wasm GC 类型 |
|-------------|-------------|
| `Bool` | `i32` |
| `Int` | `i32` |
| `UInt` | `i32` |
| `Int64` | `i64` |
| `UInt64` | `i64` |
| `Float` | `f32` |
| `Double` | `f64` |
| 常量 `enum` | `i32` |
| 外部类型 (`#external type T`) | `externref` |
| `String` | `externref`（JS string builtins 启用时） |
| `FuncRef[T]` | `funcref` |

## 外部类型

利用 `#external` 属性声明外部类型：

```moonbit
#external
type ExternalRef
```

各后端解释：
- **Wasm / Wasm GC**: `externref`
- **JavaScript**: 任意 JavaScript 值
- **C**: `void*`

## 所有权注解

使用 `#borrow` 和 `#owned` 标记管理引用计数调用约定：

```moonbit
#borrow(filename)
extern "C" fn open(filename : Bytes, flags : Int) -> Int = "open"
```

| 注解 | 含义 | 适用场景 |
|------|------|---------|
| `#borrow` | 被调用者不需要调用 `decref` | 临时传参，只读读取 |
| `#owned` | 所有权转移给外部 | 传递数据给 C 后不再使用 |
| `#external` | 外部管理生命周期，MoonBit 不追踪 | 包装外部分配的对象 |
| `with finalizer` | GC 自动调用释放函数 | 需要自动清理的外部资源 |

### 借用参数的生命周期管理

| 场合 | 操作 |
|------|------|
| 读取字段/元素 | 什么都不做 |
| 存储进数据结构 | 调用 `incref` |
| 作为参数传递给 MoonBit 函数 | 调用 `incref` |
| 传递给其他 C 函数 / `#borrow` MoonBit 函数 | 什么都不做 |
| 作为返回值被返回 | 调用 `incref` |
| 作用域结束（且没有返回） | 什么都不做 |

### 非托管类型（不需要引用计数）

- 内置数字类型（`Int`, `Double` 等）
- 常量枚举（所有构造器都不带参数的枚举）

### 托管类型（需要引用计数）

- `FixedArray[T]`, `Bytes`, `String`
- 抽象类型（`type T`）

## 外部对象 + Finalizer

使用 `moonbit_make_external_object`（C 后端）管理外部对象生命周期：

```c
void *moonbit_make_external_object(
  void (*finalize)(void *self),
  uint32_t payload_size
);
```

MoonBit 侧绑定：

```moonbit
// 声明外部对象类型
type Handle = #external UInt64

// 带 finalizer 的外部对象
type ManagedHandle with finalizer {
  ptr: UInt64
}

// finalizer 实现
fn finalize(handle: ManagedHandle) {
  c_destroy(handle.ptr)
}
```

## 回调模式

### 方式 1: FuncRef（推荐，无捕获函数）
```moonbit
extern "C" fn set_callback(cb: FuncRef[(Int) -> Unit]) -> Unit = "set_callback"
```

### 方式 2: 闭包（有捕获状态）
```moonbit
extern "C" fn set_closure(cb: (Int) -> Unit) -> Unit = "set_closure"
```

### 方式 3: 带 user_data 的回调
```moonbit
extern "C" fn set_callback_with_data(
  cb: FuncRef[(Int, Unit) -> Unit],
  data: #borrow Unit
) -> Unit = "set_callback_with_data"
```

### Wasm 后端回调

回调通过 `externref` 传递。Wasm 模块在 `moonbit:ffi` 下导入 `make_closure` 函数：

```javascript
{
  "moonbit:ffi": {
    "make_closure": (funcref, closure) => funcref.bind(null, closure)
  }
}
```

### C 后端闭包桥接

```moonbit
extern "C" fn register_callback_ffi(
  call_closure : FuncRef[(() -> Unit) -> Unit],
  closure : () -> Unit
) -> Unit = "register_callback"

fn register_callback(callback : () -> Unit) -> Unit {
  register_callback_ffi(
    fn (f) { f() },
    callback
  )
}
```

## 导出函数

```moonbit
// moon.pkg
pkgtype(kind: "foreign_library")
```

```moonbit
#export_name("add")
pub fn add_one(value : Int) -> Int {
  value + 1
}
```

支持后端配置导出：
```json
// moon.pkg options
options(
  "link": {
    "<backend>": {
      "exports": [ "add", "fib:test" ]
    }
  }
)
```

## 自定义常量枚举

```moonbit
enum SpecialNumbers {
  Zero = 0
  One
  Two
  Three
  Ten = 10
  FourtyTwo = 42
}
```

## C 后端配置

```moonbit
// moon.pkg: native-stub 配置
options(
  "native-stub": [ "wrapper" ],
  "link": {
    "native": {
      "cc-link-flags": "-l<library>"
    }
  }
)
```

## 生成决策
- `moon.mod` 定义模块名
- `moon.pkg` 使用 `native-stub` 配置（仅 C 后端）
- 验证目标：`moon check --target native`（C）、`moon check --target js`（JS）、`moon check --target wasm`（Wasm）
- `wrapper.c` 需包含 `#include <stdlib.h>`、`#include <stdint.h>`（仅 C 后端）

## 包类型
```moonbit
// moon.pkg
pkgtype(kind: "foreign_library")  // 用于导出函数
```

## 关键模式
- `with_closed_*` RAII 资源管理
- `wrap()` 层间错误转换
- `#borrow` 减少 C 胶水代码
- `FuncRef[T]` 无捕获回调
- 多后端适配：同一接口可按需提供各后端实现

## 测试策略

FFI 项目测试要点：
- 内存安全测试（C 后端）— alloc/free 对验证
- 多后端覆盖 — 分别在不同目标下验证
- 回调测试 — 验证闭包和 FuncRef 行为
- 外部对象生命周期 — finalizer 是否正确释放

测试文件组织详见 [`references/testing.md`](../testing.md)。

## 参考项目
- moonbit-community/miniio (4 层架构，C FFI)
- moonbitlang/async 的 C FFI 部分
- moonbitlang/x 的标准库绑定
