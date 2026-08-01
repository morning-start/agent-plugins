# 异步编程模式

## 适用场景
网络服务、HTTP 客户端/服务器、文件 I/O、定时任务、并发工作流、需要结构化并发的项目。

## 概述
MoonBit 采用基于协程的异步编程模型（类似 Kotlin 协程），由**编译器内置的 `async` 函数支持**和**官方运行时 `moonbitlang/async`** 两部分组成。

当前后端支持：
- **native** — 完全支持，含高性能 IO 事件循环（epoll/kqueue/IOCP）
- **JavaScript** — 基础支持（IO 无关 API 可用，IO 操作需通过 `js_async` 桥接 Promise）
- **Wasm1** — 实验性支持（v0.20.2 新增，需最新 `moonrun`）

## 依赖配置

```bash
moon add moonbitlang/async@0.20.2
```

```moonbit
// moon.pkg
import "moonbitlang/async"
```

```toml
// moon.mod（可选，推荐 native 后端）
preferred_target = "native"
```

## 核心概念

### 1. 异步函数（Async Function）

使用 `async fn` 关键字定义。异步函数隐式抛出错误，函数体内可直接调用其他异步函数（类似其他语言的 `await`）：

```moonbit
async fn my_async_function() -> String {
  let (response, body) = @http.get("https://www.moonbitlang.cn")
  guard response.code is (200..<300) else {
    fail("server responded with \{response.code} \{response.reason}")
  }
  body.text()
}
```

关键规则：
- 异步函数只能在异步函数中被调用
- 调用 `async` 函数会使调用者阻塞并等待返回（等价于 `await`）
- 无错误抛出的异步函数需声明 `noraise`
- 编译器会静态跟踪异步函数调用，IDE 中以斜体+下划线高亮显示

### 2. 结构化并发与任务组（Task Group）

`moonbitlang/async` 采用**结构化并发**范式管理多个并发任务。核心 API 为 `@async.with_task_group`：

```moonbit
async fn[Result] with_task_group(
  f : async (@async.TaskGroup[Result]) -> Result,
) -> Result
```

**关键规则**：只有当任务组中所有任务都结束后，`with_task_group` 才会返回。如果因错误需要提前结束，会自动取消所有仍在运行的任务，确保**不会产生孤儿任务**。

**示例：同时运行多个任务**

```moonbit
async test "with_task_group" {
  let log = []
  @async.with_task_group(group => {
    group.spawn_bg(() => {
      for _ in 0..<3 {
        log.push("task #1 tick")
        @async.sleep(200) // sleep for 200ms
      }
    })
    group.spawn_bg(() => {
      @async.sleep(100)
      for _ in 0..<3 {
        log.push("task #2 tick")
        @async.sleep(200)
      }
    })
  })
  json_inspect(log, content=[
    "task #1 tick", "task #2 tick", "task #1 tick", "task #2 tick", "task #1 tick",
    "task #2 tick",
  ])
}
```

主要方法：

| 方法 | 作用 |
|------|------|
| `group.spawn_bg(f)` | 在后台创建并运行新任务 |
| `group.spawn_bg(no_wait=true, f)` | 后台任务，不等待其完成 |
| `@async.sleep(ms)` | 让当前任务休眠指定毫秒数 |

### 3. 超时控制（Timeout）

使用 `@async.with_timeout` 为异步操作添加超时限制。利用了结构化并发和取消机制：

```moonbit
async fn make_request() -> String {
  @async.with_timeout(1000, () => {
    let (response, body) = @http.get("https://www.moonbitlang.com")
    guard response.code is (200..<300) else {
      fail("the HTTP request is not successful")
    }
    body.text()
  })
}
```

自定义超时实现（展示结构化并发威力）：

```moonbit
async fn with_timeout(timeout : Int, f : async () -> Unit) -> Unit {
  @async.with_task_group(group => {
    group.spawn_bg(no_wait=true, () => {
      @async.sleep(timeout)
      raise Failure::Failure("timeout!")
    })
    f()
  })
}
```

边界行为保证：
- `f` 正常返回 → 计时任务被自动取消，`with_timeout` 立即返回
- `f` 失败 → 计时任务被自动取消，错误传播
- 超时发生 → `f` 被自动取消，无资源泄漏

