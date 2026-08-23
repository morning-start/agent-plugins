---
name: moonbit-init
description: "Use ONLY in a MoonBit project (moon.mod / *.mbt present); do NOT use outside one. Use when initializing or adopting a MoonBit project into the moonbit-skills workflow. Triggered by user phrases like 'init', 'setup hooks', 'add githooks', 'configure git hooks', 'initialize project', 'onboard', 'adopt', '接入', '已有项目', 'existing project', or when a MoonBit project needs quality gates, workspace setup, or CI-style local checks."
---

# Init — 项目接入 + 质量门禁 + 工作区初始化

## 职责

将已有或新建的 MoonBit 项目接入 moonbit-skills 工作流。**Agent 检测项目→评估状态→创建工作区→配置质量门禁→推荐下一步。**

覆盖两种场景：
- **新项目**：`moon new` 后直接 init，配置 hooks + 工作区
- **已有项目**：已有 `moon.mod` + `.mbt` 代码，但没用过 moonbit-skills → 评估现状、补齐缺失、接入工作流

检查按阶段划分，成本低的放 pre-commit，成本高的放 pre-push。

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

- 不是 MoonBit 项目（无 moon.mod 且无 moon.mod.json）→ 提示用户创建项目或运行 `moon new`
- 不是 git 仓库 → 提示用户 `git init`
- `moon` 命令不可用 → 提示安装 MoonBit 工具链
- 已有 hooksPath 且用户拒绝覆盖 → 保留现有配置，标记为 blocked
- `.agent-workplace/` 已存在且结构完整 → 跳过创建，只做评估

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

### 2. 评估项目状态（ASSESS）

检测项目已有和缺失的能力，生成评估矩阵：

```bash
# 代码
HAS_CODE=$(find . -name "*.mbt" -not -path "./.agent-workplace/*" | head -1)

# 测试
HAS_TESTS=$(find . -name "*_test.mbt" -not -path "./.agent-workplace/*" | head -1)

# Git hooks
HAS_HOOKS=$(git config core.hooksPath 2>/dev/null || echo "")

# CI
HAS_CI=$(test -f .github/workflows/*.yml && echo "yes" || echo "")

# .agent-workplace/
HAS_WORKPLACE=$(test -d .agent-workplace && echo "yes" || echo "")

# Documentation
HAS_DOCS=$(test -f README.md && echo "yes" || echo "")
```

评估结果用于推荐下一步（见 §6）。

### 3. 创建 .agent-workplace/（工作区初始化）

按 AGENTS.md 定义的**简化版**结构创建 agent 工作区：

```
.agent-workplace/
├── docs/
│   ├── plan/          # 计划→阶段→批次→任务
│   └── task/          # 任务拆解
├── scripts/           # 脚本尝试
└── README.md          # 工作区说明
```

创建逻辑：

```bash
mkdir -p .agent-workplace/docs/plan
mkdir -p .agent-workplace/docs/task
mkdir -p .agent-workplace/scripts

# 写入 README
cat > .agent-workplace/README.md << 'EOF'
# .agent-workplace/

Agent 的私有工作区，不提交到 git。

- `docs/plan/` — 实现计划（阶段→批次→任务）
- `docs/task/` — 任务拆解详情
- `scripts/` — 脚本尝试和临时文件

由 moonbit-skills 自动创建，遵循 AGENTS.md 工作区约定。
EOF
```

**不覆盖已有目录**：如果 `.agent-workplace/` 已存在，只补充缺失的子目录。

### 4. 创建钩子脚本

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

### 5. 配置 git

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

### 6. 可选：安装 moon-audit

```bash
# 如果用户需要安全审计
moon add minie135/moon-audit
```

### 7. 验证钩子

```bash
# 确保钩子可执行
chmod +x .githooks/pre-commit .githooks/pre-push

# 手动运行一次 pre-commit 验证
bash .githooks/pre-commit
```

## 各项目类型差异

> **注意**：当前 hooks 模板（`pre-commit.sh`、`pre-push.sh`）统一使用 `--target native`。wasm 项目需手动将 hooks 中的目标改为 `--target wasm`。
>
> 各类型的 Git Hooks 配置详见 `references/project-type-matrix.md`「Git Hooks 配置」章节。

## 错误恢复

> 共享错误恢复行（非 MoonBit 项目、moon 不可用、audit 未安装）详见
> `references/common-error-recovery.md`。以下仅列出 init 独有的行。

| 问题 | 诊断 | 修复 |
|------|------|------|
| 旧格式 `moon.mod.json` | 发现旧格式元数据文件 | 提示运行 `moon fmt` 自动迁移，继续配置 hooks |
| 不是 git 仓库 | `git rev-parse` 失败 | 提示用户先 `git init` |
| 钩子权限不足 | Permission denied | 自动 `chmod +x` |

## 用户 vs Agent 分工

| 谁 | 做什么 |
|---|--------|
| **Agent** | 检测项目、创建钩子、配置 git、验证可用 |
| **用户** | 确认是否安装 moon-audit、决定是否自定义检查规则 |

## 输出

```json
{
  "status": "initialized | on-boarded | blocked",
  "project_type": "lib",
  "assessment": {
    "has_code": true,
    "has_tests": true,
    "has_ci": false,
    "has_hooks": true,
    "has_workplace": true,
    "has_docs": true
  },
  "hooks_created": [".githooks/pre-commit", ".githooks/pre-push"],
  "workplace_created": true,
  "git_configured": true,
  "moon_audit_installed": true,
  "validation": {
    "pre_commit": "passed",
    "pre_push": "passed"
  },
  "next": "plan | writing-plans | implement | testing"
}
```

## 推荐下一步（按评估结果路由）

| 项目状态 | 推荐入口 | 说明 |
|---------|---------|------|
| 新项目，无代码 | `moonbit-plan` | 从需求澄清和架构设计开始 |
| 已有代码，无测试 | `moonbit-testing` | 先补测试，再继续开发 |
| 已有代码+测试，无计划文档 | `moonbit-writing-plans` | 为已有代码建立任务追踪 |
| 已有代码+测试+计划 | `moonbit-implement` | 直接进入 TDD 开发 |
| 需要重构/优化 | `moonbit-refactor` 或 `moonbit-perform` | 按用户意图路由 |

初始化完成后向用户展示评估矩阵和推荐入口，由用户决定下一步。