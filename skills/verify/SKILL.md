---
name: moonbit-verify
description: "Use when running MoonBit verification gates — before claiming any work is done. Triggered by user phrases like 'review', 'check', 'audit', 'verify', 'test', 'quality', 'security', 'is it ready', 'does it pass'. Do NOT skip this before claiming done — always verify first."
---

# Verify — 全量检测门禁

## 职责

一站式验证管道，覆盖代码质量、工作区干净、API 设计、性能、安全、CI 完整性六大维度。**按项目类型（main可执行程序 / library库）分路径校验。** L1/L2 自动触发（git hooks），L3 全面检查（用户手动调用）。

## The Iron Law

```
NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE
```

验证命令执行后，确认 workspace 未产生非预期副作用。对于已知产物（如 `pkg.generated.mbti`）使用 allowlist，不触发阻断。

## Red Flags — STOP and Re-evaluate

If you catch yourself doing any of these, you are violating the verify contract:

- 声称"看起来没问题"而不执行命令（"刚才跑过了"）
- 跳过失败的硬性检查（"H4 只是工作区检查，不重要"）
- 用旧结果替代新鲜验证（"上次跑的时候通过了"）
- 自动修复涉及 public API 的问题而不报告
- 不区分 main/lib 项目类型，统一用一套验证

**All of these mean: Stop. Run fresh verification.**

## 停止条件

- 任一硬性检查（H1-H5）失败 → 阻断，修复后重跑
- 类型专属检查（H6/H7）失败 → 阻断，报告具体错误
- 验证命令产生非预期副作用（allowlist 外的文件改动）→ 报告，由用户决定
- 工具链不可用（`moon` 命令缺失）→ 报告，不声称验证通过

## 项目类型检测

进入验证前，先检测项目类型。检测逻辑详见 [`references/type-detection.md`](../references/type-detection.md)，此处不再重复以避免漂移。

类型决定验证路径的差异。

---

## 硬性要求（必选，阻断型）

以下检查为硬性门禁，任何一项不通过则阻断发布。

### H1. 代码格式一致性

```bash
moon fmt --check               # 格式合规：exit 0
moon fmt                        # 失败时自动修复
```

**判定标准：** `moon fmt --check` exit 0。

### H2. 类型安全

```bash
moon check --warn-list +73      # 类型安全 + 启用 E0073 无条件递归警告
moon explain --diagnostic E#### # 失败时定位具体错误
```

**判定标准：** exit 0，0 errors。

### H3. 功能完整性

```bash
moon test --target native        # 全部测试通过
moon test -f "failing_test"      # 失败时查看详情

# 验证测试覆盖类型
moon test -f "valid/"    # 快乐路径
moon test -f "invalid/"  # 错误路径
moon test -f "edge/"     # 边界条件
```

**判定标准：** Total tests = passed，failed = 0。覆盖 valid（快乐路径）+ invalid（错误路径）+ edge（边界条件）三种类型。

### H4. 工作区干净（发布准备阶段专用）

```bash
git status --porcelain           # 全面检测：tracked + untracked + staged
```

**判定标准：** `git status --porcelain` 输出为空。开发过程中的非预期文件改动（如 `moon info` 生成的 `pkg.generated.mbti`）应列入 allowlist，不触发阻断。

### H5. API 稳定性（通用 + lib 项目）

```bash
moon info --target native        # 公共 API 签名输出

# 更新 allowlist：pkg.generated.mbti 是预期产物
if [ -f "pkg.generated.mbti" ]; then
  git add "pkg.generated.mbti" 2>/dev/null || true
fi

# 检查 API 设计要求
moon info --target native | grep "pub fn"
moon info --target native | grep "pub(all)"
```

**判定标准：** `moon info` 输出与预期 API 表面一致，无意外新增/删除的 `pub` 符号。`pkg.generated.mbti` 是预期产物，不视为意外改动。

---

## 项目类型专属硬性要求

### H6. MAIN 项目（可执行程序）额外检查

```bash
# 项目类型检测：见 references/type-detection.md（与 evaluate 共用，避免漂移）
# main 项目进入此分支后，执行以下验证：

# 验证可运行（moon run . 运行当前目录主包；若主包在子目录则用 moon run ./cmd/main）
moon run .                        # exit 0 为通过

# 验证输出不为空
moon run . 2>&1 | grep -q "." || fail("moon run produced no output")
```

**判定标准：** `moon run` exit 0 且有 stdout 输出。

### H7. LIB 项目（library 库）额外检查

```bash
# 验证模块结构正确
test -f moon.mod || fail("moon.mod is required")
test -f moon.pkg || fail("moon.pkg is required")

# 临时 consumer 编译验证脚本见 references/type-detection.md（与 evaluate 共用，避免漂移）
# 执行该脚本验证当前 library 可被外部项目消费
```

**判定标准：** 临时 consumer 编译通过，验证当前 library 可被外部项目消费。

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
  ├── [可选] REQUEST SUB-SKILL: moonbit-code-review
  │   （若 implement 阶段未做审查，verify 可委托；否则跳过）
  │
  ├── H1. moon fmt --check
  ├── H2. moon check --warn-list +73
  ├── H3. moon test --target native
  ├── H4. git status --porcelain (发布阶段)
  ├── H5. moon info --target native
  │
  ├── [main] moon run .
  │   └── 或
  ├── [lib] 临时 consumer 编译验证
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
| **lib** | H1-H5 | 临时 consumer 编译验证 | S1-S5 |
| **cli (main)** | H1-H5 | moon run + 输出验证 | S1-S5 |
| **c-ffi** | H1-H4 | moon check native | S2-S5 |
| **wasm** | H1-H4 | moon check wasm + moon test wasm | S1-S5 |
| **async** | H1-H5 | — | S1-S5 |
| **parser** | H1-H5 | — | S1-S5 |

---

## 错误恢复

| 命令 | 诊断 | 修复 |
|------|------|------|
| `moon fmt --check` | 格式问题 | `moon fmt` 自动修复，重新检查 |
| `moon check` 失败 | `moon explain --diagnostic E####` | 检查类型签名 |
| `moon test` 失败 | `-f "failing_test"` | 修正断言 |
| `moon info` 失败 | 先 `moon check` | 类型正确后重试 |
| `moon run` 失败 | 检查 main 包声明 | `moon.pkg` 加 `pkgtype(kind: "executable")` |
| `moon-audit` 未安装 | 命令未找到 | `moon add minie135/moon-audit` |
| 临时目录编译失败 | workspace 路径错误 | 检查 `moon.work` 路径 |

## 输出

```json
{
  "status": "pass | blocked",
  "project_type": "main",
  "hard_checks": {
    "fmt": "pass",
    "check": "pass",
    "test": "pass (12/12)",
    "workspace": "pass (clean)",
    "api": "pass"
  },
  "type_specific": {
    "moon_run": "pass (output: 'Hello')"
  },
  "soft_checks": {
    "cross_platform": "pass",
    "security": "pass (0 findings)",
    "perf": "pass (1.2s)",
    "api_design": "pass (1 suggestion)",
    "ci_config": "pass"
  },
  "auto_fixes": [],
  "failures": [],
  "next": "implement | evaluate"
}
```

## 下一步

验证通过后，进入 `moonbit-evaluate` 做最终验收和发布准备。如果硬性检查失败，回到 `moonbit-implement` 修复问题。