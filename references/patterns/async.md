# 异步 I/O 模式

## 适用场景
网络服务、HTTP 服务器、文件系统监控、需要并发 I/O 的项目。

## 架构（7 层异步运行时）
```
L6: 高层 IO — http, websocket, fs, socket, tls
L5: 并发原语 — aqueue, semaphore, cond_var, pipe
L4: 任务系统 — task_group, task, timer, retry, with_timeout
L3: IO 抽象 — Reader, Writer, BufferedReader, Data
L2: Event Loop — epoll/kqueue/IOCP (平台边界)
L1: 协程运行时 — Coroutine, Scheduler, suspend/wake/cancel
L0: 语言原语 — %async.suspend, %async.run
```

## 关键依赖
- `moonbitlang/async` — 核心运行时
- `moonbitlang/core` — 标准库

## 测试策略
- 协程测试（spawn, await）
- 超时测试
- 取消安全测试
- `moon test --target native` 为主（WASM 不支持异步）

## 关键模式
- 双路径 IO: native async (epoll/kqueue) + thread pool (文件操作)
- 取消保护: `protect_from_cancel`
- 错误传播型取消: `close(error?)` 广播错误

## 参考项目
- moonbitlang/async (297 文件, 37000 行)