---
name: moonbit-init
description: "Use when initializing a MoonBit project with git hooks for quality gates. Triggered by user phrases like 'init', 'setup hooks', 'add githooks', 'configure git hooks', 'initialize project', or when a new MoonBit project needs CI-style local checks."
---

# Init — 项目初始化 + Git Hooks

## 职责

为 MoonBit 项目配置本地质量门禁。**Agent 检测项目→创建钩子→配置 git→验证可用。** 检查按阶段划分，成本低的放 pre-commit，成本高的放 pre-push。

## 三档检测体系

MoonBit 项目的检测分为三档，init 技能自动配置 L1/L2，L3 由 `moonbit-verify` 技能单独调用：

```
┌─ L1 轻度检测（pre-commit hook）──────────────────────┐
│ 触发: git commit                                      │
│ 内容: moon fmt --check + moon check --target native    │
│ 速度: < 5s，不阻塞高频提交                             │
│ 阻断: 必须通过                                         │
├─ L2 深度检查（pre-push hook）─────────────────────────┤
│ 触发: git push                                        │
│ 内容: moon test + moon-audit --fail-on-error           │
│ 速度: 取决于项目大小，允许较慢                          │
│ 阻断: 必须通过                                         │
├─ L3 全面检查（moonbit-verify 技能）───────────────────│
│ 触发: 用户手动调用                                     │
│ 内容: 代码审查 + 安全审计 + 架构调整检查                │
│ 阻断: 报告问题，用户判断                                │
└───────────────────────────────────────────────────────┘
```

**设计原则**：L1 只做最轻量的检查，不阻塞高频提交；L2 做完整测试和安全审计，确保不把坏代码推到远端；L3 做全量深度扫描，用户需要时手动触发。

## 执行流程

### 1. 检测项目

```bash
# 确认是 MoonBit 项目（优先检测新格式 moon.mod）
test -f moon.mod && echo "MoonBit (new format): OK" || echo "MoonBit: CHECKING_OLD"

# 兼容旧格式 moon.mod.json（废弃，应迁移）
if [ ! -f moon.mod ] && [ -f moon.mod.json ]; then
  echo "⚠️  DEPRECATED: moon.mod.json detected. Please migrate to moon.mod format."
  echo "   新格式已自动迁移: 运行 moon fmt 即可自动转换"
  echo "   moon.mod.json → moon.mod"
  echo "   moon.pkg.json → moon.pkg"
fi

# 确认是 git 仓库
git rev-parse --git-dir >/dev/null 2>&1 && echo "Git: OK" || echo "Git: MISSING"
```

不是 MoonBit 项目（新旧格式都没有）或不是 git 仓库时，提示用户并中止。

### 1.1 旧格式兼容策略

| 格式 | 状态 | 动作 |
|------|------|------|
| `moon.mod` + `moon.pkg` | 当前格式 | 正常使用 |
| `moon.mod.json` + `moon.pkg.json` | **已废弃** | 显示迁移警告，建议运行 `moon fmt` 自动迁移 |
| 混合存在（新旧格式都有） | 过渡状态 | 优先使用新格式，忽略旧格式 |
| 仅旧格式 | 旧项目 | 提示迁移，但继续配置 hooks |

### 2. 创建钩子脚本

将以下文件写入项目：

```
项目根目录/
├── .githooks/
│   ├── pre-commit    # 快速检查入口
│   └── pre-push      # 重量级检查入口
```

**pre-commit** 内容：
```bash
#!/usr/bin/env bash
set -euo pipefail

echo "=== MoonBit Pre-Commit ==="

if [ ! -f moon.mod ]; then
  echo "Not a MoonBit project, skipping"
  exit 0
fi

echo "→ moon fmt --check"
moon fmt --check
echo "✅ Format check passed"

echo "→ moon check --target native --warn-list +73"
moon check --target native --warn-list +73
echo "✅ Type check passed"

echo "=== Pre-commit passed ==="
```

**pre-push** 内容：
```bash
#!/usr/bin/env bash
set -euo pipefail

echo "=== MoonBit Pre-Push ==="

if [ ! -f moon.mod ]; then
  echo "Not a MoonBit project, skipping"
  exit 0
fi

echo "→ moon test --target native"
moon test --target native
echo "✅ Tests passed"

if command -v moon-audit >/dev/null 2>&1; then
  echo "→ moon-audit --fail-on-error ."
  moon-audit --fail-on-error .
  echo "✅ Security audit passed"
else
  echo "⚠️  moon-audit not installed, skipping security audit"
  echo "   Install: moon add minie135/moon-audit"
fi

echo "=== Pre-push passed ==="
```

### 3. 配置 git

```bash
# 设置 git 使用项目级 hooks 目录
git config core.hooksPath .githooks

# 验证配置
git config core.hooksPath  # 应输出 .githooks
```

### 4. 可选：安装 moon-audit

```bash
# 如果用户需要安全审计
moon add minie135/moon-audit
```

### 5. 验证钩子

```bash
# 确保钩子可执行
chmod +x .githooks/pre-commit .githooks/pre-push

# 手动运行一次 pre-commit 验证
bash .githooks/pre-commit
```

## 各项目类型差异

| 类型 | pre-commit | pre-push |
|------|-----------|----------|
| lib | `moon check --target native` | `moon test --target native` |
| cli | `moon check --target native` | `moon test --target native` |
| c-ffi | `moon check --target native` | `moon test --target native`（如有） |
| wasm | `moon check --target wasm` + `moon check --target wasm-gc` | `moon test --target wasm` |

## 错误恢复

| 问题 | 诊断 | 修复 |
|------|------|------|
| 不是 MoonBit 项目 | 缺少 `moon.mod`（含旧格式 `moon.mod.json`） | 提示用户先 `moon new` 或进入正确目录 |
| 旧格式 `moon.mod.json` | 发现旧格式元数据文件 | 提示运行 `moon fmt` 自动迁移，继续配置 hooks |
| 不是 git 仓库 | `git rev-parse` 失败 | 提示用户先 `git init` |
| `moon` 命令不可用 | command not found | 提示安装 MoonBit 工具链 |
| `moon-audit` 不可用 | command not found | 提示 `moon add minie135/moon-audit`，非阻断 |
| 钩子权限不足 | Permission denied | 自动 `chmod +x` |

## 用户 vs Agent 分工

| 谁 | 做什么 |
|---|--------|
| **Agent** | 检测项目、创建钩子、配置 git、验证可用 |
| **用户** | 确认是否安装 moon-audit、决定是否自定义检查规则 |

## 输出

```json
{
  "status": "initialized | blocked",
  "project_type": "lib",
  "hooks_created": [".githooks/pre-commit", ".githooks/pre-push"],
  "git_configured": true,
  "moon_audit_installed": true,
  "validation": {
    "pre_commit": "passed",
    "pre_push": "passed"
  },
  "next": "implement | scaffold"
}
```

## 下一步

初始化完成后，可以进入 `moonbit-scaffold` 生成项目骨架，或直接进入 `moonbit-implement` 开始开发。