### 4. 重试机制（Retry）

```moonbit
async fn make_request() -> String {
  @async.retry(Immediate, max_retry=3, () => {
    @async.with_timeout(1000, () => {
      let (response, body) = @http.get("https://www.moonbitlang.com")
      guard response.code is (200..<300) else {
        fail("the HTTP request is not successful")
      }
      body.text()
    })
  })
}
```

### 5. 取消机制（Cancellation）

所有异步操作默认都是**可取消的**。取消信号会以错误的形式从代码中断处抛出，自动通过错误处理机制传播：

- 取消会触发 `defer` 表达式中的清理代码
- 取消会触发 `catch` 中的错误处理
- 取消保护：`protect_from_cancel` 可保护关键代码段不被取消

取消机制是模块化的基础——超时、重试等辅助函数都依赖于取消机制。

### 6. 异步入口点

```moonbit
// 异步 main 函数
async fn main {
  // ...
}

// 异步测试（多个 async test 可并行运行）
async test "my async test" {
  // ...
}
```

需要在 `moon.pkg` 中添加 `moonbitlang/async` 依赖。

## 异步 IO 操作

`moonbitlang/async` 提供丰富的异步 IO 操作（native 后端完全支持）：

### HTTP/HTTPS
```moonbit
let (response, body) = @http.get("https://api.example.com")
let (response, body) = @http.get_stream("https://stream.example.com") // 流式
```

### 文件 IO
```moonbit
async fn download_file(url : String, file_name : String) -> Unit {
  let (_response, body) = @http.get_stream(url)
  defer body.close()
  let out_file = @fs.create(file_name, permission=0o644)
  defer out_file.close()
  out_file.write_reader(body)
}
```

### 网络 IO 与外部进程
- 网络 IO：TCP/UDP socket
- 外部进程：创建和管理子进程

### 完整 API
查阅 [mooncakes.io](https://mooncakes.io/docs/moonbitlang/async) 获取完整包列表和 API 文档。

## 架构（7 层异步运行时）

```
L6: 高层 IO — http, websocket, fs, socket, tls
L5: 并发原语 — aqueue, semaphore, cond_var, pipe
L4: 任务系统 — task_group, task, timer, retry, with_timeout
L3: IO 抽象 — Reader, Writer, BufferedReader, Data
L2: Event Loop — epoll/kqueue/IOCP (平台边界)
L1: 协程运行时 — Coroutine, Scheduler, suspend/wake/cancel
L0: 语言原语 — async fn, %async.suspend, %async.run
```

## JavaScript 后端支持

- IO 无关 API（任务组、超时等）可用
- IO 相关 API 不可用（浏览器等环境不原生支持）
- 通过 `moonbitlang/async/js_async` 与 JavaScript Promise 互操作：

```moonbit
// 等待一个 JavaScript Promise
wait_js_promise(promise)

// 将 MoonBit async 函数包装为 JavaScript Promise
wrap_async_to_js_promise(fn)
```

## 测试策略

- 使用 `async test` 编写异步测试（自动并行运行）
- 协程测试（spawn, await）
- 超时测试（`with_timeout` 边界验证）
- 取消安全测试（任务组在错误/超时下是否正确清理）
- 验证命令：`moon test --target native`

## 关键模式

| 模式 | 描述 |
|------|------|
| **结构化并发** | 任务组确保所有任务完成后才返回，无孤儿任务 |
| **双路径 IO** | native async (epoll/kqueue) + thread pool（文件操作） |
| **取消保护** | `protect_from_cancel` 保护关键代码段 |
| **错误传播型取消** | `close(error?)` 广播错误到所有子任务 |
| **超时组合** | `with_timeout` + `retry` 构建健壮的网络客户端 |
| **流式处理** | `get_stream` + `write_reader` 节省内存 |

## 参考项目
- moonbitlang/async（核心运行时 + 示例）
- mooncakes.io 上的 `moonbitlang/async` 文档

## 依赖

- `moonbitlang/async` — 核心异步运行时
- `moonbitlang/core` — 标准库
