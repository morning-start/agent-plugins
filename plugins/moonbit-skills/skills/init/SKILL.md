---
name: moonbit-init
description: "Use ONLY in a MoonBit project (moon.mod / *.mbt present); do NOT use outside one. Use when initializing a MoonBit project with git hooks for quality gates. Triggered by user phrases like 'init', 'setup hooks', 'add githooks', 'configure git hooks', 'initialize project', or when a new MoonBit project needs CI-style local checks."
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

## The Iron Law

```
NO HOOKS WITHOUT PROJECT VERIFICATION
```

安装 hooks 前必须确认：是 MoonBit 项目（moon.mod 存在）、是 git 仓库、hooks 脚本来源正确。不得在非 MoonBit 项目或非 git 仓库中安装 hooks。

## Red Flags — STOP and Re-evaluate

If you catch yourself doing any of these, you are violating the init contract:

- 不检测项目类型就直接复制 hooks
- 覆盖已有的 hooksPath 而不询问用户
- 在非 MoonBit 项目中强行安装 hooks
- 内联 hooks 脚本内容而非从仓库 `hooks/` 复制
- 跳过验证步骤（"hooks 肯定能跑"）

**All of these mean: Stop. Verify the project first.**

## 停止条件

- 不是 MoonBit 项目（无 moon.mod 且无 moon.mod.json）→ 提示用户创建项目
- 不是 git 仓库 → 提示用户 `git init`
- `moon` 命令不可用 → 提示安装 MoonBit 工具链
- 已有 hooksPath 且用户拒绝覆盖 → 保留现有配置，标记为 blocked

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

先检查已有 hooks 配置：

```bash
# 检查现有 core.hooksPath
EXISTING_HOOKS=$(git config core.hooksPath 2>/dev/null || echo "")
if [ -n "$EXISTING_HOOKS" ]; then
  echo "⚠️  Existing hooksPath detected: $EXISTING_HOOKS"
  echo "   MoonBit hooks will be added alongside existing hooks."
  echo "   Review the merged hook scripts before proceeding."
fi
```

从仓库的 `hooks/` 目录复制对应脚本到项目的 `.githooks/` 目录（不内联脚本内容，避免与仓库脚本漂移）：

```bash
# 从技能仓库 hooks/ 目录复制规范脚本到项目 .githooks/
mkdir -p .githooks
cp hooks/pre-commit.sh .githooks/pre-commit
cp hooks/pre-push.sh .githooks/pre-push
chmod +x .githooks/pre-commit .githooks/pre-push
```

脚本职责（详见 `hooks/pre-commit.sh` 与 `hooks/pre-push.sh`）：

- `pre-commit.sh`：L1 检测 — `moon fmt --check` + `moon check --target native --warn-list +73`
- `pre-push.sh`：L2 检测 — `moon test --target native` + `moon-audit`（支持 `MOONBIT_STRICT_AUDIT` 环境变量）

> **不要内联脚本内容**。仓库 `hooks/` 中的脚本是唯一权威来源；内联副本会与之漂移。

### 3. 配置 git

```bash
# 检查是否已有 hooksPath
EXISTING_HOOKS=$(git config core.hooksPath 2>/dev/null || echo "")
if [ -n "$EXISTING_HOOKS" ]; then
  echo "⚠️  Existing hooksPath: $EXISTING_HOOKS"
  echo "   Showing existing hooks and proposed MoonBit hooks for review."
  echo "   User must confirm before overwriting."
else
  # 未设置 hooksPath，可以安全配置
  git config core.hooksPath .githooks
fi
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

> **注意**：当前 hooks 模板（`pre-commit.sh`、`pre-push.sh`）统一使用 `--target native`。wasm 项目需手动将 hooks 中的目标改为 `--target wasm`。

| 类型 | pre-commit | pre-push |
|------|-----------|----------|
| lib | `moon check --target native` | `moon test --target native` |
| cli | `moon check --target native` | `moon test --target native` |
| ffi | `moon check --target native` | `moon test --target native`（如有） |
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