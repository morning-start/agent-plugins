---
name: verify
description: "Run the MoonBit verification gate — code review, type check, tests, security audit in one pass. Use whenever the user says 'review', 'check', 'audit', 'verify', 'test', 'quality', 'security', 'is it ready', 'does it pass', or before claiming any work is done. Type-aware: runs verification pipeline, code review, and security audit. Agent runs checks, applies auto-fixes, presents results. User decides if acceptable. Do NOT skip this before claiming done — always verify first."
---

# Verify — 验证门禁（含代码审查 + 安全审计）

## 职责

一站式验证管道：**代码审查 → 验证门禁 → 安全审计**。Agent 全自动执行，用户做最终判断。

## 验证管道（全量）

```bash
# 1. 代码审查 + 自动修复
moon check --warn-list +73          # 类型检查，含警告
moon fmt --check                     # 格式检查（失败则 moon fmt 自动修复）

# 2. 验证门禁
moon test --target native            # 测试全部通过
moon info --target native            # 公共 API 稳定性

# 3. 安全审计
moon-audit pipeline .                # 14 条 CWE 规则静态扫描
```

## 各类型验证重点

| 类型 | 验证命令 | 额外检查 |
|------|---------|---------|
| lib | `moon test --target native` | `moon check --target all` 跨平台 |
| cli | `moon test --target native` | CLI 输出/退出码测试 |
| c-ffi | `moon check --target native` | ASan 验证（可选） |
| wasm | `moon test --target wasm` | WASM 运行时 test |
| parser | `moon test --target native` | 官方测试套件合规率 |
| async | `moon test --target native` | 并发测试 |

## 代码审查项目（自动修复）

| 检查 | 合格 | 修复 |
|------|------|------|
| 可选值 | `T?` 而非 `Option[T]` | 自动替换 |
| 字符串参数 | `StringView` 而非 `String` | 自动替换 |
| 错误处理 | 正确使用 `Result`/`suberror` | 自动修正 |
| 自定义错误 | `derive(Debug, Eq, ToJson)` | 自动添加 |
| 可见性 | 只导出外部需要的 | 移除不必要的 `pub` |
| 空 catch | 无 `catch { _ => () }` | 添加日志或重新抛出 |
| 资源管理 | `with_closed_*` RAII 模式 | 包装为 RAII |

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

验证通过后，进入 `evaluate/` 做最终验收和发布准备。如果验证失败，回到 `implement/` 修复问题。