---
name: moonbit-verify
description: "Use when running MoonBit verification gates — before claiming any work is done. Triggered by user phrases like 'review', 'check', 'audit', 'verify', 'test', 'quality', 'security', 'is it ready', 'does it pass'. Do NOT skip this before claiming done — always verify first."
---

# Verify — 三级检测门禁

## 职责

一站式验证管道，按三级体系分层检测：

- **基础测试（B）** — 所有 MoonBit 项目必选，通过后才能声称代码可用
- **Custom 测试（C）** — 按项目类型选择：lib/cli/wasm/ffi 各有专属验证
- **增强测试（E）** — 推荐但非阻断，报告结果供用户决策

按项目类型分路径校验。L1/L2 自动触发（git hooks），L3 全面检查（用户手动调用）。

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

- 任一基础测试（B1-B4）失败 → 阻断，修复后重跑
- Custom 测试（C1-C3）失败 → 阻断，报告具体错误
- 验证命令产生非预期副作用（allowlist 外的文件改动）→ 报告，由用户决定
- 工具链不可用（`moon` 命令缺失）→ 报告，不声称验证通过

## 项目类型检测

进入验证前，先检测项目类型。检测逻辑详见 [`references/type-detection.md`](../../references/type-detection.md)，此处不再重复以避免漂移。

类型决定验证路径的差异。

---

## 基础测试（B — 所有项目必选）

以下检查为通用门禁，任何 MoonBit 项目均须通过，否则不能声称代码可用。

### B1. 代码格式一致性

```bash
moon fmt --check               # 格式合规：exit 0
moon fmt                        # 失败时自动修复
git diff --exit-code             # 确认格式修复后工作区干净
```

**判定标准：** `moon fmt --check` exit 0。若自动修复，`git diff --exit-code` 必须为 0 以确认修复后无残留差异。

### B2. 类型安全

```bash
moon check --warn-list +73      # 类型安全 + 启用 E0073 无条件递归警告
moon explain --diagnostic E#### # 失败时定位具体错误
```

**判定标准：** exit 0，0 errors。

### B3. 功能完整性

```bash
moon test                        # 全部测试通过（目标由项目类型决定）
moon test -f "failing_test"      # 失败时查看详情

# 验证测试覆盖类型
moon test -f "valid/"    # 快乐路径
moon test -f "invalid/"  # 错误路径
moon test -f "edge/"     # 边界条件
```

**判定标准：** Total tests = passed，failed = 0。覆盖 valid（快乐路径）+ invalid（错误路径）+ edge（边界条件）三种类型。

### B3a. 按模块/任务验证子集（单 Task 完成时）

实现按模块/任务小步推进（见 `moonbit-writing-plans` 的 Phase 和 `moonbit-implement` 的模块化小步实现），因此验证也支持子集粒度：

```bash
# 单任务/模块验证：只跑当前 Task 的测试
moon test -f "task_x_*"              # 聚焦当前功能点
moon fmt --check                     # 格式仍全量检查（低成本）
moon check --warn-list +73           # 类型仍全量检查

# 阶段（Phase）验证：某个模块完成后独立验证该模块
moon test -f "lexer_*"               # lexer 模块测试全绿
```

**契约**：
- **单 Task 完成时**：`-f` 子集验证即可证明该功能点，但**声称"任务完成"前仍须全量验证一次**（B1-B4）。
- **Phase/模块完成时**：该模块测试全绿 + 全量 B1-B4 通过，才能声称模块交付。
- 子集验证 ≠ 全量验证：子集用于快速反馈，全量用于交付声明。

### B4. 工作区干净（发布准备阶段专用）

```bash
git status --porcelain           # 全面检测：tracked + untracked + staged
```

**判定标准：** `git status --porcelain` 输出为空。开发过程中的非预期文件改动（如 `moon info` 生成的 `pkg.generated.mbti`）应列入 allowlist，不触发阻断。

---

## Custom 测试（C — 按项目类型选择）

