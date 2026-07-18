# 架构决策树

## 项目类型 → 架构模式

```
用户输入
    │
    ▼
关键词匹配:
├─ "CLI" "命令行" "工具" "命令"     → cli       → CLI 工具
├─ "FFI" "C 绑定" "extern" "链接"   → c-ffi     → 四层 FFI
├─ "WASM" "WASI" "wasm" "内存"      → wasm      → 四层 FFI (WASM)
├─ "解析" "parser" "TOML" "JSON"    → parser    → 递归下降
├─ "异步" "HTTP" "网络" "socket"    → async     → 异步运行时
├─ "库" "lib" "package" "包"        → lib       → 简单模块
├─ "数据结构" "算法" "集合"          → lib       → 简单模块
└─ 其他                             → 问用户
```

## 各类型详情

### cli — CLI 工具
- 结构: main.mbt (@argparse) + lib.mbt
- 模板: templates/cli/
- 依赖: moonbitlang/core/argparse
- 目标: native-only
- 参考: toml-parser cmd/toml

### c-ffi — C FFI 绑定
- 结构: internal/ffi/ → internal/raw/ → lib.mbt → io/
- 模板: templates/c-ffi/
- 关键: with_closed_* RAII, wrap() 错误转换
- 目标: native-only
- 参考: moonbit-community/miniio

### wasm — WASM 模块
- 结构: internal/ffi/ (extern "wasm") → internal/raw/ → lib.mbt
- 模板: templates/wasm/
- 关键: extern "wasm", Bytes::make 模拟 malloc, moonbit.decref
- 目标: wasm, wasm-gc
- 参考: miniio internal/ffi

### parser — 解析器
- 结构: lexer/ → tokenize/ → parser.mbt → validate
- 关键: 两阶段 parse+validate, 标记状态, 零拷贝 Token View
- 测试: valid/*, invalid/*, edge/*, regression/*
- 参考: bobzhang/toml

### async — 异步 I/O
- 结构: event_loop/ → task/ → io/ → socket/ → http/
- 关键: 双路径 IO (native async + thread pool)
- 依赖: moonbitlang/async
- 目标: native-only
- 参考: moonbitlang/async

### lib — 库
- 结构: lib.mbt + internal/
- 模板: templates/lib/
- 目标: native, wasm, js
- 测试: 单元测试