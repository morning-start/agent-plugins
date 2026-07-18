---
name: implement
description: "Implement MoonBit features with TDD. Type-aware: different TDD strategies for lib, cli, c-ffi, wasm. Agent does Red-Green-Verify per task, then presents results to user."
---

# Implement — TDD 实现

## 职责

逐任务实现功能。**Agent 做 TDD，每个任务完成后展示给用户看。** 根据 `project_type` 使用不同的 TDD 策略和验证目标。

## 各类型的 TDD 策略

### lib — 单元测试驱动

```bash
# 目标: moon test --target native
# 重点: 公共 API 覆盖、边界情况、错误处理
# 测试命名: valid/*, invalid/*, edge/*, regression/*
```

### cli — 集成测试驱动

```bash
# 目标: moon test --target native
# 重点: 命令解析、参数传递、标准 I/O
# 测试: 核心逻辑单元测试 + CLI 输出集成测试
```

### c-ffi — 安全包装驱动

```bash
# 目标: moon check --target native
# 重点: 从 L0(L1) 向外写: extern → raw wrapper → public API
# 测试: 内存安全、错误转换、边界值
# 可选: ASan 验证
```

### wasm — 内存安全驱动

```bash
# 目标: moon test --target wasm
# 重点: 从 L0 向外写: store32/load32 → raw → public
# 测试: 内存操作、边界值、WASI 调用
```

## 每个任务的 TDD 循环

```bash
# ===== RED: 写测试 =====
# 在对应测试文件中添加测试
# 验证测试失败
moon test --target native -f "test_name"
# 预期: 测试失败 (函数未实现)
```

```bash
# ===== GREEN: 实现 =====
# 最小实现代码
moon test --target native -f "test_name"
# 如果失败: 自动诊断并修复
```

```bash
# ===== VERIFY: 验证 =====
# 根据 project_type 验证
# lib: mbt moon fmt --check && moon check --target native --warn-list +73 && moon test --target native
# cli: moon fmt --check && moon check --target native && moon test --target native
# c-ffi: moon fmt --check && moon check --target native && moon test --target native
# wasm: moon fmt --check && moon check --target wasm && moon test --target wasm
```

### 任务完成后展示给用户

```markdown
## 任务完成: Task 3 — {任务名}

**变更文件**: {文件列表}
**测试结果**: ✅ {N}/{M} 通过

**要继续吗？**
- 继续 → 进入下一个任务
- 改这里 → 说明要改什么
```

### Checkpoint: 任务完成

```bash
# 验证变更未破坏已有功能
moon test --target native
# 如果失败: moon test --target native -- --show-output

# 验证类型检查通过
moon check --target native --warn-list +73
# 如果失败: moon check --explain E####

# c-ffi 特有: 验证 C 编译
# gcc -c src/wrapper.c -I src/ 2>&1

# wasm 特有: 验证 WASM 目标
# moon check --target wasm
```

### 失败处理

| 情况 | 处理 |
|------|------|
| 测试失败 | Agent 自动诊断并修复（最多 3 次） |
| 3 次修复失败 | Agent 暂停，展示问题，问用户方向 |
| 用户说「改这里」 | Agent 修改，重新验证，再次展示 |

## 用户 vs Agent 分工

| 谁做 | 做什么 |
|------|--------|
| **Agent** | 写测试、写实现、跑验证、诊断失败 |
| **用户** | 审查结果、说「改这里」、卡住时给方向 |

## 输出

```json
{
  "status": "done | paused",
  "project_type": "lib",
  "completed_tasks": ["task-1", "task-2"],
  "current_task": "task-3",
  "test_results": {"passed": 5, "failed": 0},
  "user_feedback": null,
  "next": "implement | evaluate"
}
```