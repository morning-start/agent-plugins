---
name: moonbit-init
description: "Initialize a MoonBit project with git hooks for quality gates. Use when the user says 'init', 'setup hooks', 'add githooks', 'configure git hooks', 'initialize project', or when a new MoonBit project needs CI-style local checks. Agent detects project type, creates .githooks/, configures git, and optionally installs moon-audit. Checks are split by stage: pre-commit (fast: fmt + check) and pre-push (heavy: test + audit)."
---

# Init — 项目初始化 + Git Hooks

## 职责

为 MoonBit 项目配置本地质量门禁。**Agent 检测项目→创建钩子→配置 git→验证可用。** 检查按阶段划分，成本低的放 pre-commit，成本高的放 pre-push。

## 检查阶段划分

```
git commit ──→ pre-commit ──→ moon fmt --check          (格式，< 1s)
                           └─→ moon check --target native (类型，< 3s)

git push ────→ pre-push ────→ moon test --target native  (测试，取决于项目)
                           └─→ moon-audit --fail-on-error (安全审计，可选)
```

| 阶段 | 触发时机 | 检查内容 | 速度要求 | 阻断级别 |
|------|---------|---------|---------|---------|
| pre-commit | `git commit` | `moon fmt --check` + `moon check --target native --warn-list +73` | 快速（< 5s） | 必须通过 |
| pre-push | `git push` | `moon test --target native` + `moon-audit --fail-on-error .` | 允许较慢 | 必须通过 |

**设计原则**：pre-commit 只做最轻量的检查，不阻塞高频提交；pre-push 做完整测试和安全审计，确保不把坏代码推到远端。

## 执行流程

### 1. 检测项目

```bash
# 确认是 MoonBit 项目
test -f moon.mod && echo "MoonBit: OK" || echo "MoonBit: MISSING"
# 确认是 git 仓库
git rev-parse --git-dir >/dev/null 2>&1 && echo "Git: OK" || echo "Git: MISSING"
```

不是 MoonBit 项目或不是 git 仓库时，提示用户并中止。

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
| 不是 MoonBit 项目 | 缺少 `moon.mod` | 提示用户先 `moon new` 或进入正确目录 |
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