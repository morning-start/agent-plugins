---
name: moonbit-evaluate
description: "Use when evaluating or publishing a MoonBit project — the LAST step before publishing. Triggered by user phrases like 'publish', 'release', 'deploy', 'done', 'ready to ship', 'final check', or after all verification passes. Make sure verify passed first. After evaluation approval, delegate deployment to moonbit-cd."
---

# Evaluate — 验收评估 + 发布准备

## 职责

最终验收 + 发布准备。**Agent 委托 verify 做门禁→按项目类型执行专属验证→生成文档/CI→用户决定是否发布。**

**项目级验收 = 任务级验收清单汇总**：实现按模块/任务小步交付（`moonbit-task` / `moonbit-implement`），因此发布前先汇总每个 Task 的逐项验收结果，确认所有模块的验收项均已通过，再执行全量门禁。

## The Iron Law

```
NO PUBLISH WITHOUT FULL VERIFICATION AND ROLLBACK READINESS
```

发布前必须通过 `moonbit-verify` 全量门禁（B1-B4 + C1）+ 类型专属验证。任何基础测试或 Custom 测试失败则阻断发布，不得跳过。发布时必须附带回滚预案（评估发布回退路径）。**未逐项验收全部 Task 验收清单时，不得声称项目可交付。**

## Red Flags — STOP and Re-evaluate

If you catch yourself doing any of these, you are violating the evaluate contract:

- 跳过 verify 直接做发布准备（"刚才已经跑过测试了"）
- 替用户决定版本号
- 未展示 CI/README diff 就直接写入
- 覆盖用户已有的 CI 配置而不询问
- verify 失败后仍声称"可以发布"

**All of these mean: Stop. Re-run verify first.**

## 停止条件

- verify 基础测试（B1-B4）未通过 → 返回 implement 修复，不继续发布
- 用户未确认版本号 → 等待用户输入
- 临时 consumer 编译失败（lib 项目）→ 报告错误，阻断发布
- `moon run` 失败或输出为空（main 项目）→ 报告错误，阻断发布
- 用户说"再改改" → 返回 implement

## 项目类型检测

检测逻辑详见 [`references/type-detection.md`](../../references/type-detection.md)，与 verify 共用同一份检测逻辑，避免漂移。

类型决定发布验证路径的差异。

## 验收标准

### 任务验收清单汇总（所有项目必做）

发布前先汇总实现阶段的逐项验收结果（来自 `moonbit-task` / `moonbit-implement` 的输出 JSON）：

```json
{
  "task_acceptance_summary": {
    "total_tasks": 7,
    "accepted_tasks": 7,
    "total_acceptance_items": 24,
    "passed_items": 24,
    "failed_items": 0
  }
}
```

**判定标准：** 全部 Task 的验收项通过（failed_items = 0），未通过的任务回到 implement 修复，不进入发布流程。

### 通用验证要求（所有项目类型）

| 条件 | 检查方式 | 阻断 |
|------|---------|------|
| 完整验证通过 | 委托 `moonbit-verify` 的 B1-B4 + C1 | 是 |
| 代码格式正确 | `moon fmt --check` | 是 |
| 类型检查无警告 | `moon check --warn-list +73` | 是 |
| 所有测试通过 | `moon test --target native` | 是 |
| 无意外改动 | `git status --porcelain` | 是 |
| 用户确认版本号 | 用户输入 | 是 |
| CHANGELOG 完整性 | 存在 Unreleased 条目且内容非空 | 是 |
| 回滚预案已评估 | 发布回退路径已确认 | 是（lib 项目） / 否（cli 项目需确认） |

### MAIN 项目（可执行程序）专属验证

