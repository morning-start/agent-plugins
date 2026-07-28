---
name: moonbit-verify
description: "Use when running MoonBit verification gates — before claiming any work is done. Triggered by user phrases like 'review', 'check', 'audit', 'verify', 'test', 'quality', 'security', 'is it ready', 'does it pass'. Do NOT skip this before claiming done — always verify first."
---

# Verify — 全量检测门禁

## 职责

一站式验证管道，覆盖代码质量、API 设计、性能、安全、CI 完整性六大维度。**按项目类型（main可执行程序 / library库）分路径校验。** L1/L2 自动触发（git hooks），L3 全面检查（用户手动调用）。

## The Iron Law

```
NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE
NO COMMAND OUTPUT WITHOUT git diff --exit-code AFTER EACH STEP
```

每一道命令执行后，必须紧跟 `git diff --exit-code`，确保代码无意外改动。

## 项目类型检测

进入验证前，先检测项目类型：

```bash
# 检测是否为 main 包（可执行程序）
grep -q 'is_main' moon.pkg 2>/dev/null && PROJECT_TYPE="main" || PROJECT_TYPE="lib"
```

类型决定验证路径的差异。

---

## 硬性要求（必选，阻断型）

以下检查为硬性门禁，任何一项不通过则阻断发布。

### H1. 代码格式一致性

```bash
moon fmt --check               # 格式合规：exit 0
moon fmt                        # 失败时自动修复
git diff --exit-code             # 确认格式修复未引入意外改动
```

**判定标准：** `moon fmt --check` exit 0 或 `git diff --exit-code` 确认只有格式改动。

### H2. 类型安全

```bash
moon check --warn-list +73      # 类型安全 + 全部警告检查
moon check --explain E####       # 失败时定位具体错误
git diff --exit-code             # 确认类型检查未引入意外改动
```

**判定标准：** exit 0，0 errors。

### H3. 功能完整性

```bash
moon test --target native        # 全部测试通过
moon test --target native -- --show-output  # 失败时查看详情
git diff --exit-code             # 确认测试未引入意外改动

# 验证测试覆盖类型
moon test -f "valid/"    # 快乐路径
moon test -f "invalid/"  # 错误路径
moon test -f "edge/"     # 边界条件
```

**判定标准：** Total tests = passed，failed = 0。覆盖 valid（快乐路径）+ invalid（错误路径）+ edge（边界条件）三种类型。

### H4. 工作区干净

```bash
git diff --exit-code             # 无未提交改动
git diff --cached --exit-code    # 暂存区无意外改动（如有）
```

**判定标准：** 两条命令都 exit 0。

### H5. API 稳定性（通用 + lib 项目）

```bash
moon info --target native        # 公共 API 签名输出
git diff --exit-code             # 确认 info 未引入改动

# 检查 API 设计要求
moon info --target native | grep "pub fn"
moon info --target native | grep "pub(all)"
```

**判定标准：** `moon info` 输出与预期 API 表面一致，无意外新增/删除的 `pub` 符号。

---

## 项目类型专属硬性要求

### MAIN 项目（可执行程序）额外检查

```bash
# 验证 main 包声明正确
grep -q 'is_main' moon.pkg || fail("moon.pkg must declare is_main = true for executable projects")

# 验证可运行
moon run                         # 至少能正常启动
git diff --exit-code             # 确认 moon run 未产生副作用

# 验证输出不为空
moon run 2>&1 | grep -q "." || fail("moon run produced no output")
```

**判定标准：** `moon run` exit 0 且有 stdout 输出。

### LIB 项目（library 库）额外检查

```bash
# 验证可被本地安装引用
moon add moonbitlang/core        # 确保标准库依赖可解析
git diff --exit-code             # 确认 add 操作后的改动已知
# 注意：moon add 会产生 .moon-lock 和 _build/ 改动，这是预期行为

# 验证模块结构正确
test -f moon.mod || fail("moon.mod is required")
test -f moon.pkg || fail("moon.pkg is required")
```

**判定标准：** `moon add` 成功完成，核心元数据文件存在。

---

## 软性要求（可选，加分型）

以下检查为加分项，不阻断发布，但报告结果供用户决策。

### S1. 跨平台兼容性

```bash
moon check --target wasm         # WASM 目标（如适用）
moon check --target wasm-gc      # WASM GC 目标（如适用）
moon check --target js           # JS 目标（如适用）
```

### S2. 安全审计

```bash
moon-audit pipeline .            # 14 条 CWE 规则静态扫描
moon-audit --fail-on-error .     # Error 级别漏洞时 exit 1
```

