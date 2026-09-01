---
name: moonbit-ci
description: "Use ONLY in a MoonBit project (moon.mod / *.mbt present); do NOT use outside one. Use when setting up CI for a MoonBit project — GitHub Actions workflows, local git hooks (pre-commit security scan, commit-msg Conventional Commits), branch protection rules, cross-platform test matrices, and deprecation warning interception. Triggered by user phrases like 'add CI', 'set up GitHub Actions', 'configure CI workflow', 'add commit-msg hook', 'add security scan', 'set up branch protection', 'CI pipeline', '自动化测试', '持续集成', 'configure pre-commit', 'conventional commits hook'. Also triggered when a MoonBit project lacks a .github/workflows directory or doesn't have local git hooks configured. Do NOT use for verification gate checks (use moonbit-verify) — this skill is about BUILDING the CI pipeline infrastructure, not verification or deployment."
---

# CI — 持续集成与本地质量门禁

## 职责

为 MoonBit 项目搭建完整 CI（持续集成）基础设施。覆盖三个层次：

1. **本地 hooks** — pre-commit（安全扫描 + 格式化 + 类型检查 + 接口文件同步）、commit-msg（Conventional Commits）、pre-push（全量测试）
2. **GitHub Actions CI** — 多 job 并行流水线（格式/编译/测试/安全/文档）
3. **分支保护** — GitHub 分支保护规则建议

本技能**自主**搭建完整的本地 hooks 与 CI 基础设施（含基础 hooks 的初始创建），不依赖任何外部流程插件。

**注意**：`moonbit-ci` 专注于 CI（构建/测试/分支保护），不涵盖部署（deploy/rollback/制品管理）。

## 与其它技能的边界

| 技能 | moonbit-ci 不做什么 |
|------|-------------------|
| `moonbit-verify` | 不运行验证门禁；ci 只搭建流水线框架 |
| `moonbit-scaffold` | 不生成项目骨架；ci 只在项目已存在时搭建流水线 |

---

## The Iron Law

```
NO CI WITHOUT REPRODUCIBLE LOCAL CHECKS
```

CI 流水线中的每一步（fmt/check/test/audit）必须在本地可复现。CI 失败时，本地相同的命令必须产生相同结果。不要把 CI 当作唯一的验证场所。

---

## Red Flags — STOP and Re-evaluate

- 生成 CI 而不先确认项目类型（lib/cli/wasm 的 CI 需求不同）
- 把 `moon test` 放在 pre-commit 中（超过 5s 的检查应放在 pre-push）
- CI 命令与本地 hooks 命令不一致（漂移导致 CI 绿但本地红）
- 替用户推送 CI 配置文件而不展示 diff
- 覆盖已有的 CI workflow 而不询问
- 在非 MoonBit 项目中安装 hooks

---

## 停止条件

- 不是 MoonBit 项目（无 moon.mod）→ 提示先创建项目
- 不是 git 仓库 → 提示 `git init`
- 已有 CI workflow 且用户拒绝覆盖 → 保留现有配置，标记为 blocked
- 缺少 GitHub 仓库权限 → 只生成配置预览，不推送

---

## 执行流程

### 阶段 1：诊断现有 CI 覆盖

进入项目后，先检查已有哪些 CI 基础设施：

```bash
# 检查已有 GitHub Actions
ls .github/workflows/ 2>/dev/null || echo "No CI workflows found"

# 检查 git hooks 配置
EXISTING_HOOKS=$(git config core.hooksPath 2>/dev/null || echo "")
echo "hooksPath: ${EXISTING_HOOKS:-none}"

# 检查已存在的钩子脚本
if [ -n "$EXISTING_HOOKS" ] && [ -d "$EXISTING_HOOKS" ]; then
  ls -la "$EXISTING_HOOKS/"
fi
```

根据检查结果决定补充哪些缺失项：

| 已有 | 需要补充 |
|------|---------|
| 无 CI workflow | 完整 GitHub Actions CI |
| 已有单步 CI | 升级为多 job 并行 |
| 无 hooks | 自主创建基础 hooks（pre-commit/pre-push/commit-msg）+ 增强 |