不同项目类型有不同的验证标准。以下检查由项目类型决定是否执行，属于该类型则必选。

### C1. API 稳定性（lib/cli/parser/async 项目必选）

ffi 和 wasm 项目豁免（对外接口是 C ABI 或 WASM 导出，不依赖 MoonBit pub API）。

```bash
# 类型检测前置：C1 仅对 lib/cli/parser/async 执行
# ffi 和 wasm 跳过此检查
if [ "$PROJECT_TYPE" != "ffi" ] && [ "$PROJECT_TYPE" != "wasm" ]; then
  moon info --target native        # 公共 API 签名输出
  git diff --exit-code pkg.generated.mbti
  if [ -f "pkg.generated.mbti" ]; then
    git add "pkg.generated.mbti" 2>/dev/null || true
  fi
  moon info --target native | grep "pub fn"
  moon info --target native | grep "pub(all)"
fi
```

**判定标准：** lib/cli/parser/async 项目：`moon info` 输出与预期 API 表面一致，无意外新增/删除的 `pub` 符号。`git diff --exit-code pkg.generated.mbti` 必须为 0。ffi 和 wasm 跳过此检查，不阻断。

### C2. MAIN 项目可执行验证（cli 项目必选）

```bash
moon run .                        # exit 0 为通过
moon run . 2>&1 | grep -q "." || fail("moon run produced no output")
```

**判定标准：** `moon run` exit 0 且有 stdout 输出。lib/wasm/ffi/async/parser 跳过此检查。

### C3. LIB 项目消费验证（lib/ffi/wasm/async/parser 项目必选）

```bash
test -f moon.mod || fail("moon.mod is required")
test -f moon.pkg || fail("moon.pkg is required")
# 临时 consumer 编译验证脚本见 references/type-detection.md
```

**判定标准：** 临时 consumer 编译通过，验证当前 library 可被外部项目消费。main/cli 项目跳过此检查。

---

## 增强测试（E — 推荐但非阻断）

以下检查为推荐项，不阻断发布，但报告结果供用户决策。

### E1. 跨平台兼容性

```bash
moon check --target wasm         # WASM 目标（如适用）
moon check --target wasm-gc      # WASM GC 目标（如适用）
moon check --target js           # JS 目标（如适用）
```

### E2. 安全审计

```bash
moon-audit pipeline .            # 14 条 CWE 规则静态扫描
moon-audit --fail-on-error .     # Error 级别漏洞时 exit 1
```

检测到依赖变更时（`moon.mod` 或 `moon.pkg` 中的依赖条目变化），主动建议运行 `moon-audit` 审计新依赖。

### E3. 性能基线

> 性能优化详见 [`moonbit-perform`](../perform/SKILL.md)。E3 提供粗粒度信号，perform 提供独立优化循环。

```bash
# 记录测试执行时间
moon test 2>&1 | tail -3
# 与上次 verify 对比，单次 > 5s 需排查
```

### E4. API 设计深度检查

| 检查项 | 合格标准 | 动作 |
|--------|---------|------|
| 参数类型 | `StringView` 而非 `String`（公开函数） | 报告，需用户确认 |
| 可选值 | `T?` 而非 `Option[T]` | 内部类型自动修复，公开函数报告 |
| 错误处理 | 返回 `Result[T, E]` 而非 panic | 报告并给出建议 |
| 自定义错误 | `derive(Debug, Eq, ToJson)` | 仅内部类型自动修复 |
| 枚举构造器 | 跨包构造需 `pub(all) enum` | 只报告 |
| `unused_mut` | `mut` 仅变量重新赋值时需要 | 谨慎处理 |

### E5. CI 配置完整性

```text
# .github/workflows/ci.yml 应包含：
# 1. checkout
# 2. moonbit toolchain 安装
# 3. moon fmt --check
# 4. moon check --warn-list +73
# 5. moon test
# 6. moon info --target native
# 7. moon-audit pipeline .（推荐）
```

