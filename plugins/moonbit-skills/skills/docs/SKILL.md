---
name: moonbit-docs
description: "Use ONLY in a MoonBit project (moon.mod / *.mbt present); do NOT use outside one. Use when writing, maintaining, or reviewing documentation for a MoonBit project — API docs (docstring), README, CHANGELOG, user guides, migration notes, and ADRs. Triggered by user phrases like 'write docs', 'add docstring', 'generate README', 'update changelog', 'write user guide', 'create ADR', 'document this', 'migration guide', 'add examples'. Also triggered when evaluate checks report doc completeness issues."
---

# Docs — 文档即代码

## 职责

为 MoonBit 项目提供完整的文档生命周期管理：
1. **API 文档** — `pub fn` docstring 规范与编写
2. **README** — 项目概览、安装、快速开始、示例
3. **CHANGELOG** — Keep a Changelog 格式维护
4. **用户指南 / 迁移说明** — 面向用户的完整指南
5. **ADR** — 架构决策记录

**Agent 分析文档债务 → 按类型补充文档 → 验证一致性 → 与代码同步更新。**

## The Iron Law

```
NO STALE DOCS
```

文档随代码持续演化。每次 API 变更、功能新增或行为修改时，必须同步更新对应的文档资产。未同步的文档视为文档债务，需在技能边界内修复。

### 可观察信号（机械化自检）

"文档与代码一致" 必须满足：

- [ ] **pub fn docstring**：所有公开函数/类型均有 docstring，且参数/返回值描述与签名一致
- [ ] **README 示例可运行**：README 中的代码示例可通过 `moon test` 验证
- [ ] **CHANGELOG 有 Unreleased 条目**：存在 `## [Unreleased]` 节且内容非空（如有代码变更）
- [ ] **CLI --help 非空**：main 项目的 CLI help 输出有内容
- [ ] **moon info 输出**：`moon info --target native` 生成的 API 表面文件反映实际代码

未满足以上任一信号 → Iron Law 触发：停止，补充文档后再继续。

## Red Flags — STOP and Re-evaluate

If you catch yourself doing any of these, you are violating the docs contract:

- 写 docstring 但不验证 `moon info` 输出是否包含文档
- 更新 API 签名但不更新对应 docstring
- CHANGELOG 只追加不维护（不合并/删除重复条目）
- 替用户覆盖已有 README 而不展示 diff
- 在代码变更后声称"文档之后再补"
- 写用户指南但示例不可运行

**All of these mean: Stop. Fix the docs gap first.**

## 停止条件

- 项目尚无 `moon.mod` → 提示先创建项目
- 代码尚不稳定（频繁 API 变更）→ 建议只在稳定接口上写 docstring
- 用户说"先不写文档" → 记录文档债务，标记为 blocked
- 文档更新破坏格式 → 回滚，重新编辑
- 目标文件已存在且用户拒绝覆盖 → 保留现有，标记为 skipped

## 项目类型差异

| 类型 | 文档要求 |
|------|---------|
| **lib** | pub fn docstring + README + CHANGELOG + ADR（按需） |
| **cli** | README + CLI --help + CHANGELOG + ADR（按需） |
| **ffi** | FFI 绑定说明 + 编译依赖 + 平台兼容性 |
| **wasm** | WASM 接口文档 + 运行时要求 |
| **parser** | 语言/格式规范文档 + 示例 |
| **async** | 并发模型说明 + 超时/错误行为 |

## 执行流程

### 1. 诊断文档覆盖

```bash
# 检查 pub fn docstring 覆盖率
moon info --target native 2>/dev/null | head -50

# 检查 README 存在性与内容
ls README.md 2>/dev/null && wc -l README.md || echo "No README.md"

# 检查 CHANGELOG 存在性与 Unreleased 条目
if [ -f CHANGELOG.md ]; then
  grep -q "Unreleased" CHANGELOG.md && echo "CHANGELOG: has Unreleased" || echo "CHANGELOG: no Unreleased"
else
  echo "CHANGELOG: not found"
fi

# 检查 CLI --help（main 项目）
moon run . -- --help 2>/dev/null && echo "CLI --help: OK" || echo "CLI --help: not available"
```

### 2. 编写 / 更新 API 文档（docstring）

MoonBit docstring 规范（`///` 三斜线）：

```moonbit
/// 计算两个数的最大公约数（GCD）
///
/// 使用欧几里得算法，支持正整数和零。
///
/// 参数：
/// - `a`：第一个整数
/// - `b`：第二个整数
///
/// 返回值：
/// `a` 和 `b` 的最大公约数
///
/// 示例：
/// ```
/// gcd(12, 8) // 4
/// gcd(7, 3)  // 1
/// ```
pub fn gcd(a : Int, b : Int) -> Int {
  if b == 0 { a } else { gcd(b, a % b) }
}
```

**要求**：
- 所有 `pub fn` / `pub type` / `pub struct` / `pub enum` 必须有 docstring
- 参数和返回值描述必须与签名一致（签名变更后立即更新）
- 示例代码必须可运行（放入测试中验证）

### 3. 生成 / 更新 README

README 结构规范（适用于 lib 和 cli 项目）：

```markdown
# 项目名称

一句话描述。_可选 badge 行_

## 安装

```bash
moon add <username>/<package>
```

