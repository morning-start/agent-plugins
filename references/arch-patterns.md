# MoonBit 架构模式

> 从真实项目分析中提炼：miniio、core、async、toml-parser。

## 四层 FFI（miniio）

```
L3: Traits — Reader/Writer/Data
L2: 公共 API — 安全封装 + 错误转换
L1: Raw 绑定 — 类型安全 + RAII
L0: FFI 原语 — extern "wasm" 或 extern "c"
```

**适用**: C/WASM FFI 绑定
**参考**: `moonbit-community/miniio` (23 文件, 4 层)

## 递归下降解析器（toml-parser）

```
Text → Lexer → Tokenizer → Parser → AST → Validate → Serialize
```

**适用**: 解析器项目
**参考**: `bobzhang/toml` (34 文件, 745 测试)

## 异步运行时（async）

```
L6: 高层 IO (http/websocket/fs)
L5: 并发原语 (aqueue/semaphore)
L4: 任务系统 (task_group/timer)
L3: IO 抽象 (Reader/Writer trait)
L2: Event Loop (epoll/kqueue/IOCP)
L1: 协程运行时 (Coroutine/Scheduler)
L0: 语言原语 (%async.suspend)
```

**适用**: 异步 I/O 项目
**参考**: `moonbitlang/async`

## 选择指南

| 项目类型 | 推荐模式 | 关键文件 |
|---------|---------|---------|
| parser | 递归下降 | tokenize/, parser.mbt, validate |
| c-ffi | 四层 FFI | internal/ffi, internal/raw, wrapper.c |
| async-io | 异步运行时 | event_loop, task, io/ |
| cli-tool | CLI 工具 | main.mbt (@argparse) |
| pure-moonbit | 简单模块 | lib.mbt, internal/ |