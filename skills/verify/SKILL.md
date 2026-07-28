---
name: moonbit-verify
description: "Use when running MoonBit verification gates — before claiming any work is done. Triggered by user phrases like 'review', 'check', 'audit', 'verify', 'test', 'quality', 'security', 'is it ready', 'does it pass'. Do NOT skip this before claiming done — always verify first."
---

# Verify — 全量检测门禁

## 职责

一站式验证管道，覆盖代码质量、API 设计、性能、安全、CI 完整性六大维度。**L1/L2 自动触发（git hooks），L3 全面检查（用户手动调用）。** Agent 全自动执行，用户做最终判断。

## 三档检测体系

```
┌─ L1 轻度检测 — 随时做，常做常看 ────────────────────┐
│ 触发: git commit（pre-commit hook）                  │
│ 内容: moon fmt --check + git diff --exit-code        │
│       moon check --target native                     │
│ 速度: < 5s，不阻塞高频提交                            │
│ 阻断: 格式不一致或类型错误则阻断 commit               │
├─ L2 深度检查 — 提交时做 ────────────────────────────┤
│ 触发: git push（pre-push hook）                      │
│ 内容: moon test --target native                      │
│       moon info --target native                      │
│       moon-audit --fail-on-error .                   │
│ 速度: 取决于项目大小，允许较慢                        │
│ 阻断: 测试失败或安全检查 error 则阻断 push            │
├─ L3 全面检查 — 用户单独调用时做 ─────────────────────┤
│ 触发: 用户手动调用 moonbit-verify 技能               │
│ 内容: 代码审查 + 安全审计 + API 稳定性 + CI 完整性    │
│       格式一致性 + 跨平台兼容 + 性能检查              │
│ 阻断: 报告问题，用户判断                              │
└─────────────────────────────────────────────────────┘
```

**关键区别**：L1/L2 是自动化门禁（init 技能配置），L3 是深度诊断（用户主动调用）。L3 包含了 L1/L2 的所有检查，外加架构审查、CI 完整性、性能评估。

## The Iron Law

```
NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE
```

If you haven't run the verification commands in this turn, you cannot claim it passes.

## L3 全面检查（本技能核心）

当用户调用 `moonbit-verify` 时，按顺序执行以下全量管道：

### 步骤 1：代码审查

委托给独立技能 **`moonbit-code-review`** 执行。先调用该技能做逐项审查，审查通过后再继续。

**REQUIRED SUB-SKILL:** Use `moonbit-code-review` before proceeding.

### 步骤 2：代码质量检查

```bash
# 类型检查 + 全部警告
moon check --warn-list +73                  # 通过: exit 0
moon check --explain E####                   # 失败时定位具体错误

# 格式一致性 + 无意外改动
moon fmt --check                             # 通过: exit 0，无 diff 输出
moon fmt                                     # 失败时自动修复格式
git diff --exit-code                         # 确保工作区干净（无未提交改动）
```

**质量门禁：**
- 所有警告必须评估，`unused_mut` 等语义警告不能忽略
- `moon fmt --check` 失败 → `moon fmt` 自动修复 → 重新验证 `git diff --exit-code`
- 自动修复后必须重新运行 `moon check` 确认类型正确

### 步骤 3：API 设计与稳定性检查

```bash
moon info --target native                    # 公共 API 签名输出

# 检查 API 设计规范
moon info --target native | grep "pub fn"    # 审查公共函数签名
moon info --target native | grep "pub(all)"  # 审查导出枚举/结构体
```

**API 设计验收标准：**

| 检查项 | 合格标准 | 不符合时操作 |
|--------|---------|-------------|
| API 最小表面 | 只导出外部需要的函数/类型 | 移除不必要的 `pub` |
| 参数类型 | `StringView` 而非 `String`（公开函数） | 报告，需用户确认 |
| 可选值 | `T?` 而非 `Option[T]` | 自动修复内部类型 |
| 错误处理 | 返回 `Result[T, E]` 而非 panic | 报告并给出建议 |
| 自定义错误 | `derive(Debug, Eq, ToJson)` | 仅内部类型自动修复 |
| 可见性 | `pub` 只用于跨包 API | 涉及 `pub` 时只报告 |
| 枚举构造器 | 跨包构造需 `pub(all) enum` | 只报告 |
| 跨包 struct | 跨包只能用 `pub` 字段 | 只报告 |
| `moon info` 输出 | 与预期 API 表面一致，无意外变更 | 标记为阻断 |

### 步骤 4：功能完整性检查

```bash
moon test --target native                    # 全部测试通过
moon test --target native -- --show-output   # 查看失败详情

# 验证测试覆盖类型
moon test -f "valid/"    # 快乐路径
moon test -f "invalid/"  # 错误路径  
moon test -f "edge/"     # 边界条件
moon test -f "usage"     # 可运行文档示例（如有）
```

**测试验收标准：**
- 所有测试必须通过 (passed == total, failed == 0)
- 三种类型测试覆盖：valid（快乐路径）、invalid（错误路径）、edge（边界条件）
- 新功能必须有对应的测试用例
- Bug 修复必须有回归测试

### 步骤 5：跨平台兼容性

