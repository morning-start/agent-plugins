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

## 关键模板
- `templates/wasm/moon.mod.json` — 目标: wasm,wasm-gc
- `templates/wasm/moon.pkg.json` — 导入: moonbitlang/core
- `templates/wasm/ffi.mbt` — WASM 内存操作
- `templates/wasm/test.mbt` — WASM 测试

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