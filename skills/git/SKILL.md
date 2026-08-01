---
name: moonbit-git
description: "Use when performing Git operations during MoonBit development — creating feature branches, committing task deliverables, merging branches, or considering parallel worktree. Triggered when a feature implementation needs a branch, when a task is accepted and ready to commit, or when parallel feature work is considered. Branch-per-feature: never modify main directly."
---

# Git — 分支工作流与提交契约

## 职责

管理 MoonBit 项目在 Git 仓库下的开发规范：**功能分支工作流、任务提交契约、worktree 并行（需用户同意）、合并策略**。其他技能（`moonbit-implement` / `moonbit-task` / `moonbit-writing-plans`）涉及 Git 操作时引用本技能，避免各写各的漂移。

**适用前提**：项目本身是 git 仓库（存在 `.git` 或 `git rev-parse` 成功）。非 git 仓库只展示变更，不执行 git 命令。

## The Default Contract

```
DEFAULT: NO FEATURE WORK DIRECTLY ON MAIN
DEFAULT: NO COMMIT WITHOUT BRANCH OR USER AUTHORIZATION
DEFAULT: NO WORKTREE WITHOUT USER CONSENT
```

这些是 Agent 的默认安全协作规则，不是对用户明确指令的绝对否决。用户在当前对话中明确要求直接在 main 上修改、提交或使用 worktree 时，Agent 可以遵从，但必须在执行前说明影响并保留新鲜验证证据。

- **默认**：功能实现使用功能分支，不在主分支直接修改。
- **用户明确要求例外**：允许在 main 上工作，但报告该例外；不把它伪装成标准流程。
- **提交**：仍需区分用户明确授权与 Agent 自行提交；用户未授权时只展示 diff。
- **worktree**：用户明确同意后才使用；用户未同意时顺序实现。

## 分支工作流

```
主分支 (main)
  │
  ├─ 建分支: git checkout -b feat/{feature-name}
  │    │
  │    ├─ 实现功能 A（TDD）→ 验收 → code-review → 提交
  │    ├─ 合并: git checkout main && git merge --no-ff feat/{feature-name}
  │    │
  │    ├─ 建新分支: git checkout -b feat/{feature-name-2}   ← 实现下一个功能
  │    │
  │    └─ ...（逐个功能循环：建分支 → 实现 → 合并 → 再建分支）
```

- **默认每个功能一个分支**，合并后删除该分支（`git branch -d`）。用户明确要求直接在 main 上工作时，记录例外并按用户指令执行。
- 分支命名：`feat/{名称}` / `fix/{名称}` / `refactor/{名称}` / `docs/{名称}`。
- 默认顺序实现：建分支 → 实现 → 合并 → 再建分支；用户明确要求跳过分支时，说明风险后执行。

## 提交契约

任务验收（RED → GREEN → VERIFY → code-review 通过）之后，按以下规则处理提交：

| 场景 | 处理 | 说明 |
|------|------|------|
| **单个任务** | **交给用户确认，不自动提交** | 展示验收清单 + diff，等待用户决定（确认/修改/提交） |
| **多个任务 + 用户已授权提交** | **验收后提交 git** | 在功能分支上执行 `git add` + `git commit`，使用 Conventional Commits 规范 |
| **非 git 仓库** | 只展示变更，不执行 git | `git rev-parse` 失败则跳过所有 git 操作 |

**提交前提检查（提交前必做）**：
```bash
# 1. 确认是 git 仓库
git rev-parse --is-inside-work-tree 2>/dev/null || echo "NOT_A_GIT_REPO"

# 2. 确认当前分支；若用户明确授权在 main 上工作，记录该例外
git branch --show-current

# 3. 确认授权：仅当用户在本对话中明确授权"提交/commit"时执行
#    未获授权 → 展示 diff，等待用户确认

# 4. 提交前工作区检查（提交的应只有本次任务产物）
git status --porcelain
```

**提交规则**：
- 单次提交只包含**一个 Task 的产物**（对应「模块化小步实现」的粒度），不把多个任务混在一个提交里
- commit message 遵循 Conventional Commits：`feat:` / `fix:` / `refactor:` / `test:` / `docs:`
- 提交后确认 `git status --porcelain` 干净（预期产物如 `pkg.generated.mbti` 按 allowlist 处理）
- 用户未授权 → 永远只展示 diff，等待用户确认后再提交

## worktree 并行（需用户同意）

- **使用前必须请示用户**：明确告知将创建多个 worktree 并行实现功能，得到用户同意后才可执行
- **用户不同意 → 顺序实现**：建分支 → 合并 → 再建分支
- 每个 worktree 一个分支，互不干扰；仅当一个功能内部子任务可并行时才考虑

```bash
git worktree add ../{project}-{feature} -b feat/{feature-name}
# 在 worktree 中实现该功能 → 提交 → 合并回主仓库
git worktree remove ../{project}-{feature}
```

## 合并策略

- 推荐 `--no-ff` 合并保留功能分支历史
- 合并前确认：目标分支测试全绿（`moon test`）、工作区干净
- 合并后删除已合并分支（`git branch -d`）
- 冲突无法自动解决 → 停止，展示冲突文件，请求用户决策

## Red Flags — STOP and Re-evaluate

- 未经说明就在 main 上修改功能代码；用户明确要求的 main 例外不属于违规，但必须记录风险。
- 未获用户同意就使用 worktree（"反正可以并行"）。
- 未获授权就提交（"反正都做完了"）。
- 一次提交混入多个任务产物（"一起提交省事"）。
- 合并前不验证测试（"合并就完事了"）。
- 非 git 仓库却执行 git 命令。

**除用户明确覆盖的分支例外外，以上情况都意味着停止并重新检查分支工作流。**

## 停止条件

- 非 git 仓库 → 只展示变更，不执行 git 操作
- 分支冲突无法解决 → 停止，展示冲突文件，请求用户决策
- worktree 用户未同意 → 切换为顺序实现（建分支→合并→再建分支）
- 用户未授权提交 → 停止提交动作，展示 diff 等待用户确认

## 错误恢复

| 问题 | 诊断 | 修复 |
|------|------|------|
| 误在主分支修改 | 未建功能分支就动手 | `git stash` → 建分支 → `git stash pop`；已提交则新建分支并 `git reset --soft` 回退主分支 |
| 提交被拒（未授权） | 授权缺失 | 展示 diff，等待用户确认 |
| 合并冲突 | 双方修改同一处 | 展示冲突文件，逐个解决后重新合并；无法解决则停止问用户 |
| worktree 残留 | 未清理 | `git worktree prune`，确认无残留分支 |
| 非 git 仓库 | 无 `.git` | 只展示变更，不执行 git；如需版本管理提示用户先 `git init` |

## 输出

```json
{
  "status": "committed | confirmed | blocked",
  "branch": "feat/lexer",
  "commits": [{"hash": "abc1234", "message": "feat: add tokenize"}],
  "merged": false,
  "worktree_used": false,
  "next": "implement | verify"
}
```

## 下一步

Git 操作完成后，继续原技能流程（`moonbit-implement` / `moonbit-task` 的实现与验收循环）。
