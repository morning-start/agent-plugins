# 可观测性设计参考

> **阶段 A** — MoonBit 运行时可观测性工具链尚未成熟，此文档作为知识库承载结构化日志、指标埋点和追踪设计的模式参考。待生态就绪后升级为 `moonbit-observe` 技能。

## 铁律（阶段 A 建议）

```
NO BLIND DEPLOYMENTS
```

任何部署到生产环境的 MoonBit 项目，必须在设计阶段就确定可观测性策略。没有日志、指标或追踪的生产部署是不可运维的。

## 可观测性三本柱

### 1. 结构化日志（Logging）

**原则**：日志是事件的记录，不是调试输出。每条日志应可独立理解上下文。

| 要素 | 说明 | MoonBit 现状 |
|------|------|-------------|
| 日志级别 | error / warn / info / debug | MoonBit 尚无标准日志库；可用 `println()` 加前缀模拟 |
| 结构化字段 | JSON 格式的 key=value 对 | 手动拼接 `"key={value}"` 格式 |
| 上下文传递 | 请求 ID / 会话 ID 贯穿链路 | 手动在函数参数中传递 trace_id |
| 采样策略 | error 全量，debug 按需 | 可通过环境变量或编译时 flag 控制 |

**推荐模式（等日志库就绪前）：**

```moonbit
/// 模拟结构化日志（供阶段 A 过渡使用）
pub fn log_info(module : String, msg : String, ctx : Map[String, String]) -> Unit {
  let ts = @time.now().to_string()
  let ctx_str = ctx.iter().map(fn(k, v) { "{k}={v}" }).to_array().join(",")
  println("[info] {ts} [{module}] {msg} {ctx_str}")
}
```

**最佳实践：**
- 所有 `suberror` 和 `Result.Error` 路径必须记录 error 级别日志
- 启动和关闭记录明确的生命周期事件
- 不记录敏感信息（密码、token、个人数据）
- 日志输出到 stdout/stderr，由运行环境负责采集

### 2. 指标（Metrics）

**原则**：指标是聚合后的数值，反映系统健康状态。

| 指标类型 | 说明 | MoonBit 应用 |
|---------|------|-------------|
| **Counter** | 单调递增计数 | 请求总数、错误总数 |
| **Gauge** | 可增可减的瞬时值 | 连接数、队列深度 |
| **Histogram** | 值分布统计 | 响应时间、请求大小 |

**埋点模式（阶段 A 用 Print/文件输出过渡）：**

```moonbit
/// 简单 Counter 实现（阶段 A 过渡）
struct Counter {
  mut val : Int
}

pub fn counter_inc(c : Counter, n : Int) -> Unit {
  c.val = c.val + n
}

pub fn counter_snapshot(prefix : String, name : String, c : Counter) -> Unit {
  // 输出到 stdout，由外部采集器解析
  println("METRIC {prefix}:{name} = {c.val}")
}
```

**最佳实践：**
- 至少采集 RED 指标：Rate（请求率）、Errors（错误率）、Duration（延迟分布）
- 指标命名统一：`{namespace}_{name}_{unit}`（如 `http_request_total_count`）
- 所有 Counter 的标签维度保持一致

### 3. 分布式追踪（Tracing）

**原则**：追踪记录请求在分布式系统中的完整路径。

| 概念 | 说明 |
|------|------|
| **Trace** | 一次请求的完整生命期，由唯一 TraceID 标识 |
| **Span** | Trace 中的一个操作单元，包含开始/结束时间、状态、标签 |
| **SpanContext** | 在 Span 间传递的上下文（TraceID + SpanID） |

**追踪模式（阶段 A 可提前在 API 设计预留）：**

```moonbit
/// 追踪上下文（API 设计时预留）
struct SpanContext {
  trace_id : String
  span_id : String
  parent_span_id : String
}

/// 函数签名预留 trace 参数示例
pub fn handle_request(req : Request, trace : SpanContext) -> Response {
  // 实现逻辑...
}
```

**最佳实践：**
- API 设计时预留 `trace_id : String` 参数，工具链就绪后直接对接
- 每个外部调用（FFI、网络请求）创建子 Span
- 错误 Span 必须记录错误信息

## 项目类型与可观测性需求

| 项目类型 | 推荐可观测性策略 |
|---------|----------------|
| **lib** | 库本身不直接输出可观测数据；但 API 设计应预留 trace_id 参数 |
| **cli** | 结构化日志（事件驱动输出）+ 可选进度指标；`--verbose` 和 `--json-logs` 参数 |
| **wasm** | 结构化日志（通过宿主环境输出的 console/trace）；指标通过宿主 API 暴露 |
| **ffi** | 随宿主语言的可观测性策略走；MoonBit 层记录结构化日志 |
| **parser** | 输入大小、解析耗时指标；失败的输入样本日志 |
| **async** | 关键路径追踪（每个 await 点记录耗时）；goroutine/协程池指标 |

## 工具链就绪检查清单

以下条件满足后，将 `references/patterns/observability.md` 升级为 `skills/observe/SKILL.md`：

- [ ] MoonBit 出现官方或社区标准的日志库（支持级别、结构化输出）
- [ ] 出现 Prometheus / OpenTelemetry 兼容的指标导出库
- [ ] 出现 Span 创建和传播的追踪支持
- [ ] 上述库在 MoonBit 工具链中稳定运行（非 alpha）

## 与其它技能的关系

| 技能 | 关系 |
|------|------|
| `moonbit-perform` | perform 是开发期性能优化；observe 是运行时可观测性设计 |
| `moonbit-cd` | CD 提供部署；observe 监控部署后的运行状态 |
| `moonbit-learn` | 事故触发 learn 的 RCA 模式；可观测数据是 RCA 的输入来源 |