---

### 阶段 2：配置本地 Hooks（commit-msg + 安全扫描 + 基础门禁）

若项目尚无 `.githooks/`，先创建基础 hooks（合入安全扫描、commit-msg 校验、接口文件自动同步与基础 `fmt+check`、`test` 门禁），再在已有 hook 基础上增强。本技能**自主完成**，不依赖外部流程插件：

#### 2a. 添加 commit-msg hook（Conventional Commits）

```bash
# 写入 .githooks/commit-msg
cat > .githooks/commit-msg << 'HOOK'
#!/bin/sh
# commit-msg hook: 强制 Conventional Commits 格式
# 类型: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert
COMMIT_MSG="$(cat "$1")"

# 跳过合并提交
case "$COMMIT_MSG" in
  Merge*) exit 0 ;;
esac

TYPE_PATTERN="^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)"
PATTERN="${TYPE_PATTERN}(\(.+\))?!?: .+"

if ! printf '%s\n' "$COMMIT_MSG" | head -1 | grep -qE "$PATTERN"; then
  echo ""
  echo "ERROR: Commit message must follow Conventional Commits format."
  echo ""
  echo "  Expected: type(scope): subject"
  echo "  Example:  feat(core): add Dijkstra algorithm"
  echo "            fix: handle empty graph edge case"
  echo ""
  echo "  Allowed types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert"
  echo ""
  echo "  Your message: $(printf '%s\n' "$COMMIT_MSG" | head -1)"
  echo ""
  exit 1
fi
exit 0
HOOK
chmod +x .githooks/commit-msg
```

**说明**：Conventional Commits 确保自动生成 CHANGELOG 时 commit 可分类，同时让 reviewer 快速了解变更意图。合并提交（Merge branch）自动豁免。

#### 2b. 增强 pre-commit：添加安全扫描 + auto-restage

在 pre-commit 中加入安全扫描、格式化/类型检查、接口文件自动 stage 逻辑（若无现有 pre-commit 则新建）：

```bash
# 增强 pre-commit（在现有脚本顶部插入安全扫描段）
# 安全扫描：检测 staged 文件中的密钥/凭证
extract_added_lines() {
  git diff-index --cached -p HEAD -- . ':(exclude).githooks/' 2>/dev/null \
    | grep "^+" | grep -v "^+++" || true
}

if git diff-index --cached --name-only --diff-filter=ACM HEAD 2>/dev/null \
   | grep -qv '^\.githooks/'; then
  
  DIFF_LINES="$(extract_added_lines)"
  FOUND=0
  MATCHES=""

  check_pattern() {
    local pattern="$1"; local label="$2"
    if printf '%s\n' "$DIFF_LINES" | grep -qE "$pattern" 2>/dev/null; then
      FOUND=1; MATCHES="${MATCHES}  - ${label}\n"
    fi
  }

  check_pattern 'AKIA[0-9A-Z]{16}'                      'AWS Access Key ID'
  check_pattern '-----BEGIN (RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----' 'Private Key'
  check_pattern "(password|passwd|pwd)\s*[:=]\s*['\"][^'\" ]{4,}['\"]" 'Hardcoded password'
  check_pattern "(secret|api_key|apikey)\s*[:=]\s*['\"][A-Za-z0-9]{15,}['\"]" 'Secret/API key'
  check_pattern 'gh[pouhs]_[A-Za-z0-9]{30,}'            'GitHub token'
  check_pattern 'sk_live_|pk_live_'                      'Stripe live key'
  check_pattern 'AIza[0-9A-Z_-]{35}'                     'Google API key'
  check_pattern 'xox[baprs]-'                            'Slack token'

  if [ "$FOUND" = "1" ]; then
    echo "SECURITY: Potential secrets detected!"
    printf '%s' "$MATCHES"
    echo "Use --no-verify to bypass if false positive."
    exit 1
  fi
fi
```

并在 pre-commit 中 `moon fmt` 和 `moon info` 之后添加 auto-restage：

