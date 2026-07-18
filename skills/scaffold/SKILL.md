---
name: scaffold
description: "Generate a MoonBit project skeleton from templates. Use when the user says 'create project', 'scaffold', 'set up', 'start a new package', or when a moon.mod.json is missing. Agent creates project structure based on project_type: lib, cli, c-ffi, or wasm. Uses templates/{type}/ files. Run this before any implementation work."
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

## 类型感知分支

根据 `project_type` 选择模板：

| 项目类型 | 模板目录 | 关键文件 |
|---------|---------|---------|
| `lib` | `templates/lib/` | `moon.mod.json`, `moon.pkg.json`, `lib.mbt`, `test.mbt` |
| `cli` | `templates/cli/` | `moon.mod.json`, `moon.pkg.json`, `main.mbt` (含 @argparse) |
| `c-ffi` | `templates/c-ffi/` | `moon.mod.json`, `moon.pkg` (含 native-stub), `ffi.mbt` |
| `wasm` | `templates/wasm/` | `moon.mod.json`, `moon.pkg.json`, `ffi.mbt`, `test.mbt` |
| `parser` | 参考 `templates/lib/` + 分层 | `tokenize/`, `parser.mbt`, `lib.mbt` |
| `async` | 参考 `templates/lib/` + async 依赖 | 基于 `moonbitlang/async` |

## 幂等性

本技能可安全重复运行：

- **模板复制**: 始终 copy 而非 move，覆盖已存在文件
- **文件生成**: 检查存在性后再创建
- **验证管道**: 无状态

```bash
# Idempotency check: 重新脚手架
ls moon.mod.json src/moon.pkg src/lib.mbt
# 预期: 所有文件存在
# 重新运行: 覆盖模板文件，保留已修改的实现文件
```

## Checkpoint: scaffold

```bash
# 验证脚手架完整性
test -f moon.mod.json && echo "moon.mod.json: OK" || echo "moon.mod.json: MISSING"
test -f src/moon.pkg && echo "moon.pkg: OK" || echo "moon.pkg: MISSING"
test -f src/lib.mbt && echo "lib.mbt: OK" || echo "lib.mbt: MISSING"
moon check --target native && echo "check: OK" || echo "check: FAIL"
# 预期: 所有文件存在且 check 通过
# 如果失败: 检查模板配置
```

## 错误恢复速查表

| 命令 | 诊断 | 修复 | 升级 |
|------|------|------|------|
| `moon check` 失败 | E#### | 检查模板配置 | 手动创建文件 |
| 模板不存在 | 目录缺失 | 检查 templates/ 路径 | 使用默认模板 |
| 文件冲突 | 已存在同名文件 | 备份或覆盖 | 询问用户 |

## IDE 工具链

脚手架完成后用 IDE 验证生成结果：

```bash
moon info --target native
moon ide doc '<public_api>'
```

```bash
moon check --target native
moon info --target native
```

## 上游参考

- `moonbit-agent-guide` — MoonBit 项目布局与文件组织

