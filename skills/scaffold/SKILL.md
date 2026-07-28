---
name: moonbit-scaffold
description: "Use when generating a MoonBit project skeleton. Triggered by user phrases like 'scaffold', 'generate', 'skeleton', or when moon.mod is missing and a new project needs file structure. Dynamically generates project files based on type and user choices — no pre-made templates."
---

# Scaffold — 动态生成项目骨架

## 职责

根据 plan 阶段确认的项目类型和配置，**动态生成**最小可构建的 MoonBit 项目骨架。不依赖预置模板，按需生成每一份文件。

**核心原则：拒绝固定模板，按需动态生成。**

## 生成流程

### 1. 确认输入

```text
project_type: lib | cli | c-ffi | wasm
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

#### c-ffi

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

### 3. 能力扩展

当项目包含 `parser` 或 `async` 能力时，在基础结构上追加：

| 能力 | 追加文件 |
|------|---------|
| `parser` | `tokenize.mbt`, `parser.mbt`, `validate.mbt` |
| `async` | `event_loop.mbt`, `task.mbt`, `io.mbt` |

### 4. 替换占位符

生成文件后，将文件内所有 `{package_name}` 和 `{name}` 替换为用户确认的实际值。

### 5. 验证

```bash
moon fmt --check
moon check --target native
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

| 问题 | 动作 |
|------|------|
| 未知项目类型 | 让用户从 lib/cli/c-ffi/wasm 中选择 |
| `moon` 命令不可用 | 报告工具链前置需求，不声称验证成功 |
| 验证失败 | 显示失败命令，返回 plan 或 implement |
| 占位符替换不完整 | 检查生成后文件，确保 `{` 字符无残留 |

## 下一步

验证通过后，进入 `moonbit-implement` 开始逐个任务实现。
