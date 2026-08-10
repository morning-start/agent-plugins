---
name: moonbit-perform
description: "Use ONLY in a MoonBit project (moon.mod / *.mbt present); do NOT use outside one. Use when optimizing performance, benchmarking, or analyzing bottlenecks — after implementation is functionally correct. Triggered by 'optimize performance', 'benchmark', 'profile', '性能优化', '性能瓶颈', '测量', '基线对比'. Do NOT use for functional implementation."
---

# Perform — 性能优化

## 职责

性能测量、瓶颈分析、优化实现、回归验证。**独立迭代循环，不改变功能行为，只改变性能特性。**

## The Iron Law

```
NO OPTIMIZATION WITHOUT MEASUREMENT
```

所有优化决策必须有测量数据支撑。无基线的优化无法验证，是噪声。

### 可机械化自检

- [ ] 已建立性能基线（before 测量值）
- [ ] 已定位具体瓶颈（不是"感觉慢"）
- [ ] 优化方案有数据支撑（不是凭直觉）
- [ ] 优化后有对比测量（after vs before）
- [ ] 功能测试仍全绿（无回归）

## Red Flags — STOP and Re-evaluate

- 无测量数据就"优化"（"这段代码看起来慢"）
- 单次测量（受系统噪声影响）
- 微基准神话（隔离环境的"快 3 倍"）
- 优化不可观察行为（编译器已自动处理的代码）
- 优化引入功能回归（越过边界到 implement）
- WASM 性能比较作为 native 依据

## 停止条件

- 性能目标达成（对比基线有可测量改进）→ 进入 verify 确认无回归
- 优化无收益（多次迭代后无改善）→ 报告瓶颈性质，建议接受现状或回到 plan
- 瓶颈是架构问题（局部优化无效）→ 触发设计回溯，回到 plan
- 优化引入功能回归 → 立即回滚，回到 implement 修复功能

## 性能优化循环

```
┌─ MEASURE:    建立基线 → moon test -f "bench_" / time moon run .
│              （消费 references/patterns/performance.md 的测量手段）
├─ ANALYZE:    定位瓶颈 → 内联计时 + inspect! 输出中间状态
├─ OPTIMIZE:   改进实现 → 修改代码（不改变功能行为）
├─ RE-MEASURE: 对比验证 → diff before.txt after.txt
├─ DOC:        配置/参数/行为变更 → 同步更新配置文档或使用说明
└─ 循环:       有改进 → 继续；无改进 → 停止条件
```

## 测量手段（摘要）

详见 [`references/patterns/performance.md`](../../references/patterns/performance.md)。

| 手段 | 粒度 | 适用场景 |
|---|---|---|
| 系统级计时（time moon run .） | 粗 | 端到端耗时 |
| moon test -v | 中 | 测试级耗时分布 |
| 内联计时（@time.now()） | 细 | 阶段级耗时 |
| inspect! 输出 | 精细 | 集合大小、分配计数 |

## MoonBit 性能注意事项（摘要）

详见 [`references/patterns/performance.md`](../../references/patterns/performance.md)。

- 值类型 vs 引用类型：struct 值语义，enum/String/Array/Map 引用类型
- 闭包捕获引入隐式堆分配，热路径慎用
- String 拼接是常见瓶颈，大量拼接用 StringBuilder
- 错误处理无栈展开开销，但避免热循环频繁构造 Result::Err

## 与 implement 的契约

- perform 在 implement 之后（功能正确为前提）
- perform 不改变功能行为，只改变性能特性
- perform 修改的代码需通过 testing 产出的测试确认无回归
- 若优化需改变 API → 触发设计回溯，回到 plan

## 与 verify 的契约

- perform 产出的优化需通过 verify 确认无回归
- verify S3 提供粗粒度性能信号（测试执行时间）
- perform 的 bench 基线不纳入硬性门禁（避免环境噪声误报）

## 与 code-review 的契约

- perform 产出的变更由 code-review 审查性能改进有效性
- code-review 检查是否有"过早优化"反模式

## 与 refactor 的契约

- perform 优化后若引入技术债务（内联展开、为速度牺牲可读性）→ 调用 `moonbit-refactor` 清理
- perform 不负责代码可读性改善（不越界到 refactor）
- refactor 重构后若影响热路径性能 → 调用 `moonbit-perform` 重新测量
- 两者共享"不改变可观察行为"约束，但关注点不同：perform 关注性能特性，refactor 关注内部结构

## 用户 vs Agent 分工

| 谁 | 做什么 |
|---|---|
| Agent | 建立基线、定位瓶颈、实施优化、对比验证 |
| 用户 | 确认性能目标、判断优化收益是否值得、决定是否接受架构变更 |

## 输出

```json
{
  "status": "optimized | no_gain | blocked",
  "baseline": { "scenario": "bench_sort", "before_ms": 120 },
  "after": { "scenario": "bench_sort", "after_ms": 85 },
  "improvement": "29%",
  "bottleneck": "String 拼接在循环中",
  "optimization": "改用 StringBuilder",
  "regression": false,
  "next": "verify | plan | implement"
}
```

## 错误恢复

| 问题 | 诊断 | 修复 |
|---|---|---|
| 无测量数据 | 跳过 MEASURE 阶段 | 回到 MEASURE，建立基线 |
| 单次测量噪声大 | 只测一次 | 至少 5-10 次取最小值 |
| 微基准不反映真实 | 隔离环境测得"快 3 倍" | 结合实际场景验证 |
| 优化无收益 | 多次迭代后无改善 | 报告瓶颈性质，建议接受或回到 plan |
| 瓶颈是架构问题 | 局部优化无效 | 触发设计回溯，回到 plan |
| 优化引入回归 | 功能测试失败 | 立即回滚，回到 implement 修复 |

## 下一步

性能优化完成后，进入 `moonbit-verify` 确认无回归。若瓶颈是架构问题，触发设计回溯回到 `moonbit-plan`。
