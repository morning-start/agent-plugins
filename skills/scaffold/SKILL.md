---
name: moonbit-scaffold
description: "Use when generating a MoonBit project skeleton from templates. Triggered by user phrases like 'scaffold', 'generate', 'skeleton', or when moon.mod is missing and a new project needs file structure."
---

# Scaffold - Project Skeleton

## Responsibility

Create a minimal, buildable MoonBit project before implementation. The user chooses the project type and package name. The agent copies the template, applies those names, and runs the type-aware checks.

## Supported templates

| Type | Template | Files |
| --- | --- | --- |
| `lib` | `templates/lib/` | `moon.mod`, `moon.pkg`, `lib.mbt`, `test.mbt` |
| `cli` | `templates/cli/` | `moon.mod`, `moon.pkg`, `main.mbt`, `test.mbt` |
| `c-ffi` | `templates/c-ffi/` | `moon.mod`, `moon.pkg`, `ffi.mbt`, `lib.mbt`, `test.mbt`, `wrapper.c`, `README.mbt.md` |
| `wasm` | `templates/wasm/` | `moon.mod`, `moon.pkg`, `ffi.mbt`, `test.mbt` |

All templates use the current MoonBit metadata format (`moon.mod` and `moon.pkg`). Do not generate the obsolete `.json` metadata filenames.

## Inputs

Confirm these values before copying files:

```text
project_type: lib | cli | c-ffi | wasm
package_name: MoonBit package name
target: native | wasm | js, as supported by the selected type
```

能力型项目的降级规则：

| capability | primary_type | 额外动作 |
|------------|--------------|----------|
| `parser` | `lib` 或 `cli` | 使用对应模板，再创建 lexer/tokenize/parser/validate 分层 |
| `async` | `lib` 或 `cli` | 使用对应模板，再添加 async 依赖和 event_loop/task/io 目录 |

不要把 `parser` 或 `async` 直接当作独立模板类型。

## Generation mapping

Copy the selected directory into the project root and preserve the filenames. Replace package placeholders only when they exist in the template.

```text
templates/{type}/moon.mod  -> moon.mod
templates/{type}/moon.pkg  -> moon.pkg
templates/{type}/*.mbt     -> matching source files
```

Do not invent `wrapper.c`, `prepare.py`, or nested source paths unless the selected project explicitly requires them and the user approves the additional files.

## Validation

Run the checks from the generated project directory:

```bash
moon fmt --check
moon check --target native
moon test --target native
```

For a WASM project, also run:

```bash
moon check --target wasm
moon test --target wasm
```

If the toolchain supports `wasm-gc`, also run:

```bash
moon check --target wasm-gc
```

If the toolchain is unavailable, report the toolchain error and do not claim that the scaffold passed validation.

## Output

```json
{
  "status": "scaffolded | blocked",
  "project_type": "lib",
  "package_name": "example/package",
  "template": "templates/lib/",
  "files_created": ["moon.mod", "moon.pkg", "lib.mbt", "test.mbt"],
  "validation": {"fmt": "passed", "check": "passed", "test": "passed"},
  "next": "implement"
}
```

## Failure recovery

| Failure | Action |
| --- | --- |
| Unknown project type | Ask the user to choose one of the supported types. |
| Template missing | Report the missing path and stop before implementation. |
| MoonBit command unavailable | Report the toolchain prerequisite; do not report validation success. |
| Validation failure | Show the failing command and return to plan or implementation. |

After the scaffold is validated, continue with `moonbit-implement`.