### E6. 文档完整性

| 检查项 | 合格标准 | 动作 |
|--------|---------|------|
| pub fn docstring | 每个导出的 pub fn 有 `///` comment | 报告缺失项 |
| README 示例 | README 中的 usage 测试可运行 | 报告失败 |
| CLI --help | `moon run . --help` 输出非空 (main 项目) | 报告缺失 |
| docstring 格式 | `///` 注释无语法错误 | 报告格式问题 |

---

## 执行顺序

```
Start → 检测项目类型（main / lib / wasm / ffi / parser / async）
  │
  ├── [可选] REQUEST SUB-SKILL: moonbit-code-review
  │   （若 implement 阶段未做审查，verify 可委托；否则跳过）
  │
  ├── B1. moon fmt --check               ← 基础测试（所有项目必选）
  ├── B2. moon check --warn-list +73
  ├── B3. moon test
  ├── B4. git status --porcelain (发布阶段)
  │
  ├── C1. moon info --target native       ← Custom 测试（按类型选择）
  ├── [main] moon run .                  ← C2
  ├── [lib] 临时 consumer 编译验证        ← C3
  │
  ├── E1. moon check --target all         ← 增强测试（推荐非阻断）
  ├── E2. moon-audit pipeline .
  ├── E3. 性能基线
  ├── E4. API 深度检查
  ├── E5. CI 配置检查
  └── E6. 文档完整性检查
       │
       ▼
    报告结果 → 用户判断
```

**基础测试（B1-B4）必须全部通过**，任意一项失败则阻断，修复后重跑。
**Custom 测试（C1-C3）按项目类型执行**，属于该类型则必选，失败阻断。
**增强测试（E1-E6）报告结果不阻断**，用户判断是否接受。

> **CI 失败反向回落**：如果本地验证通过但远程 CI（GitHub Actions 等）失败（如跨平台兼容、WASM 运行时、编译器版本差异），回到 `moonbit-implement` 的 **Bug Fix Mode**，使用 CI 失败日志接入规范（Log Ingestion）进行诊断与修复。

---

## 各类型验证全景

| 类型 | 基础测试（B） | Custom 测试（C） | 增强测试（E） |
|------|--------------|-----------------|--------------|
| **lib** | B1-B4 | C1 + C3 | E1-E6 |
| **cli (main)** | B1-B4 | C1 + C2 | E1-E6 |
| **ffi** | B1-B4 | C3 | E2-E6 |
| **wasm** | B1-B4 | C3 | E1-E6 |
| **async** | B1-B4 | C1 + C3 | E1-E6 |
| **parser** | B1-B4 | C1 + C3 | E1-E6 |

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
| 性能退化 | E3 检测到耗时显著增加 | 建议调用 `moonbit-perform` 优化 |
| 重构回归 | refactor 后测试失败 | 回滚重构步骤，回到 `moonbit-refactor` |

## 输出

```json
{
  "status": "pass | blocked",
  "project_type": "main",
  "basic_checks": {
    "fmt": "pass",
    "check": "pass",
    "test": "pass (12/12)",
    "workspace": "pass (clean)"
  },
  "custom_checks": {
    "api_stability": "pass",
    "moon_run": "pass (output: 'Hello')",
    "consumer_verify": "skipped (main project)"
  },
  "enhanced_checks": {
    "cross_platform": "pass",
    "security": "pass (0 findings)",
    "perf": "pass (1.2s)",
    "api_design": "pass (1 suggestion)",
    "ci_config": "pass",
    "docs": "pass"
  },
  "auto_fixes": [],
  "failures": [],
  "next": "implement | evaluate"
}
```

## 下一步

验证通过后，进入 `moonbit-evaluate` 做最终验收和发布准备。如果基础测试或 Custom 测试失败，回到 `moonbit-implement` 修复问题。性能问题建议调用 `moonbit-perform`，技术债务建议调用 `moonbit-refactor`。