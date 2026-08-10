---
name: moonbit-refactor
description: "Use ONLY in a MoonBit project (moon.mod / *.mbt present); do NOT use outside one. Use when refactoring code, managing technical debt, or eliminating code smells — with existing tests green. Triggered by 'refactor', 'technical debt', 'code smell', '重构', '技术债务', '坏味', '清理代码'. Do NOT use for new features or bug fixes."
---

# Refactor — 重构

## 职责

技术债务识别、测试保护确认、小步重构、回归验证。**独立迭代循环，不改变可观察行为，只改善内部结构。**

## The Iron Law

```
NO REFACTORING WITHOUT GREEN TESTS
```

重构前测试必须全绿。无测试保护的代码不是重构，是赌博。

### 可机械化自检

- [ ] 重构前 `moon test` 全绿（已记录通过状态）
- [ ] 重构范围已识别（具体坏味类型和位置）
- [ ] 重构步幅小（每步可独立验证）
- [ ] 每步重构后 `moon test` 仍全绿
- [ ] 重构后 `moon fmt --check` + `moon check` 通过
- [ ] 可观察行为不变（公共 API 未变）

## Red Flags — STOP and Re-evaluate

- 测试不全就重构（"我先重构再补测试"）
- 大步重构（一次改多个坏味）
- 重构中改变公共 API（越界到 implement）
- 重构中修复 bug（越界到 implement，应先记录再单独修）
- 不运行测试就继续下一步
- "顺手优化性能"（越界到 perform）

## 停止条件

- 技术债务清零（识别的坏味全部消除）→ 进入 verify 确认无回归
- 重构无收益（代码已足够清晰）→ 停止，避免过度工程
- 需设计变更（坏味根因是设计缺陷）→ 触发设计回溯，回到 plan
- 测试失败（重构引入回归）→ 立即回滚该步，重新规划

## 重构循环

```
┌─ IDENTIFY:      识别坏味 → 长函数、重复代码、复杂条件、神秘命名
├─ ENSURE TESTS:  确认测试覆盖 → moon test 全绿；覆盖不足先补测试（调用 testing）
├─ REFACTOR:      小步重构 → 单一坏味，单一手法
├─ VERIFY:        回归验证 → moon test + moon check + moon fmt --check
├─ DOC:           模块结构或接口变更 → 同步更新内部设计文档/ADR
└─ 循环:          还有坏味 → 继续；无坏味 → 停止
```

## 坏味分类与重构手法

| 坏味 | 症状 | 手法 |
|---|---|---|
| 神秘命名 | 变量名无意义 | 重命名（moon ide rename） |
| 重复代码 | 相同逻辑多处 | 提取函数 |
| 长函数 | 函数 > 50 行 | 提取函数、分解条件 |
| 长参数列表 | 参数 > 4 个 | 引入参数对象 |
| 复杂条件 | 嵌套 if/match | 分解条件、守卫子句 |
| 可变数据 | 不必要的 mut | 不可变化、提取不可变视图 |
| 发散式变化 | 一个类多方向变化 | 提取模块 |
| 霰弹式修改 | 一个改动多处 | 搬移函数 |
| 数据泥团 | 多处相同字段组 | 提取对象 |
| 基本类型偏执 | 用 String/Int 表示概念 | 提取类型 |

## MoonBit 特有重构注意

- `moon ide rename`：语义重命名，安全
- `moon ide peek-def`：查看定义，辅助理解
- `pub` 可见性：重构中不改变公共 API
- `enum` 构造器：跨包需 `pub(all) enum`，重构中注意
- `struct` 字段：跨包字面量需 `pub` 字段，重构中注意

## 与 implement 的契约

- refactor 在 implement 之后（功能正确为前提）
- refactor 不改变可观察行为，只改善内部结构
- refactor 中发现 bug → 记录，不在此修复（回到 implement）
- refactor 中需要新功能 → 记录，不在此实现（回到 plan/implement）

## 与 testing 的契约

- refactor 前确认测试覆盖充分
- 覆盖不足时调用 testing 补测试，再重构
- testing 提供的测试是 refactor 的安全网

## 与 verify 的契约

- refactor 产出的变更需通过 verify 确认无回归
- verify 确认公共 API 未变（C1）

## 与 perform 的契约

- refactor 不优化性能（不越界到 perform）
- 若重构后发现性能问题 → 调用 perform

## 用户 vs Agent 分工

| 谁 | 做什么 |
|---|---|
| Agent | 识别坏味、确认测试、小步重构、回归验证 |
| 用户 | 确认重构范围、判断是否值得重构、决定停止时机 |

## 输出

```json
{
  "status": "completed | no_gain | blocked",
  "smells_identified": 5,
  "smells_resolved": 5,
  "refactor_steps": [
    { "smell": "长函数", "method": "提取函数", "verified": true },
    { "smell": "重复代码", "method": "提取函数", "verified": true }
  ],
  "api_changed": false,
  "regression": false,
  "next": "verify | plan | implement"
}
```

## 错误恢复

| 问题 | 诊断 | 修复 |
|---|---|---|
| 测试不全就重构 | 跳过 ENSURE TESTS | 回到 ENSURE TESTS，补测试后重构 |
| 大步重构引入回归 | 一次改多个坏味 | 回滚，拆为小步逐一重构 |
| 重构改变公共 API | 越界到 implement | 回滚 API 变更，保持 API 不变 |
| 重构中修 bug | 越界到 implement | 记录 bug，继续重构，bug 单独修 |
| 测试失败 | 重构引入回归 | 立即回滚该步，重新规划 |
| 坏味根因是设计缺陷 | 局部重构无效 | 触发设计回溯，回到 plan |

## 下一步

重构完成后，进入 `moonbit-verify` 确认无回归。若坏味根因是设计缺陷，触发设计回溯回到 `moonbit-plan`。
