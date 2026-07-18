---
name: review
description: "Review MoonBit code quality. Type-aware: different review criteria for lib, cli, c-ffi, wasm. Agent checks type design, visibility, error handling, and architecture compliance. Applies auto-fixes."
---

# Review — 代码审查

## 职责

根据 `project_type` 检查代码质量并自动修复。**Agent 检查 + 修复，用户决定是否接受。**

## 通用审查维度（所有类型）

### 1. 类型设计

| 检查项 | 合格 | 修复 |
|--------|------|------|
| 可选值 | 用 `T?` 而非 `Option[T]` | 自动替换 |
| 错误处理 | 正确使用 Result/suberror | 自动修正 |
| 字符串参数 | 用 `StringView` 而非 `String` | 自动替换 |
| 自定义错误 | 有 `derive(Show, Eq, ToJson)` | 自动添加 |

### 2. 可见性

| 检查项 | 合格 | 修复 |
|--------|------|------|
| 最小公开 | 只导出外部需要的 | 移除不必要的 `pub` |
| 内部隐藏 | 实现细节在 `internal/` | 移动文件 |

### 3. 错误处理

| 检查项 | 合格 | 修复 |
|--------|------|------|
| 空 catch | 无 `catch { _ => () }` | 添加日志或重新抛出 |
| 错误转换 | 层间使用 `wrap()` | 添加 wrap 函数 |
| 资源管理 | 使用 `with_closed_*` | 包装为 RAII |

## 类型特定审查维度

### lib — API 最小表面 + 跨平台
- `moon info --target native` 列出所有 pub 导出
- 检查是否有不必要的 pub
- 检查跨平台兼容性: `moon check --target all`

### cli — 参数解析 + 错误输出
- 检查 @argparse 使用是否正确
- 检查错误消息是否友好
- 检查退出码是否正确

### c-ffi — 内存安全 + ABI 对齐
- 检查 `with_closed_*` RAII 模式
- 检查 `malloc → defer free` 模式
- 检查类型宽度编译期断言
- 检查层间错误转换 (`wrap()`)

### wasm — 内存操作 + 目标
- 检查 `extern "wasm"` 声明
- 检查 `bytes2ptr` / `ptr2bytes` 使用
- 检查 `moonbit.decref` 调用
- 确认目标为 wasm/wasm-gc

## 展示给用户

```markdown
## 审查结果

### 自动修复
- ✅ 移除了 2 个不必要的 pub
- ✅ 添加了 derive(Show, Eq) 到 ParseError
- ✅ 替换了 1 处 Option[T] 为 T?

### 类型特定检查 ({project_type})
- ✅ 架构合规: 检查通过
- ✅ 测试覆盖: 核心功能已覆盖

**接受这些修复吗？**
- 接受 → 继续
- 不接受 → 说明要改的部分
```

## 输出

```json
{
  "status": "clean | fixed | issues_remaining",
  "project_type": "lib",
  "auto_fixes": ["removed pub from 2 functions"],
  "type_specific_checks": {
    "cross_platform": "pass",
    "api_minimal": "pass"
  },
  "remaining_issues": [],
  "verification": "pass"
}
```