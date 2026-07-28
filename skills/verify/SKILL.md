---
name: moonbit-verify
description: "Use when running MoonBit verification gates — before claiming any work is done. Triggered by user phrases like 'review', 'check', 'audit', 'verify', 'test', 'quality', 'security', 'is it ready', 'does it pass'. Do NOT skip this before claiming done — always verify first."
---

# Verify — 三档检测门禁

## 职责

一站式验证管道，分为三档递增检测。**L1/L2 自动触发（git hooks），L3 用户手动调用。** Agent 全自动执行，用户做最终判断。

## 三档检测体系

```
┌─────────────────────────────────────────────────────┐
│ L1 轻度检测 — 随时做，常做常看                        │
│ 触发: git commit（pre-commit hook）                  │
│ 内容: moon fmt --check + moon check --target native  │
│ 速度: < 5s，不阻塞高频提交                            │
│ 阻断: 必须通过                                       │
├─────────────────────────────────────────────────────┤
│ L2 深度检查 — 提交时做                                │
│ 触发: git push（pre-push hook）                      │
│ 内容: moon test + moon-audit --fail-on-error         │
│ 速度: 取决于项目大小，允许较慢                        │
│ 阻断: 必须通过                                       │
├─────────────────────────────────────────────────────┤
│ L3 全面检查 — 用户单独调用时做                        │
│ 触发: 用户手动调用 moonbit-verify 技能               │
│ 内容: 代码审查 + 安全审计 + 架构调整检查              │
│ 特点: 全量扫描，含架构审查、API 稳定性、跨平台兼容    │
│ 阻断: 报告问题，用户判断                              │
└─────────────────────────────────────────────────────┘
```

**关键区别**：L1/L2 是自动化门禁（init 技能配置），L3 是深度诊断（用户主动调用）。L3 包含了 L1/L2 的所有检查，外加代码审查和架构调整。

## L3 全面检查（本技能核心）

当用户调用 `moonbit-verify` 时，执行以下全量管道：

### 1. 代码审查 + 自动修复

```bash
moon check --warn-list +73          # 类型检查，含警告
moon fmt --check                     # 格式检查（失败则 moon fmt 自动修复）
```

### 2. 验证门禁

```bash
moon test --target native            # 测试全部通过
moon info --target native            # 公共 API 稳定性
```

### 3. 安全审计

```bash
moon-audit pipeline .                # 14 条 CWE 规则静态扫描
```

## 各类型验证重点

| 类型 | 验证命令 | 额外检查 |
|------|---------|---------|
| lib | `moon test --target native` | `moon check --target all` 跨平台 |
| cli | `moon test --target native` | CLI 输出/退出码测试 |
| c-ffi | `moon check --target native` | ASan 验证（可选） |
| wasm | `moon test --target wasm` | `moon check --target wasm` + `moon check --target wasm-gc`，WASM 运行时 test |
| async | `moon test --target native` | 并发测试 |

## 代码审查

委托给独立技能 **`moonbit-code-review`** 执行。先调用该技能做逐项审查，审查通过后再继续本技能的验证管道。

**REQUIRED SUB-SKILL:** Use `moonbit-code-review` before proceeding with L3 checks.

## 安全审计（moon-audit）

```bash
# 安装
moon add minie135/moon-audit

# 运行
moon-audit pipeline .                # 全流程
moon-audit --format json .           # JSON 输出
moon-audit --fail-on-error .         # Error 漏洞时 exit 1（CI 用）

# 解读
moon-audit summary .                 # 按 CWE 分类聚合
moon-audit remediate -o fixes.md .   # 修复建议
```

## 错误恢复

| 命令 | 诊断 | 修复 |
|------|------|------|
| `moon fmt --check` | 格式问题 | `moon fmt` 自动修复 |
| `moon check` 失败 | `--explain E####` | 检查类型签名 |
| `moon test` 失败 | `--show-output` | 修正断言 |
| `moon info` 失败 | 先 `moon check` | 类型正确后重试 |
| `moon-audit` 未安装 | 命令未找到 | `moon add minie135/moon-audit` |

## 输出

```json
{
  "status": "pass | fix_applied | fail",
  "project_type": "lib",
  "checks": {
    "fmt": "pass",
    "check": "pass",
    "test": "pass (12/12)",
    "info": "pass",
    "security": "pass (0 findings)"
  },
  "auto_fixes": ["removed pub from 2 functions", "replaced Option[T] with T?"],
  "failures": []
}
```

## 下一步

验证通过后，进入 `moonbit-evaluate` 做最终验收和发布准备。如果验证失败，回到 `moonbit-implement` 修复问题。