---
name: moonbit-evaluate
description: "Use when evaluating or publishing a MoonBit project — the LAST step before publishing. Triggered by user phrases like 'publish', 'release', 'deploy', 'done', 'ready to ship', 'final check', or after all verification passes. Make sure verify passed first."
---

# Evaluate — 验收评估 + 发布准备

## 职责

最终验收 + 发布准备。**Agent 委托 verify 做门禁→按项目类型执行专属验证→生成文档/CI→用户决定是否发布。**

## The Iron Law

```
NO PUBLISH WITHOUT FULL VERIFICATION
```

发布前必须通过 `moonbit-verify` 全量门禁（H1-H5）+ 类型专属验证。任何硬性检查失败则阻断发布，不得跳过。

## Red Flags — STOP and Re-evaluate

If you catch yourself doing any of these, you are violating the evaluate contract:

- 跳过 verify 直接做发布准备（"刚才已经跑过测试了"）
- 替用户决定版本号
- 未展示 CI/README diff 就直接写入
- 覆盖用户已有的 CI 配置而不询问
- verify 失败后仍声称"可以发布"

**All of these mean: Stop. Re-run verify first.**

## 停止条件

- verify 硬性检查（H1-H5）未通过 → 返回 implement 修复，不继续发布
- 用户未确认版本号 → 等待用户输入
- 临时 consumer 编译失败（lib 项目）→ 报告错误，阻断发布
- `moon run` 失败或输出为空（main 项目）→ 报告错误，阻断发布
- 用户说"再改改" → 返回 implement

## 项目类型检测

检测逻辑详见 [`references/type-detection.md`](../references/type-detection.md)，与 verify 共用同一份检测逻辑，避免漂移。

类型决定发布验证路径的差异。

## 验收标准

### 通用硬性要求（所有项目类型）

| 条件 | 检查方式 | 阻断 |
|------|---------|------|
| 完整验证通过 | 委托 `moonbit-verify` 的 H1-H5 | 是 |
| 代码格式正确 | `moon fmt --check` | 是 |
| 类型检查无警告 | `moon check --warn-list +73` | 是 |
| 所有测试通过 | `moon test --target native` | 是 |
| 无意外改动 | `git status --porcelain` | 是 |
| 用户确认版本号 | 用户输入 | 是 |

### MAIN 项目（可执行程序）专属验证

main 项目的类型专属验证（H6：`moon run .` + 输出非空）已在 `moonbit-verify` 中定义，详见 [`verify/SKILL.md` 的 H6 章节](../skills/verify/SKILL.md#h6-main-项目可执行程序额外检查)。

evaluate 阶段在此之上追加：

```bash
# 生成 CI（含 moon run 验证）
# 见下方"生成 CI 配置"章节
```

**阻断条件：** 沿用 verify 的 H6 阻断条件（`moon run` 失败或输出为空则阻断发布）。

### LIB 项目（library 库）专属验证

lib 项目的类型专属验证（H7：临时 consumer 编译验证）已在 `moonbit-verify` 中定义，详见 [`verify/SKILL.md` 的 H7 章节](../skills/verify/SKILL.md#h7-lib-项目library库额外检查)。

evaluate 阶段在此之上追加：

```bash
# 验证跨平台兼容（evaluate 专属，verify S1 为软性，此处为硬性）
moon check --target all

# 生成 README 文档（lib 专属）
moon info --target native > src/README.mbt.md
moon test --target native -f "usage" # 验证文档示例可运行
```

**阻断条件：** 沿用 verify 的 H7 阻断条件；`moon check --target all` 失败也阻断发布。

## 执行流程

### 1. 委托 verify 做全量门禁

调用 `moonbit-verify` 技能，确保硬性要求 H1-H5 全部通过。如果 verify 失败，返回 `moonbit-implement` 修复，不继续发布。

### 2. 项目类型专属验证

```
委托 verify 通过
    │
    ▼
检测项目类型
    │
    ├── main 项目 → moon run + 输出验证 + CI 含 run
    │
    └── lib 项目  → moon add + moon check --target all + README 生成
```

### 3. 生成 CI 配置（预览模式，用户批准后写入）

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: moonbitlang/moonbit-toolchain@v1
      - run: moon fmt --check && moon check --warn-list +73 && moon test --target native && moon info --target native
      - run: moon-audit pipeline .
```

**注意：** 如果 `.github/workflows/ci.yml` 已存在，展示 diff 给用户，用户批准后写入。不覆盖用户自定义 workflow。

### 4. 发布检查清单

```markdown
## 发布检查清单

- [x] 完整验证管道通过（moonbit-verify H1-H5）
- [x] 项目类型验证通过（main: moon run . | lib: 临时 consumer 编译验证）
- [x] 文档示例可运行（如有 usage 测试）
- [x] CI 配置已生成（用户批准后写入）
- [ ] 用户确认版本号
- [ ] 用户执行 `moon publish`（需要 mooncakes 账号）
```

## 各类型发布策略

| 类型 | 项目分类 | 发布方式 | 专属验证 |
|------|---------|---------|---------|
| lib | library | mooncake 包 | 临时 consumer 编译 + `moon check --target all` |
| cli | main | 可执行文件 + mooncake | `moon run .` + 输出验证 |
| c-ffi | library | mooncake 包 | 临时 consumer 编译 + ASan（可选） |
| wasm | library | WASM 模块 + mooncake | `moon check --target wasm-gc` |
| parser | library | mooncake 包 | `moon test -f "valid/invalid/edge"` |
| async | library | mooncake 包 | 并发测试、超时测试 |

## 用户 vs Agent 分工

| 谁 | 做什么 |
|---|--------|
| **Agent** | 委托 verify 做门禁、类型专属验证、生成 README 和 CI 预览、检查发布就绪 |
| **用户** | 判断质量是否达标、确认版本号、审查 README/CI diff、执行 `moon publish` |

## 输出

```json
{
  "status": "approved | needs_fix",
  "project_type": "main",
  "verification": "pass (H1-H5 all green)",
  "type_specific": {
    "moon_run": "pass (output: 'Hello World')"
  },
  "files_created": [".github/workflows/ci.yml"],
  "publish_ready": true,
  "user_decision": "approved",
  "next": "publish | implement"
}
```

```json
{
  "status": "approved | needs_fix",
  "project_type": "lib",
  "verification": "pass (H1-H5 all green)",
  "type_specific": {
    "moon_add": "pass",
    "cross_platform": "pass (native+wasm)"
  },
  "files_created": ["src/README.mbt.md", ".github/workflows/ci.yml"],
  "publish_ready": true,
  "user_decision": "approved",
  "next": "publish | implement"
}
```

## 下一步

发布完成或用户说"再改"后，回到 `moonbit-implement` 继续任务。

## 错误恢复

| 问题 | 诊断 | 修复 |
|------|------|------|
| verify 未通过 | 硬性检查失败 | 返回 `moonbit-implement` 修复 |
| `moon run` 失败 | main 包声明或代码错误 | 检查 `moon.pkg` 的 `pkgtype(kind: "executable")`，修复后重试 |
| 临时 consumer 编译失败 | 库依赖不可解析 | 检查 `moon.mod` 和模块结构，修复后重试 |
| `moon check --target all` 失败 | 跨平台兼容问题 | 报告失败的目标平台，用户决定是否继续 |
| CI 配置已存在 | 用户拒绝覆盖 | 展示 diff，用户批准后合并 |
| `moon-audit` 不可用 | 命令未找到 | `moon add minie135/moon-audit`，非阻断 |