### S3. 性能基线

```bash
# 记录测试执行时间
moon test --target native 2>&1 | tail -3
# 与上次 verify 对比，单次 > 5s 需排查
```

### S4. API 设计深度检查

| 检查项 | 合格标准 | 动作 |
|--------|---------|------|
| 参数类型 | `StringView` 而非 `String`（公开函数） | 报告，需用户确认 |
| 可选值 | `T?` 而非 `Option[T]` | 内部类型自动修复，公开函数报告 |
| 错误处理 | 返回 `Result[T, E]` 而非 panic | 报告并给出建议 |
| 自定义错误 | `derive(Debug, Eq, ToJson)` | 仅内部类型自动修复 |
| 枚举构造器 | 跨包构造需 `pub(all) enum` | 只报告 |
| `unused_mut` | `mut` 仅变量重新赋值时需要 | 谨慎处理 |

### S5. CI 配置完整性

```text
# .github/workflows/ci.yml 应包含：
# 1. checkout
# 2. moonbit toolchain 安装
# 3. moon fmt --check
# 4. moon check --warn-list +73
# 5. moon test --target native
# 6. moon info --target native
# 7. moon-audit pipeline .（推荐）
```

---

## 执行顺序

```
Start → 检测项目类型（main / lib）
  │
  ├── REQUEST SUB-SKILL: moonbit-code-review
  │
  ├── H1. moon fmt --check → git diff --exit-code
  ├── H2. moon check → git diff --exit-code
  ├── H3. moon test → git diff --exit-code
  ├── H4. git diff --exit-code (完整工作区验证)
  ├── H5. moon info → git diff --exit-code
  │
  ├── [main] moon run → git diff --exit-code
  │   └── 或
  ├── [lib]  moon add moonbitlang/core → git diff --exit-code
  │
  ├── S1. moon check --target all（可选）
  ├── S2. moon-audit pipeline .（可选）
  ├── S3. 性能基线（可选）
  ├── S4. API 深度检查（可选）
  └── S5. CI 配置检查（可选）
       │
       ▼
    报告结果 → 用户判断
```

**硬性要求（H1-H5 + 类型专属）必须全部通过**，任意一项失败则阻断，修复后重跑。
**软性要求（S1-S5）报告结果不阻断**，用户判断是否接受。

---

## 各类型验证全景

| 类型 | 硬性必选 | 项目专属 | 软性加分 |
|------|---------|---------|---------|
| **lib** | H1-H5 | moon add + 元数据验证 | S1-S5 |
| **cli (main)** | H1-H5 | moon run + 输出验证 | S1-S5 |
| **c-ffi** | H1-H4 | moon check native | S2-S5 |
| **wasm** | H1-H4 | moon check wasm + moon test wasm | S1-S5 |
| **async** | H1-H5 | — | S1-S5 |
| **parser** | H1-H5 | — | S1-S5 |

---

## 错误恢复

| 命令 | 诊断 | 修复 |
|------|------|------|
| `moon fmt --check` | 格式问题 | `moon fmt` 自动修复，`git diff --exit-code` 确认 |
| `moon check` 失败 | `--explain E####` | 检查类型签名 |
| `moon test` 失败 | `--show-output` | 修正断言 |
| `moon info` 失败 | 先 `moon check` | 类型正确后重试 |
| `moon run` 失败 | 检查 main 包声明 | `moon.pkg` 加 `is_main = true` |
| `moon-audit` 未安装 | 命令未找到 | `moon add minie135/moon-audit` |
| `git diff --exit-code` | 有未提交改动 | 提交或 stash 后再验证 |

## 输出

```json
{
  "status": "pass | blocked",
  "project_type": "main",
  "hard_checks": {
    "fmt": "pass",
    "fmt_git_diff": "pass (clean)",
    "check": "pass",
    "test": "pass (12/12)",
    "info": "pass",
    "git_diff": "pass (clean)"
  },
  "type_specific": {
    "moon_run": "pass (output: 'Hello World')"
  },
  "soft_checks": {
    "cross_platform": "pass",
    "security": "pass (0 findings)",
    "perf": "pass (1.2s)",
    "api_design": "pass (1 suggestion)",
    "ci_config": "pass"
  },
  "auto_fixes": ["moon fmt auto-format"],
  "failures": [],
  "next": "implement | evaluate"
}
```

## 下一步

验证通过后，进入 `moonbit-evaluate` 做最终验收和发布准备。如果硬性检查失败，回到 `moonbit-implement` 修复问题。