```bash
# moon fmt 之后重新 stage 格式化后的文件
FORMAT_CHANGED="$(git diff --name-only -- '*.mbt' 2>/dev/null || true)"
if [ -n "$FORMAT_CHANGED" ]; then
  git add -- "$FORMAT_CHANGED"
fi

# moon info 之后 stage 更新后的接口文件
MBTI_CHANGED="$(git diff --name-only -- '*.mbti' 2>/dev/null || true)"
if [ -n "$MBTI_CHANGED" ]; then
  git add -- "$MBTI_CHANGED"
fi
```

#### 2c. 增强 pre-push：标签推送跳过

```bash
# 在 pre-push 顶部添加：标签推送跳过检查
while read -r local_ref local_sha remote_ref remote_sha || [ -n "$local_ref" ]; do
  if printf '%s' "$local_ref" | grep -q '^refs/tags/'; then
    exit 0
  fi
done
```

---

### 阶段 3：生成 GitHub Actions CI 工作流

根据不同项目类型生成对应 CI 配置。**预览模式，用户批准后写入。**

#### lib 项目（library 库）

```yaml
# .github/workflows/ci.yml — Library project
name: CI
on:
  push:
    branches: [master, main]
  pull_request:
    branches: [master, main]

permissions:
  contents: read

jobs:
  format:
    name: Format Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: moonbitlang/moonbit-toolchain@v1
      - run: moon fmt --check
      # 格式修复闭环：auto-fix + git diff 确认无残留
      - run: moon fmt && git diff --exit-code

  check:
    name: Type Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: moonbitlang/moonbit-toolchain@v1
      - run: moon check --warn-list +73
      # 弃用警告拦截：确保无弃用 API 使用
      - run: moon check 2>&1 | grep -q "warning" && exit 1 || exit 0

  test:
    name: Tests (native)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: moonbitlang/moonbit-toolchain@v1
      - run: moon test --target native

  cross-platform:
    name: Cross-Platform
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: moonbitlang/moonbit-toolchain@v1
      - if: hashFiles('moon.mod') != ''
        run: |
          moon check --target wasm-gc 2>/dev/null && echo "wasm-gc: OK" || echo "wasm-gc: SKIP"
          moon check --target js 2>/dev/null && echo "js: OK" || echo "js: SKIP"

  api:
    name: API Surface
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: moonbitlang/moonbit-toolchain@v1
      - run: moon info --target native
      - run: git diff --exit-code pkg.generated.mbti

  security:
    name: Security Audit
    runs-on: ubuntu-latest
    continue-on-error: true
    steps:
      - uses: actions/checkout@v4
      - uses: moonbitlang/moonbit-toolchain@v1
      - run: moon-audit pipeline . || echo "moon-audit not installed or failed"
```

#### main / CLI 项目（可执行程序）

lib 项目的 CI 基础上，test job 增加 `moon run` 验证：

```yaml
  run:
    name: Executable Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: moonbitlang/moonbit-toolchain@v1
      - run: moon run . 2>&1 | grep -q "." || echo "WARNING: no output"
```

#### wasm 项目（WASM 模块）

lib 项目的 CI 基础上，test job 增加 wasm 目标：

```yaml
  test-wasm:
    name: Tests (wasm)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: moonbitlang/moonbit-toolchain@v1
      - run: moon test --target wasm
      - run: moon test --target wasm-gc
```

---

### 阶段 4：分支保护配置建议

如果用户有 GitHub 仓库的管理权限，给出分支保护配置建议：

| 规则 | 推荐值 | 说明 |
|------|--------|------|
| 要求 CI 通过 | ✅ 开启 | 所有必要 job 通过后才能合并 |
| 要求 PR 审查 | 1 个 reviewer | 防止单点提交 |
| 管理员也受约束 | ✅ 开启 | 避免绕过规则 |
| 要求分支最新 | ✅ 开启 | 确保合并前 base 未过时 |
| 允许强制推送 | ❌ 关闭 | 保护历史完整性 |

