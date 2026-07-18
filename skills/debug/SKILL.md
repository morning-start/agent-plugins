---
name: debug
description: "Debug MoonBit test or type failures. Type-aware: different diagnostic strategies for lib, cli, c-ffi, wasm. Agent collects error info, classifies, diagnoses, applies fix, re-verifies."
---

# Debug — 调试

## 职责

根据 `project_type` 诊断并修复失败。**Agent 自动诊断修复，卡住时问用户方向。**

## 执行流程

### 1. 收集失败信息

```bash
# 通用
moon test --target native -- --show-output 2>&1 | tail -50
moon check --target native --warn-list +73 2>&1
moon check --explain E#### 2>&1

# c-ffi 特有: 检查 C 编译错误
# wasm 特有: 检查 WASM 目标错误
```

### 2. 分类失败

| 类型 | 判断 | 处理 |
|------|------|------|
| 类型错误 | E#### 代码 | `moon check --explain` → 修复类型 |
| 断言失败 | 测试输出不匹配 | 修正实现逻辑 |
| 运行时错误 | panic/崩溃 | 检查空值、边界 |
| 编译错误 | 语法错误 | 修正语法 |
| 缺少导入 | 未绑定名称 | 添加导入 |
| **c-ffi: C 编译错误** | C 编译器输出 | 检查 wrapper.c 语法、类型宽度 |
| **wasm: WASM 目标错误** | target wasm 失败 | 检查 extern "wasm" 声明 |

### 3. 修复并验证

```bash
# 通用修复
moon test --target native -f "failing_test"
moon fmt --check && moon check --target native --warn-list +73 && moon test --target native

# c-ffi 特有: 修复 C 代码后
# gcc -c wrapper.c -I moonbit.h  # 检查 C 编译

# wasm 特有: 修复后
# moon test --target wasm
```

### 4. 失败处理

| 情况 | 处理 |
|------|------|
| 修复成功 | 继续 |
| 3 次修复仍失败 | 暂停，展示问题给用户，问方向 |

## 错误恢复速查表

| 命令 | 诊断 | 修复 | 升级 |
|------|------|------|------|
| `moon check` | `moon check --explain E####` | 检查类型签名 | ABI 不匹配 → 验证 C/MoonBit 类型宽度 |
| `moon test` | `moon test -- --show-output` | 修正测试断言 | 测试框架 bug → 验证 moon.pkg 配置 |
| `moon fmt --check` | `moon fmt` (自动修复) | 修复格式 | 编辑器配置冲突 |
| `gcc -c wrapper.c` | 检查 C 编译器输出 | 修正语法/类型宽度 | 缺少 moonbit.h → 检查 MOONBIT_DIR |
| `moon check --target wasm` | `moon check --explain` | 检查 extern "wasm" 声明 | WASM 运行时版本不兼容 |
| `git status --short` | `git diff` 查看详情 | 更新 `.gitignore` | 意外文件 → 检查模板生成 |

## 输出

```json
{
  "status": "fixed | escalate",
  "project_type": "lib",
  "failure_type": "type_error",
  "root_cause": "类型签名不匹配",
  "fix_applied": "将返回类型从 String 改为 Int",
  "attempts": 2,
  "verification": "pass"
}
```

## 类型感知分支

根据 `project_type` 调整诊断策略：

| 项目类型 | 特有诊断 | 关键检查 |
|---------|---------|---------|
| `lib` | 跨平台兼容性 | `moon check --target all` |
| `cli` | 参数解析、标准 I/O | 检查 @argparse 配置 |
| `c-ffi` | C 编译错误、内存泄漏 | `gcc -c wrapper.c`、ASan |
| `wasm` | WASM 目标错误 | `moon check --target wasm` |
| `parser` | 词法/语法错误 | 检查 tokenize/parser 位置信息 |
| `async` | 协程取消、超时 | 检查 task_group 错误传播 |

## 幂等性

本技能可安全重复运行：

- **诊断命令**: 只读，不修改文件
- **修复操作**: 每次修复后验证，可回滚
- **验证管道**: 无状态

```bash
# Idempotency check: 重新运行诊断
moon check --target native --warn-list +73 && moon test --target native
# 预期: 相同的错误信息（未修复时）
```

## Checkpoint: diagnosis

```bash
# 验证诊断结果
echo "failure_type: {type_error|assertion|runtime|compile|missing_import|c-ffi|wasm}"
echo "root_cause: <description>"
echo "fix_applied: <description>"
# 预期: 明确失败类型和根本原因
# 如果无法分类: 使用通用诊断流程
```

## IDE 工具链

诊断时优先使用语义导航：

```bash
moon ide find-references <symbol>
moon ide peek-def <symbol>
moon ide outline
moon check --explain E####
```

## 上游参考

- `moonbit-agent-guide` — 通用 MoonBit 诊断与验证
- `moonbit-orientation` — 错误码与工具链 freshness gate