```bash
# 根据项目类型选择目标
moon check --target native                   # native 必需
moon check --target wasm                     # WASM 项目
moon check --target wasm-gc                  # WASM GC 项目
moon check --target js                       # JS 目标（如支持）
moon test --target native                    # native 测试必需
moon test --target wasm                      # wasm 测试（如适用）
```

### 步骤 6：性能检查

```bash
# 基准性能（有 baseline 时对比）
moon test --target native 2>&1               # 测试执行时间

# 检查耗时增长
# 与上一次 verify 的输出对比测试执行时间
# 单次测试 > 5s 需要排查
```

**性能验收标准：**
- 测试执行时间无明显增长（与上一次 verify 结果对比）
- 单次 `moon check` 执行时间 < 10s
- CI 管道总耗时 < 5min（全部步骤）
- 发现性能退化 → 标记为 Important 级别问题

### 步骤 7：CI 完整性检查

```yaml
# 验证 CI 配置文件存在且完整
# .github/workflows/ci.yml 应包含以下步骤：
# 1. checkout
# 2. moonbit toolchain 安装
# 3. moon fmt --check
# 4. moon check --warn-list +73
# 5. moon test --target native
# 6. moon info --target native
# 7. moon-audit pipeline .（推荐）
```

**CI 完整性标准：**

| 检查项 | 必须 | 推荐 |
|--------|------|------|
| GitHub Actions 配置存在 | ✅ | — |
| 格式检查 (`moon fmt --check`) | ✅ | — |
| 类型检查 (`moon check`) | ✅ | — |
| 测试 (`moon test`) | ✅ | — |
| API 稳定性 (`moon info`) | ✅ | — |
| 多目标兼容 (`moon check --target all`) | — | ✅ |
| 安全审计 (`moon-audit`) | — | ✅ |

### 步骤 8：安全审计

```bash
# 安装
moon add minie135/moon-audit

# 运行
moon-audit pipeline .                        # 全流程
moon-audit --format json .                   # JSON 输出
moon-audit --fail-on-error .                 # Error 漏洞时 exit 1（CI 用）

# 解读
moon-audit summary .                         # 按 CWE 分类聚合
moon-audit remediate -o fixes.md .           # 修复建议
```

## 执行顺序与逻辑

```
Start
  │
  ├── moonbit-code-review ───→ 代码审查
  │
  ├── moon check + moon fmt + git diff ───→ 代码质量 + 格式一致性
  │
  ├── moon info ───→ API 设计 + 稳定性
  │
  ├── moon test ───→ 功能完整性
  │
  ├── moon check --target all ───→ 跨平台兼容
  │
  ├── 性能分析 ───→ 性能退化检查
  │
  ├── CI 配置验证 ───→ CI 完整性
  │
  └── moon-audit ───→ 安全审计
       │
       ▼
    报告结果 → 用户判断
```

**执行规则：**
- 前序步骤阻断时，修复后再继续后续步骤
- `moon check` 失败 → 修复后重跑 → 通过后才进入 `moon test`
- `moon fmt --check` 失败 → 自动 `moon fmt` → `git diff --exit-code` 确认格式修复
- 非阻断性问题报告给用户判断，不自动停止

## 错误恢复

| 命令 | 诊断 | 修复 |
|------|------|------|
| `moon fmt --check` | 格式问题 | `moon fmt` 自动修复，`git diff --exit-code` 确认 |
| `moon check` 失败 | `--explain E####` | 检查类型签名 |
| `moon test` 失败 | `--show-output` | 修正断言 |
| `moon info` 失败 | 先 `moon check` | 类型正确后重试 |
| `moon-audit` 未安装 | 命令未找到 | `moon add minie135/moon-audit` |
| `git diff --exit-code` | 工作区有未提交改动 | 提交或 stash 后再验证 |

## 输出

```json
{
  "status": "pass | fix_applied | fail",
  "project_type": "lib",
  "checks": {
    "code_review": "pass (0 critical, 2 minor)",
    "fmt": "pass",
    "fmt_git_diff": "pass (clean)",
    "check": "pass",
    "test": "pass (12/12)",
    "info": "pass",
    "api_design": "pass (1 suggestion)",
    "cross_platform": "pass (native+wasm)",
    "perf": "pass (1.2s check, 3.5s test)",
    "ci_config": "pass",
    "security": "pass (0 findings)"
  },
  "auto_fixes": ["moon fmt auto-format", "removed pub from 2 functions"],
  "failures": [],
  "next": "implement | evaluate"
}
```

## 各类型验证重点

| 类型 | 核心验证命令 | 额外检查 |
|------|------------|---------|
| lib | `moon test --target native` | `moon check --target all` 跨平台 |
| cli | `moon test --target native` | CLI 退出码测试、`main` 包格式 |
| c-ffi | `moon check --target native` | ASan 验证（可选）、依赖检查 |
| wasm | `moon test --target wasm` | `moon check --target wasm` + `moon check --target wasm-gc` |
| async | `moon test --target native` | 并发测试、超时测试 |

## 下一步

验证通过后，进入 `moonbit-evaluate` 做最终验收和发布准备。如果验证失败，回到 `moonbit-implement` 修复问题。
