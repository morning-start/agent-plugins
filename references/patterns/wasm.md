# WASM 模块模式

## 适用场景
WASM/WASI 模块，需要与 WASM 线性内存交互。

## 架构（四层 FFI WASM 版）
```
L3: Traits — Reader/Writer/Data
L2: 公共 API — 安全封装 + 错误转换
L1: Raw 绑定 — 类型安全包装 + RAII
L0: FFI 原语 — extern "wasm" 内联指令
```

## 目录结构
```
src/
├── internal/
│   ├── ffi/          # L0: 内联 WASM 指令
│   │   ├── moon.pkg
│   │   └── top.mbt   # store32, load32, malloc, free
│   ├── raw/          # L1: WASI 绑定
│   │   ├── moon.pkg
│   │   └── raw.mbt
│   └── moon.pkg
├── lib.mbt           # L2: 公共 API
├── moon.pkg          # 包配置
├── lib_test.mbt      # 测试
└── README.mbt.md     # 可执行文档
```

## 文件职责
- `internal/ffi/top.mbt` — `extern "wasm"` 内联指令如 `store32`、`load32`
- `internal/raw/` — WASI 绑定
- `moon.pkg` — 目标配置 `wasm, wasm-gc`

## 生成决策
- `moon.mod` 定义模块名
- `moon.pkg` 配置目标为 `wasm, wasm-gc`
- `moon check --target wasm` + `moon check --target wasm-gc` 双路验证
- 使用 `extern "wasm"` 内联语法，`Bytes::make` 模拟 malloc

## 测试策略
- `moon test --target wasm` 为主
- WASM 运行时测试（wasmtime 等）
- 内存泄漏检查

## 关键模式
- `extern "wasm"` 内联语法
- `Bytes::make` 模拟 malloc
- `moonbit.decref` 手动释放
- `malloc → defer free` 模式

## 参考项目
- moonbit-community/miniio internal/ffi (52 行, 8 函数)