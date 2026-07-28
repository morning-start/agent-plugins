# C FFI 绑定模式

## 适用场景
封装 C/C++ 库，提供 MoonBit 类型安全 API。

## 架构（四层 FFI）
```
L3: Traits — Reader/Writer/Data (模板方法)
L2: 公共 API — 安全封装 + 错误转换
L1: Raw 绑定 — 类型安全包装 + RAII
L0: FFI 原语 — extern "c" 声明
```

## 目录结构
```
src/
├── wrapper.c         # ABI 归一化 + 内存管理
├── ffi.mbt           # L0: extern "c" 声明
├── raw/              # L1: 类型安全包装
│   ├── moon.pkg
│   └── raw.mbt
├── lib.mbt           # L2: 公共 API
├── io/               # L3: Traits (可选)
│   ├── moon.pkg
│   └── io.mbt
├── moon.pkg          # native-stub 配置
├── lib_test.mbt      # 测试
├── README.mbt.md     # 可执行文档
└── scripts/
    └── prepare.py    # 供应商脚本
```

## 目录结构
```
src/
├── wrapper.c         # ABI 归一化 + 内存管理
├── ffi.mbt           # L0: extern "c" 声明
├── raw/              # L1: 类型安全包装
│   ├── moon.pkg
│   └── raw.mbt
├── lib.mbt           # L2: 公共 API
├── io/               # L3: Traits (可选)
│   ├── moon.pkg
│   └── io.mbt
├── moon.pkg          # native-stub 配置
├── lib_test.mbt      # 测试
├── README.mbt.md     # 可执行文档
└── scripts/
    └── prepare.py    # 供应商脚本
```

## 文件职责
- `wrapper.c` — ABI 归一化层，需包含 `<stdlib.h>`、`<stdint.h>`
- `ffi.mbt` — `extern "c"` 声明、`with_closed_*` RAII 包装
- `raw/` — 类型安全包装层
- `moon.pkg` — `native-stub` 配置

## 生成决策
- `moon.mod` 定义模块名
- `moon.pkg` 使用 `native-stub` 配置
- 目标 `native-only`：`moon check --target native`
- 必须包含 `wrapper.c`（含 `#include <stdlib.h>`）

## 测试策略
- ASan 验证（Address Sanitizer）
- 内存泄漏检查
- 边界值测试
- `moon test --target native`

## 关键模式
- `with_closed_*` RAII 资源管理
- `wrap()` 层间错误转换
- `malloc → defer free` 手动内存管理
- 类型宽度编译期断言

## 回调模式（Callback）

> 来源: `moonbit-c-binding`

C 回调函数需要桥接到 MoonBit：

```moonbit
// 方式 1: 使用 FuncRef（推荐）
extern "c" fn set_callback(cb: FuncRef[(Int) -> Unit]) -> Unit = "set_callback"

// 方式 2: 使用闭包
extern "c" fn set_closure(cb: (Int) -> Unit) -> Unit = "set_closure"

// 方式 3: 带状态的回调（通过 user_data）
extern "c" fn set_callback_with_data(
  cb: FuncRef[(Int, Unit) -> Unit],
  data: #borrow Unit
) -> Unit = "set_callback_with_data"
```

**C 侧对应:**

```c
// 方式 1: FuncRef 是函数指针
typedef void (*callback_t)(int32_t);
MOONBIT_FFI_EXPORT void set_callback(callback_t cb) {
  cb(42);
}

// 方式 3: 带 user_data
typedef void (*callback_data_t)(int32_t, void*);
MOONBIT_FFI_EXPORT void set_callback_with_data(
  callback_data_t cb, void *data) {
  cb(42, data);
}
```

## 外部对象 + Finalizer

> 来源: `moonbit-c-binding`

C 句柄包装为 MoonBit 对象，由 GC 自动清理：

```moonbit
// 声明外部对象类型
type Handle = #external UInt64

// 创建包装对象
pub fn wrap_handle(ptr: UInt64) -> Handle {
  // MoonBit 不追踪此对象的生命周期
  Handle(ptr)
}

// 带 finalizer 的外部对象
type ManagedHandle with finalizer {
  ptr: UInt64
}

// 创建托管对象（GC 自动释放）
pub fn create_managed() -> ManagedHandle {
  let raw = c_create()
  let handle = ManagedHandle { ptr: raw }
  // 注册 finalizer: GC 回收时自动调用 c_destroy
  handle
}

// finalizer 实现
fn finalize(handle: ManagedHandle) {
  c_destroy(handle.ptr)
}
```

**所有权注解总结:**

| 注解 | 含义 | 适用场景 |
|------|------|---------|
| `#borrow` | C 不持有引用，MoonBit GC 管理 | 临时传参给 C 处理 |
| `#owned` | 所有权转移给 C | 传递数据给 C 后不再使用 |
| `#external` | C 管理生命周期，MoonBit 不追踪 | 包装 C 分配的对象 |
| `with finalizer` | GC 自动调用释放函数 | 需要自动清理的 C 资源 |

## 参考项目
- moonbit-community/miniio (23 文件, 4 层架构)
- moonbitlang/async 的 C FFI 部分