---
name: moonbit-code-review
description: "Use ONLY in a MoonBit project (moon.mod / *.mbt present); do NOT use outside one. Use when requesting code review between implementation tasks, after completing a feature, or before merging — to verify work meets MoonBit quality standards. Triggered after each implement task or on user request."
---

# Code Review — MoonBit 代码审查

## 职责

在实现任务之间进行代码审查，及早发现和修复问题，防止问题扩散。

**核心原则：早审查，常审查。** 每个 implement 任务完成后都做一次审查。**审查粒度对齐任务/模块**：按 `moonbit-task` / `moonbit-implement` 的单个 Task 或 Phase 模块为单位审查，diff 过大时拆分为多个小审查。

## The Iron Law

```
REVIEW REAL CODE, NOT ASSUMPTIONS
```

审查必须基于实际代码和 diff，不审查假设或想象中的实现。**Critical 问题必须在继续下一个任务前处理或由用户明确接受。**

### 可机械化自检

- [ ] 审查前已执行 `git diff` 或 `git status` 获取实际变更
- [ ] 引用的代码片段来自 diff 输出，非记忆或猜测
- [ ] Critical 问题分级基于可观察的编译/测试失败，非主观判断
- [ ] 审查范围限定于 diff 涉及的文件，不扩散到未变更代码

未满足以上任一 → Iron Law 触发：停止，重新收集 diff。

## Red Flags — STOP and Re-evaluate

If you catch yourself doing any of these, you are violating the review contract:

- 跳过测试审查（"测试都通过了，不用看测试质量"）
- 只看测试是否通过，不看代码质量、可读性与设计
- 未检查公共 API 变更（`pub` 可见性、导出符号、ABI）
- 审查想象中的代码而非实际 diff
- 把 Critical 问题降级为 Minor 以"先继续"

**All of these mean: Stop. Re-scope the review.**

## 停止条件

- 发现 **Critical** 问题（编译错误、测试失败）时立即停止自动修复，报告给用户，由用户决定下一步。
- 发现涉及 public API、ABI、WASM 导出或 C 所有权变更时停止自动修复，请求用户确认。
- 自动修复失败 3 次 → 停止，向用户展示失败历史和当前状态，请求方向（与 `moonbit-implement` 的 3 次上限对齐）。

## 与 verify E4 的分工

`moonbit-code-review` 和 `moonbit-verify` 的 E4（API 设计深度检查）都涉及 API 设计审查，但分工不同：

| 维度 | code-review（过程审查） | verify E4（终点检查） |
|------|----------------------|---------------------|
| 时机 | 每个 implement 任务后 | 全量验证阶段 |
| 范围 | 当前 diff 涉及的新增/修改代码 | 整个项目的公共 API 表面 |
| 目的 | 及早发现问题，防止扩散 | 终点把关，确保发布质量 |
| 动作 | 报告 + 机械性自动修复 | 仅报告，由用户决策 |

避免在 code-review 中重复 verify E4 的全量 API 检查；code-review 聚焦 diff 范围内的 API 变更。

## 审查流程

### 1. 收集变更

```bash
# 默认审查 working tree + staged diff
# 如果任务已提交，使用 HEAD~1 对比
if git rev-parse HEAD~1 >/dev/null 2>&1; then
  BASE_SHA=$(git rev-parse HEAD~1)
  HEAD_SHA=$(git rev-parse HEAD)
  DIFF_CMD="git diff ${BASE_SHA}..${HEAD_SHA}"
else
  # 单 commit 或无 commit: 审查所有未提交变更
  DIFF_CMD="git diff HEAD"
fi

# 如果有实施计划文件，记录任务开始时的 base
if [ -f "docs/implementation-plan.md" ]; then
  BASE_SHA=$(git log --oneline --reverse | head -1 | awk '{print $1}')
fi
```

### 2. 逐项审查

默认先报告问题，不直接修改代码。只有**不涉及 public API、ABI、导出符号、所有权或依赖**的机械性修复，才可以自动应用。