main 项目的类型专属验证（C2：`moon run .` + 输出非空）已在 `moonbit-verify` 中定义，详见 [`verify/SKILL.md` 的 C2 章节](../verify/SKILL.md#c2-main-项目可执行验证cli-项目必选)。

evaluate 阶段在此之上追加：

```bash
# 生成 CI（含 moon run 验证）
# 见下方"生成 CI 配置"章节
```

**阻断条件：** 沿用 verify 的 C2 阻断条件（`moon run` 失败或输出为空则阻断发布）。

### LIB 项目（library 库）专属验证

lib 项目的类型专属验证（C3：临时 consumer 编译验证）已在 `moonbit-verify` 中定义，详见 [`verify/SKILL.md` 的 C3 章节](../verify/SKILL.md#c3-lib-项目消费验证libffiwasmasyncparser-项目必选)。

evaluate 阶段在此之上追加：

```bash
# 验证跨平台兼容（evaluate 专属，verify E1 为增强，此处为硬性）
moon check --target all

# 检查文档同步（调用 verify 的 E6 文档完整性检查）
# pub fn docstring 完整性、README 示例可运行、CLI --help 非空
# 文档问题不阻断发布，但报告给用户决策

# 生成/同步 README 文档（lib 专属）
moon info --target native > src/README.mbt.md
moon test --target native -f "usage" # 验证文档示例可运行
```

**阻断条件：** 沿用 verify 的 C3 阻断条件；`moon check --target all` 失败也阻断发布。

## 版本号决策指导

用户确认版本号时，Agent 自动比对当前公开 API 表面与上一 Tag 的签名差异，基于 SemVer 规范给出建议（不替用户决定）:

```bash
# 1. 获取上一 Release Tag
LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")

# 2. 比对公开 API 表面差异（pkg.generated.mbti）
if [ -n "$LAST_TAG" ] && git cat-file -e "$LAST_TAG:pkg.generated.mbti" 2>/dev/null; then
  git diff "$LAST_TAG:pkg.generated.mbti" pkg.generated.mbti
fi
```

| 变更类型 | 版本升级 | 比对与判断依据 |
|---------|---------|---------------|
| **Breaking change** (破坏性变更) | **major** | 存在 `pub fn` / `pub type` 移除、变更为不可见、或参数/返回值签名变更 |
| **Minor feature** (向后兼容新特性) | **minor** | 无破坏性修改，仅在 `pkg.generated.mbti` 中新增 `pub` 符号 |
| **Bug fix / 内部优化** (内部变更) | **patch** | `pkg.generated.mbti` 签名全量一致，无 API 表面变化 |
| **无代码变更** (仅文档/CI) | **无升级** | 仅 `README.md`、`.github/` 等非代码文件改动 |

Agent 自动展示 API Signature Diff，给出建议版本号和升级类型，由用户最终确认。
## 执行流程

### 1. 委托 verify 做全量门禁

调用 `moonbit-verify` 技能，确保基础测试 B1-B4 全部通过，Custom 测试 C1 通过。如果 verify 失败，返回 `moonbit-implement` 修复，不继续发布。

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

### 4. 生成 CHANGELOG 条目（预览模式，用户批准后写入）

```markdown
## [Unreleased] → [{version}] - {YYYY-MM-DD}

### Added
- {新增功能}

### Changed
- {变更项}

### Fixed
- {修复项}

### Removed
- {移除项}
```

**注意:** 遵循 Keep a Changelog 规范。如果 `CHANGELOG.md` 已存在，追加到 Unreleased 段落下；不存在则创建。展示 diff 给用户，用户批准后写入。

### 5. 生成文档预览（lib 项目专属）

```bash
# 生成 API 文档预览（不写入仓库，仅展示）
moon doc --target native --target-dir /tmp/moonbit-doc-preview

# 验证文档示例可运行（如有 usage 测试）
moon test --target native -f "usage"
```

**注意:** `moon doc` 不可用时跳过此步骤，报告工具链缺失。文档预览不阻断发布，供用户决策。

### 5a. 生成 Release Notes

在 CHANGELOG 基础上，生成面向用户的 release notes（用户批准后使用）：

```markdown
# Release {version} — {date}

## 亮点

{主要功能或修复的一句话总结}

## 变更详情

{从 CHANGELOG Unreleased 条目自动生成的描述}

## 升级指南

{如有破坏性变更，给出迁移步骤}

## 回退说明

如遇到问题，可回退到上一版本：`{rollback_command}`
```

**约束**：
- Release notes 在 CHANGELOG 基础上提炼，不重复全部条目
- 破坏性变更必须包含迁移步骤
- 生成后展示预览，用户批准后定稿

### 5b. 评估回滚预案

在发布前评估回退路径。lib 项目评估简单回退（mooncakes 版本回滚），cli 项目需要生成回滚策略：

```bash
# 记录当前和上一个发布 tag
CURRENT_TAG="v{version}"
LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")

cat << ROLLBACK
## 回退预案

### 回退内容
- 代码回退：\`git revert ${CURRENT_TAG}\`
- 版本回退：回退到 \`${LAST_TAG}\`

### 回退验证
1. \`moon test --target native\`
2. \`moon run .\`（main 项目）
3. \`moon info --target native && git diff --exit-code\`

### 参考
详细回滚执行由 \`moonbit-cd\` 负责（参见 skills/cd/SKILL.md）
ROLLBACK
```

**约束**：
- lib 项目：确保 mooncakes 包的上一版本可恢复
- cli 项目：执行回滚预案评估，但不替代 cd 的完整回滚计划
- 评估结果写入发布检查清单

### 6. 发布检查清单

```markdown
## 发布检查清单

- [x] 完整验证管道通过（moonbit-verify B1-B4 + C1）
- [x] 项目类型验证通过（main: moon run . | lib: 临时 consumer 编译验证）
- [x] 文档示例可运行（如有 usage 测试）
- [x] CI 配置已生成（用户批准后写入）
- [x] CHANGELOG 条目已生成（用户批准后写入）
- [x] API 文档预览已展示（lib 项目，moon doc 可用时）
- [x] Release notes 已生成（用户批准后定稿）
- [x] 回滚预案已评估
- [ ] 用户确认版本号（Agent 已给出 SemVer 建议）
- [ ] 用户确认执行发布（或委托 moonbit-cd 部署）
```

## 各类型发布策略

| 类型 | 项目分类 | 发布方式 | 专属验证 |
|------|---------|---------|---------|
| lib | library | mooncake 包 | 临时 consumer 编译 + `moon check --target all` |
| cli | main | 可执行文件 + mooncake | `moon run .` + 输出验证 |
| ffi | library | mooncake 包 | 临时 consumer 编译 + ASan（可选） |
| wasm | library | WASM 模块 + mooncake | `moon check --target wasm-gc` |
| parser | library | mooncake 包 | `moon test -f "valid/invalid/edge"` |
| async | library | mooncake 包 | 并发测试、超时测试 |

## 用户 vs Agent 分工

| 谁 | 做什么 |
|---|--------|
| **Agent** | 委托 verify 做门禁、类型专属验证、生成 README/CI/CHANGELOG/Release Notes 预览、给出 SemVer 建议、评估回滚预案、检查发布就绪 |
| **用户** | 判断质量是否达标、确认版本号（参考 Agent 建议）、审查 README/CI/CHANGELOG/Release Notes diff、执行 `moon publish` 或委托 `moonbit-cd` 部署 |

## 输出

```json
{
  "status": "approved | needs_fix",
  "project_type": "main",
  "verification": "pass (B1-B4 + C1 all green)",
  "task_acceptance": {"total_tasks": 7, "accepted_tasks": 7, "failed_items": 0},
  "type_specific": {
    "moon_run": "pass (output: 'Hello World')"
  },
  "semver_suggestion": {
    "bump_type": "patch",
    "current": "0.3.2",
    "suggested": "0.3.3",
    "reason": "Bug fix，公共 API 不变"
  },
  "files_created": [".github/workflows/ci.yml", "CHANGELOG.md"],
  "release_notes": "generated",
  "rollback_assessment": "pass (上一版本 v0.3.2 可回退)",
  "publish_ready": true,
  "user_decision": "approved",
  "next": "cd | publish | implement"
}
```

```json
{
  "status": "approved | needs_fix",
  "project_type": "lib",
  "verification": "pass (B1-B4 + C1 all green)",
  "type_specific": {
    "moon_add": "pass",
    "cross_platform": "pass (native+wasm)"
  },
  "semver_suggestion": {
    "bump_type": "minor",
    "current": "0.3.2",
    "suggested": "0.4.0",
    "reason": "新增 2 个 pub fn，向后兼容"
  },
  "files_created": ["src/README.mbt.md", ".github/workflows/ci.yml", "CHANGELOG.md"],
  "doc_preview": "generated (/tmp/moonbit-doc-preview)",
  "release_notes": "generated",
  "rollback_assessment": "pass (上一版本 v0.3.2 可回退)",
  "publish_ready": true,
  "user_decision": "approved",
  "next": "cd | publish | implement"
}
```

## 下一步

发布完成或用户说"再改"后，回到 `moonbit-implement` 继续任务。如果用户选择部署，委托 `moonbit-cd` 执行部署。

如果用户说"和想要的不一样"或验收阶段发现设计方向偏差，**触发设计回溯**：回到 `moonbit-plan` 重新设计 API 或调整需求，不在此阶段绕路修复。

## 错误恢复

| 问题 | 诊断 | 修复 |
|------|------|------|
| verify 未通过 | 基础测试或 Custom 测试失败 | 返回 `moonbit-implement` 修复 |
| `moon run` 失败 | main 包声明或代码错误 | 检查 `moon.pkg` 的 `pkgtype(kind: "executable")`，修复后重试 |
| 临时 consumer 编译失败 | 库依赖不可解析 | 检查 `moon.mod` 和模块结构，修复后重试 |
| `moon check --target all` 失败 | 跨平台兼容问题 | 报告失败的目标平台，用户决定是否继续 |
| CI 配置已存在 | 用户拒绝覆盖 | 展示 diff，用户批准后合并 |
| `moon-audit` 不可用 | 命令未找到 | `moon add minie135/moon-audit`，非阻断 |
| 发布后发现问题 | 生产环境 bug | 创建 hotfix 分支 → `moonbit-implement` 修复 → `moonbit-verify` → 重新发布 → 回溯到主分支 |