```bash
# 检查当前分支保护状态（需要 GitHub CLI）
gh api repos/:owner/:repo/branches/master/protection 2>/dev/null \
  || echo "No branch protection configured (requires gh CLI + admin access)"
```

---

## 项目类型差异总结

| 类型 | CI 必须项 | 额外 CI job | 额外 hooks |
|------|----------|-------------|-----------|
| **lib** | fmt + check + test + api + security | cross-platform | pre-commit + commit-msg + pre-push |
| **cli** | fmt + check + test + run + api + security | moon run 验证 | 同上 |
| **wasm** | fmt + check + test-native + test-wasm + security | wasm/wasm-gc 双目标 | pre-commit 用 `--target wasm` |
| **ffi** | fmt + check + test + security | C 编译检查 | pre-commit 含 C 源码检查 |
| **parser** | fmt + check + test + api + security | valid/invalid/edge 分类 | pre-commit 含 fixture 验证 |
| **async** | fmt + check + test + api + security | 并发/超时测试 | pre-commit 含 timeout 检查 |

---

## 三阶段 CI 体系概览

```
┌─ 本地 pre-commit（每次提交，< 5s）──────────────────────┐
│  0. Security scan — 检测密钥泄露                         │
│  1. moon fmt       — 自动格式化 + re-stage               │
│  2. moon info      — 更新接口文件 + re-stage              │
│  3. moon check     — 编译检查 + 弃用警告拦截              │
├─ 本地 commit-msg（每次提交，瞬时）───────────────────────┤
│  4. Conventional Commits 格式校验                        │
├─ 本地 pre-push（每次推送，~30s）─────────────────────────┤
│  5. moon check     — 最终编译检查                        │
│  6. moon test      — 全量测试                            │
├─ GitHub Actions CI（PR 合并前）──────────────────────────┤
│  7. Format   → moon fmt --check + git diff --exit-code    │
│  8. Check    → moon check --warn-list +73 + 弃用门禁      │
│  9. Test     → moon test --target native                  │
│ 10. Cross    → moon check --target wasm-gc/js             │
│ 11. API      → moon info + git diff --exit-code           │
│ 12. Security → moon-audit pipeline .                      │
│ 13. [main]   → moon run . + 输出验证                      │
│ 14. [wasm]   → moon test --target wasm                    │
└─────────────────────────────────────────────────────────┘
```

---

## 用户 vs Agent 分工

| 谁 | 做什么 |
|---|--------|
| **Agent** | 诊断现有 CI 覆盖、增强 hooks（commit-msg + 安全扫描 + auto-restage）、生成 CI workflow 预览、给出分支保护建议 |
| **用户** | 确认 CI workflow diff、配置 GitHub 分支保护、安装 GitHub CLI 执行保护规则、决定哪些 job 为 must-pass |

## 输出

```json
{
  "status": "ci_configured | blocked | partial",
  "project_type": "lib",
  "ci_workflow": ".github/workflows/ci.yml",
  "hooks_enhanced": {
    "commit_msg": "added",
    "security_scan": "added",
    "auto_restage": "added",
    "tag_push_skip": "added"
  },
  "branch_protection": "suggested (requires gh CLI + admin)",
  "user_approval_required": true,
  "next": "verify | implement"
}
```

## 错误恢复

| 问题 | 诊断 | 修复 |
|------|------|------|
| 不是 MoonBit 项目 | 无 `moon.mod` | 提示先 `moon new` 或 `moonbit-scaffold` |
| 不是 git 仓库 | `git rev-parse` 失败 | 提示 `git init` |
| 已有 CI 且用户拒绝覆盖 | 展示 diff 后用户拒绝 | 保留现有配置，标记为 blocked |
| no mbti 文件 | 新项目尚未运行 `moon info` | 首次 CI 运行自动生成，非阻断 |
| `moon-audit` 不可用 | command not found | CI 中设为 `continue-on-error: true` |
| GitHub CLI 未安装 | `gh` 命令不存在 | 跳过分支保护检查，仅给出建议文本 |

## 下一步

CI 配置完成后，进入 `moonbit-verify` 执行验证门禁。