| 检查 | 合格标准 | 默认动作 |
|------|---------|---------|
| 可选值 | `T?` 而非 `Option[T]` | 报告，需确认后替换 |
| 字符串参数 | `StringView` 而非 `String` | 报告；公开函数不自动替换 |
| 错误处理 | 正确使用 `Result`/`suberror` | 报告并给出建议 |
| 自定义错误 | `derive(Debug, Eq, ToJson)` | 仅内部类型可自动修复 |
| 可见性 | 只导出外部需要的 | 涉及 `pub` 时只报告 |
| 空 catch | 无 `catch { _ => () }` | 报告并给出建议 |
| 资源管理 | `with_closed_*` RAII 模式 | FFI/资源代码只报告 |
| 枚举可见性 | 跨包构造需 `pub(all) enum`，`pub enum` 不导出构造器 | 涉及枚举可见性变更时只报告 |
| 跨包 struct 字面量 | 跨包只能用 `pub` 字段，通常需要提供构造器函数 | 结构体重构只报告 |
| `unused_mut` 语义 | `mut` 仅在变量重新赋值时需要，push/mutate 不需要 | 谨慎添加/移除 `mut`，需验证 push/mutate 场景 |
| 测试覆盖 | 新增功能有对应单元测试，组织遵循 testing 契约 | 报告缺失的测试和不符合的组织 |
| 验收项 ↔ 测试对应 | 每个验收项（来自 task 验收清单）都有对应测试，测试时机符合 testing 决策（新功能先行、既有行为后补） | 报告无测试支撑的验收项 |
| 模块边界 | 变更不越出当前 Task/模块范围；跨模块改动应拆分审查 | 报告越界变更，建议拆分 |
| perform 产出审查 | 优化有测量数据支撑，无过早优化 | 报告无基线的优化 |
| refactor 产出审查 | 可观察行为不变，公共 API 未变 | 报告 API 变更 |

### 3. 运行验证

```bash
moon fmt --check
moon check --warn-list +73
moon test --target native
```

### 4. 输出结果

按严重程度分类：

| 严重度 | 定义 | 动作 |
|--------|------|------|
| **Critical** | 编译错误、测试失败 | 必须修复，修复后回到 code-review |
| **Important** | API 设计缺陷、性能问题、安全隐患 | 建议修复，修复后回到 code-review |
| **Minor** | 代码风格、命名建议 | 记下稍后处理，不阻断 |

**多轮判断**：
- Critical > 0 → 状态为 `changes_needed`，必须修复后才能再次审查
- Critical = 0 且 Important > 0 → 状态为 `changes_needed`，建议修复；修复后回到 code-review；用户可显式接受风险后跳过
- Critical = 0 且 Important = 0（或用户显式接受）→ 状态为 `approved`
- review_round 递增（第 1 轮=1，第 2 轮=2...）
- 连续 3 轮审查无改善（findings 总数未减少）→ 停止，请求用户介入

### 5. 自动修复

自动修复后必须重新运行 fmt、check、test，并输出变更摘要。

涉及 public API、ABI、WASM 导出或 C 所有权时，停止自动修复并请求用户确认。

### 6. 多轮循环

code-review 支持多轮审查，直到所有 Critical 和 Important 问题被解决或用户显式接受。

```
Round 1: review → changes_needed → implement (fix) → review
Round 2: review → changes_needed → implement (fix) → review
Round 3: ... → approved → verify
```

- 每轮输出 `changes_needed` 后，Agent 回到实现任务修复问题，修复完成后自动再次触发 code-review
- 同一技能实例接管上下文，`review_round` 逐轮递增
- 当 Critical = 0 且 Important = 0（或用户显式接受已知问题）时，标记 `approved`
- 连续 3 轮审查 findings 总数未减少 → 审查循环无效，停止，请求用户介入

## 用户 vs Agent 分工

| 谁 | 做什么 |
|---|--------|
| **Agent** | 执行审查、自动修复机械问题、输出结果 |
| **用户** | 判断接受/拒绝重要变更 |

## 输出

```json
{
  "status": "approved | changes_needed",
  "review_round": 1,
  "previous_round_findings": 0,
  "scope": "task-3 (lexer 模块)",
  "acceptance_coverage": {"total": 4, "tested": 4, "missing": 0},
  "findings": {
    "critical": 0,
    "important": 1,
    "minor": 3
  },
  "auto_fixes": 2,
  "next": "implement | verify"
}
```

## 下一步

审查通过后，可以进入 `moonbit-verify` 做全量门禁检查，或返回 `moonbit-implement` 继续下一个任务。

## 错误恢复

> 共享错误恢复行（fmt/check/test 失败）详见 `references/common-error-recovery.md`。
> 以下仅列出 code-review 独有的行。

| 问题 | 诊断 | 修复 |
|------|------|------|
| `git diff` 为空 | 无变更可审查 | 确认任务已完成，跳过审查 |
| 审查范围过大 | diff 超过 500 行 | 建议拆分为多个小任务分别审查 |
| 自动修复引入新问题 | 修复后验证失败 | 回滚修复，仅报告问题，由用户手动处理 |
