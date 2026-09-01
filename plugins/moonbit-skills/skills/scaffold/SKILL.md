---
name: moonbit-scaffold
description: "Use ONLY in a MoonBit project (moon.mod / *.mbt present) or when the user explicitly asks to scaffold a MoonBit project; do NOT use outside one. Use when generating a MoonBit project skeleton. Triggered by user phrases like 'scaffold', 'generate', 'skeleton', or when moon.mod is missing and a new project needs file structure. Dynamically generates project files based on type and user choices — no pre-made templates."
---

# Scaffold — 动态生成项目骨架

## 职责

根据 plan 阶段确认的项目类型、模块划分和配置，**动态生成**最小可构建的 MoonBit 项目骨架。不依赖预置模板，按需生成每一份文件。

**核心原则：拒绝固定模板，按需动态生成；骨架按模块组织目录，为分模块实现落地铺路。**

## The Iron Law

```
NO TEMPLATES — DYNAMICALLY GENERATE
```

禁止使用预置模板文件（如 `templates/*.txt`）。所有项目文件必须根据 `project_type`、`package_name` 和 **plan 输出的模块划分**动态生成，确保内容与 MoonBit 工具链版本和用户配置一致。

> **区分**：下方"按类型动态生成"章节中的代码块是**生成逻辑示例**（agent 按此模式动态写入文件），不是模板文件。模板文件指 `templates/` 目录下的预置文件；本技能不存在此类文件。

## Red Flags — STOP and Re-evaluate

If you catch yourself doing any of these, you are violating the scaffold contract:

- 复制模板文件而非动态生成
- 覆盖用户已有的文件而不询问
- 生成后不验证（"骨架肯定没问题"）
- 用占位符填充未确认的值（"TODO: 填入包名"）
- 生成的代码包含过时语法（如 `module "xxx"` 旧格式）

**All of these mean: Stop. Generate fresh from the type definition.**

## 停止条件

- 项目类型未知（不在 lib/cli/ffi/wasm 中）→ 让用户从列表中选择
- `moon` 命令不可用 → 报告工具链缺失，不声称验证通过
- 占位符替换不完整 → 检查生成文件，确保 `{` 字符无残留
- 验证失败（fmt/check/test 任一不通过）→ 显示失败命令，不继续

## 生成流程

### 1. 确认输入

```text
project_type: lib | cli | ffi | wasm
package_name: MoonBit 包名（如 username/package）
target: native | wasm | js | wasm-gc
capabilities: [parser, async, ...]（可选）
```

### 2. 按类型动态生成

#### lib

```moonbit
// moon.mod
name = "{package_name}"
version = "0.1.0"
preferred_target = "native"
supported_targets = ["native", "wasm", "js"]

// moon.pkg（空文件，无 import，scaffold 后用户按需添加）

// lib.mbt
///|
/// {package_name} — 主模块
pub fn hello() -> String {
  "Hello from {package_name}!"
}

// test.mbt
///|
/// {package_name} — 测试
/// 测试组织决策遵循 moonbit-testing 契约，详见 references/testing.md
test "hello" {
  if hello() != "Hello from {package_name}!" {
    fail("hello() returned unexpected value")
  }
}
```

#### cli

```moonbit
// moon.mod
name = "{package_name}"
version = "0.1.0"
preferred_target = "native"
supported_targets = ["native"]

// moon.pkg
pkgtype(kind: "executable")

// main.mbt
fn main {
  println("Hello from {package_name}!")
}

// test.mbt
test "hello" {
  if hello() != "Hello from {package_name}!" {
    fail("hello() returned unexpected value")
  }
}
```

#### ffi

```moonbit
// moon.mod
name = "{package_name}"
version = "0.1.0"
preferred_target = "native"
supported_targets = ["native"]

// moon.pkg（空文件）

// ffi.mbt
///|
extern "c" fn {name}_version() -> Int = "{name}_version"

///|
extern "c" fn {name}_free(ptr: #owned Unit) -> Unit = "{name}_free"

// lib.mbt
///|
pub fn version() -> Int {
  {name}_version()
}

// wrapper.c
#include <stdint.h>
#include <stdlib.h>

int32_t {name}_version(void) {
  return 1;
}

void {name}_free(void* ptr) {
  free(ptr);
}
```

#### wasm

```moonbit
// moon.mod
name = "{package_name}"
version = "0.1.0"
preferred_target = "wasm"
supported_targets = ["wasm", "wasm-gc"]

// moon.pkg（空文件）

// ffi.mbt
///|
extern "wasm" fn add(a: Int, b: Int) -> Int = "math:add"

// test.mbt
///|
/// {package_name} — WASM 模块
test "version" {
  // 验证模块结构完整性
}
```

### 3. 能力扩展（按模块组织）

当项目包含 `parser` 或 `async` 能力时，在基础结构上追加**模块目录**。模块来自 plan 的「模块划分」，每个模块一个文件组，为 writing-plans 的 Phase 和 implement 的分模块实现提供落地骨架：

| 能力 | 模块文件（每模块一个文件组） |
|------|---------|
| `parser` | `tokenize.mbt`（lexer 模块）、`parser.mbt`（parser 模块）、`validate.mbt`（validate 模块） |
| `async` | `event_loop.mbt`（event_loop 模块）、`task.mbt`（task 模块）、`io.mbt`（io 模块） |

> 若 plan 定义了自定义模块划分，以 plan 为准动态生成对应模块文件；每模块可附带独立测试文件（`{module}_test.mbt`），让后续 TDD 有落点。

### 4. 替换占位符

生成文件后，将文件内所有 `{package_name}` 和 `{name}` 替换为用户确认的实际值。

### 5. 验证

```bash
moon fmt --check
moon check --target native --warn-list +73
moon test --target native
```

WASM 项目额外运行：
```bash
moon check --target wasm
moon test --target wasm
```

如果工具链不可用，报告工具链错误，不声称验证通过。

## 动态生成 vs 预置模板

| 维度 | 预置模板（旧方案） | 动态生成（当前方案） |
|------|------------------|-------------------|
| 文件来源 | `templates/{type}/*` | 按类型在代码中定义 |
| 灵活性 | 仓库自带的固定文件 | 可根据工具链版本调整 |
| 维护成本 | 每个类型需独立维护文件 | 集中维护，易更新 |
| 版本追踪 | 文件级别 | 代码级别 |
| 可扩展性 | 新类型需新建目录 | 新类型只需追加生成逻辑 |

## 输出

```json
{
  "status": "scaffolded | blocked",
  "project_type": "cli",
  "package_name": "username/my-tool",
  "modules": ["main", "lib"],
  "files_created": [
    "moon.mod", "moon.pkg",
    "main.mbt", "test.mbt"
  ],
  "validation": {
    "fmt": "passed",
    "check": "passed",
    "test": "passed"
  },
  "next": "implement"
}
```

## 错误恢复

| 问题 | 诊断 | 修复 |
|------|------|------|
| 未知项目类型 | 不在 lib/cli/ffi/wasm 中 | 让用户从列表中选择 |
| `moon` 命令不可用 | command not found | 报告工具链前置需求，不声称验证成功 |
| 验证失败 | fmt/check/test 任一不通过 | 显示失败命令，返回 plan 修正设计 |
| 占位符替换不完整 | 生成文件中 `{` 字符残留 | 检查生成后文件，确保占位符全部替换 |

## 下一步

骨架已验证通过。后续实现交给用户或外部流程编排，并以 `moonbit-testing` / `moonbit-verify` 保证测试与验证落地。