## 快速开始

3-5 行代码展示最常用功能。示例代码必须可运行。

## API 概览

（按功能模块列出主要 pub fn，lib 项目专属）

## CLI 使用

（main 项目专属：命令示例和参数说明）

## 开发

构建、测试、贡献指南。

## 许可证

MIT
```

**约束**：
- 示例代码使用 moonbit fenced code block，并可通过 `moon test` 验证
- 不复制 `moon info` 生成的完整 API 列表，只做概览
- README 示例有场景意义（不写 "Hello World" 以外的无意义示例）

### 4. 维护 CHANGELOG

遵循 Keep a Changelog 规范，仅在 evaluate 触发或文档更新时写入：

```markdown
# Changelog

## [Unreleased]

### Added
- 新增功能（对应 feat commit）

### Changed
- 行为变更（非破坏性，对应 refactor/perf commit）

### Fixed
- Bug 修复（对应 fix commit）

### Removed
- 移除功能（对应 breaking change）

## [0.2.0] - 2026-07-15

### Added
- 新增 TOML 解析器

### Fixed
- 修复负数解析错误
```

**CHANGELOG 维护规则**：
- Unreleased 条目从 Conventional Commits 自动归集
- 发布时由 evaluate 将 Unreleased → 版本号 + 日期
- 不手动编辑已发布版本的内容
- 合并重复条目（同一 feature 的多次 commit 合并为一条）

### 5. 创建 / 更新 ADR（架构决策记录）

当涉及架构或 API 决策时，记录 ADR：

```markdown
# ADR-{序号}: {标题}

- **日期**: 2026-07-30
- **状态**: 已采纳 | 提议 | 已废弃
- **决策者**: {用户}

## 背景

{为什么需要这个决策？}

## 选项

### 选项 1：{方案 A}
{优点和缺点}

### 选项 2：{方案 B}
{优点和缺点}

## 决策

选择 {方案 X}，因为 {理由}。

## 影响

{正面和负面后果}
```

ADR 存储在 `docs/adr/` 目录，不混入代码目录。

### 6. 验证文档一致性

```bash
# 1. 验证 pub fn docstring 覆盖率（无未文档化的公开 API）
moon info --target native 2>/dev/null | grep "^pub" | head -5

# 2. 验证 README 示例可运行
moon test -f "usage" 2>/dev/null || echo "No usage tests; verify manually"

# 3. 验证 CHANGELOG 格式
if [ -f CHANGELOG.md ]; then
  head -5 CHANGELOG.md | grep -q "## \[Unreleased\]" && echo "CHANGELOG: OK" || echo "CHANGELOG: missing Unreleased"
fi

# 4. 验证 CLI --help（main 项目）
moon run . -- --help 2>/dev/null | head -3 || echo "No CLI --help"

# 5. 验证 docstring 与代码签名的同步
# docstring 函数名与 pub fn 签名匹配
grep -n "^  /// " src/**/*.mbt 2>/dev/null | head -10 || echo "No docstrings found"
```

## 与其它技能的边界

| 技能 | moonbit-docs 不做什么 |
|------|---------------------|
| `moonbit-evaluate` | 不做发布前文档预览校验（evaluate 负责校验完整性） |
| `moonbit-verify` | 不运行 E6 文档完整性门禁（verify 负责运行） |
| `moonbit-implement` | 不替 implement 写实现代码；只在 API 稳定后补文档 |
| `moonbit-writing-plans` | 不做设计→任务拆解；docs 是维护而非设计 |

## 用户 vs Agent 分工

| 谁 | 做什么 |
|---|--------|
| **Agent** | 诊断文档债务、编写/更新 docstring/README/CHANGELOG/ADR、验证文档一致性 |
| **用户** | 确认文档内容、审查 diff、批准 CHANGELOG 条目、决定 ADR 状态 |
| **evaluate** | 发布前校验文档完整性并生成 release notes |

## 输出

```json
{
  "status": "docs_updated | no_change | blocked",
  "project_type": "lib",
  "updated_files": [
    "src/lib.mbt",
    "README.md",
    "CHANGELOG.md",
    "docs/adr/001-parser-design.md"
  ],
  "doc_coverage": {
    "pub_fns_total": 12,
    "pub_fns_documented": 10,
    "missing_docstrings": 2,
    "coverage_pct": 83
  },
  "user_approval_required": true,
  "next": "verify | implement | evaluate"
}
```

## 错误恢复

| 问题 | 诊断 | 修复 |
|------|------|------|
| docstring 与签名不一致 | API 变更后未同步 | 重新检查所有 pub fn，补全/修复 docstring |
| README 示例不可运行 | 示例代码语法错误 | 将示例移入 `#[test] fn usage` 中验证 |
| CHANGELOG 格式错误 | 不符合 Keep a Changelog | 修正标题、版本号、日期格式 |
| ADR 文件已存在 | 序号冲突 | 递增序号，不覆盖现有 ADR |
| `moon info` 不输出文档 | 工具链限制 | 报告工具链版本，跳过自动验证 |

## 下一步

文档更新完成后，通常进入 `moonbit-verify` 执行验证门禁，或进入 `moonbit-implement` 继续开发。如果文档更新在 evaluate 阶段触发，回到 evaluate 继续发布准备。
