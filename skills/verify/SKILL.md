---
name: verify
description: "Run the MoonBit verification gate. Type-aware: runs different verification pipelines for lib, cli, c-ffi, wasm projects. Called by other skills as a quality check."
---

# Verify — 验证门禁

## 职责

根据 `project_type` 运行对应的验证管道。**Agent 执行，返回结果。**

## 验证管道

### lib — 跨平台验证

```bash
moon fmt --check && moon check --target native --warn-list +73 && moon test --target native && moon info --target native
# 可选: moon check --target all（跨平台兼容性）
```

### cli — 本地可执行验证

```bash
moon fmt --check && moon check --target native --warn-list +73 && moon test --target native && moon info --target native
# CLI 特有: 测试标准输入输出
```

### c-ffi — 原生绑定验证

```bash
moon fmt --check && moon check --target native --warn-list +73 && moon test --target native && moon info --target native
# C 特有: 需要 GCC/Clang 编译器
# 可选: ASan 验证（Address Sanitizer）
```

### wasm — WASM 验证

```bash
moon fmt --check && moon check --target wasm --warn-list +73 && moon test --target wasm && moon info --target wasm
# WASM 特有: 需要 WASM 运行时（wasmtime）
```

## 分步诊断（如果失败）

```bash
# fmt 失败
moon fmt                            # 自动修复格式

# check 失败
moon check --explain E####          # 获取错误详解

# test 失败
moon test --target native -- --show-output   # 查看详细输出
moon test --target native -f "test_name"     # 运行单个测试

# info 失败
moon check --target native          # 先确保类型检查通过
```

## 幂等性

本技能可安全重复运行：

- **验证管道**：无状态，每次运行产生相同结果（同一工具链版本下）
- **文件检查**：只读，不修改任何文件
- **git status**：运行后检查是否有意外变更

```bash
# 幂等性检查
moon fmt --check && moon check --target native --warn-list +73 && moon test --target native && moon info --target native
# 重复运行应产生相同输出（同一工具链版本）
```

## 输出

```json
{
  "status": "pass | fail",
  "project_type": "lib",
  "target": "native",
  "checks": {
    "fmt": "pass",
    "check": "pass",
    "test": "pass (12/12)",
    "info": "pass"
  },
  "failures": []
}
```