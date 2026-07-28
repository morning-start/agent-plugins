---
name: moonbit-code-review
description: "Use when requesting code review between implementation tasks, after completing a feature, or before merging — to verify work meets MoonBit quality standards. Triggered after each implement task or on user request."
---

# Code Review — MoonBit 代码审查

## 职责

在实现任务之间进行代码审查，及早发现和修复问题，防止问题扩散。

**核心原则：早审查，常审查。** 每个 implement 任务完成后都做一次审查。

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
| 测试覆盖 | 新增功能有对应单元测试 | 报告缺失的测试 |

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
| **Critical** | 编译错误、测试失败 | 必须修复 |
| **Important** | API 设计缺陷、性能问题、安全隐患 | 修复后继续 |
| **Minor** | 代码风格、命名建议 | 记下稍后处理 |

### 5. 自动修复

自动修复后必须重新运行 fmt、check、test，并输出变更摘要。

涉及 public API、ABI、WASM 导出或 C 所有权时，停止自动修复并请求用户确认。

## 用户 vs Agent 分工

| 谁 | 做什么 |
|---|--------|
| **Agent** | 执行审查、自动修复机械问题、输出结果 |
| **用户** | 判断接受/拒绝重要变更 |

## 输出

```json
{
  "status": "approved | changes_needed",
  "scope": "tasks 3-5",
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
