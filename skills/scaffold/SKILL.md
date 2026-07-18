---
name: scaffold
description: "Generate a MoonBit project skeleton from templates. Agent creates project structure based on project_type: lib, cli, c-ffi, or wasm. Uses templates/{type}/ files."
---

# Scaffold — 项目脚手架

## 职责

根据 `project_type` 从对应模板生成可编译的 MoonBit 项目骨架。**Agent 执行，用户确认。**

## 模板映射

| 项目类型 | 模板目录 | 关键文件 |
|---------|---------|---------|
| `lib` | `templates/lib/` | `moon.mod.json`, `moon.pkg.json`, `lib.mbt`, `test.mbt` |
| `cli` | `templates/cli/` | `moon.mod.json`, `moon.pkg.json`, `main.mbt` (含 @argparse), `test.mbt` |
| `c-ffi` | `templates/c-ffi/` | `moon.mod.json`, `moon.pkg` (含 native-stub), `ffi.mbt`, `wrapper.c` |
| `wasm` | `templates/wasm/` | `moon.mod.json`, `moon.pkg.json`, `ffi.mbt` (含内存操作), `test.mbt` |

## 执行流程

### 1. 确认参数

```bash
# Agent 根据 project_type 确认参数:
# lib:   package_name, targets (native,wasm,js)
# cli:   package_name, command name, flags
# c-ffi: package_name, C library name, API count
# wasm:  package_name, WASI preview version
```

### 2. 生成骨架

```bash
# 根据 project_type 使用对应模板
# project_type = lib → templates/lib/
#   - templates/lib/moon.mod.json → moon.mod.json
#   - templates/lib/moon.pkg.json → src/moon.pkg.json
#   - templates/lib/lib.mbt → src/lib.mbt
#   - templates/lib/test.mbt → src/lib_test.mbt

# project_type = cli → templates/cli/
#   - templates/cli/moon.mod.json → moon.mod.json
#   - templates/cli/moon.pkg.json → src/moon.pkg.json
#   - templates/cli/main.mbt → src/main.mbt
#   - templates/cli/test.mbt → src/main_test.mbt

# project_type = c-ffi → templates/c-ffi/
#   - templates/c-ffi/moon.mod.json → moon.mod.json
#   - templates/c-ffi/moon.pkg → src/moon.pkg
#   - templates/c-ffi/ffi.mbt → src/ffi.mbt
#   - 还需要: wrapper.c, prepare.py

# project_type = wasm → templates/wasm/
#   - templates/wasm/moon.mod.json → moon.mod.json
#   - templates/wasm/moon.pkg.json → src/moon.pkg.json
#   - templates/wasm/ffi.mbt → src/internal/ffi/top.mbt
#   - templates/wasm/test.mbt → src/lib_test.mbt
```

### 3. 验证

```bash
# lib:   moon check --target native && moon test --target native
# cli:   moon check --target native && moon test --target native
# c-ffi: moon check --target native
# wasm:  moon check --target wasm && moon test --target wasm
# 如果失败: 检查模板配置是否正确
```

### 4. 展示给用户

```markdown
## 项目骨架已生成

**类型**: {project_type}
**模板**: templates/{project_type}/
**文件**:
- {文件列表}

**验证**: moon check ✅ | moon test ✅

**可以继续吗？**
```

## 输出

```json
{
  "status": "created",
  "project_type": "lib",
  "templates_used": "templates/lib/",
  "files": ["moon.mod.json", "src/lib.mbt", "src/lib_test.mbt"],
  "verification": "pass"
}
```