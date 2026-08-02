---
name: moonbit-git
description: "Use when performing Git operations during MoonBit development — creating feature branches, committing task deliverables, merging branches, or considering parallel worktree. Triggered when a feature implementation needs a branch, when a task is accepted and ready to commit, or when parallel feature work is considered. One-time authorization: ask once, record approval in the target project's AGENTS.md, then auto commit+merge per task. Branch-per-feature: never modify main directly."
---

# Git — 分支工作流与提交契约

## 职责

管理 MoonBit 项目在 Git 仓库下的开发规范：**功能分支工作流、任务提交契约、worktree 并行（需用户同意）、合并策略**。其他技能（`moonbit-implement` / `moonbit-task` / `moonbit-writing-plans`）涉及 Git 操作时引用本技能，避免各写各的漂移。

**适用前提**：项目本身是 git 仓库（存在 `.git` 或 `git rev-parse` 成功）。非 git 仓库只展示变更，不执行 git 命令。

## The Default Contract

```
DEFAULT: NO FEATURE WORK DIRECTLY ON MAIN
DEFAULT: NO COMMIT WITHOUT ONE-TIME AUTHORIZATION
DEFAULT: NO WORKTREE WITHOUT USER CONSENT
```

这些是 Agent 的默认协作规则，不是对用户明确指令的绝对否决。用户在当前对话中明确要求跳过提交、直接在 main 上修改或使用 worktree 时，Agent 可以遵从，但必须在执行前说明影响并保留新鲜验证证据。

- **默认**：每个任务验收通过后，若目标项目已写入**一次性授权记录**（见下）→ **自动执行**「建功能分支 → 提交 → 合并回主分支 → 删除分支」；无授权记录 → **询问一次**，用户同意后写入授权并自动执行，拒绝则只展示 diff。
- **用户明确要求例外**：允许在 main 上工作或跳过提交，但报告该例外；不把它伪装成标准流程。
- **提交**：在功能分支上进行，单次提交只含一个 Task 产物。
- **worktree**：用户明确同意后才使用；用户未同意时顺序实现。

## 一次性授权协议（One-Time Authorization）

**目的**：每个任务都要走「建分支 → 提交 → 合并」流程，但不必每次询问用户。通过**一次性授权**解决：用户在目标项目授权一次，写入该项目级指令文件，之后所有任务的 Git 流程自动执行。

**授权检测（每个任务提交前必做）**：

1. 检查**目标项目**根目录指令文件（`AGENTS.md`，或该平台对应的 `CLAUDE.md` / `.atomcode.md` / `.atomcode.user.md`）中是否有「自动提交授权」标记（例如「自动提交授权」或 "AUTO_COMMIT_AUTHORIZED"）。
2. **有授权记录** → 直接自动执行：建功能分支 → 提交 → 合并回主分支 → 删除分支，**不再询问**。
3. **无授权记录** → **询问一次**：「是否允许本项目自动执行 git 提交与合并？允许则写入本项目指令文件，之后每个任务自动执行，不再询问」。
   - 用户允许 → 将授权记录写入目标项目指令文件，然后自动执行本任务流程。
   - 用户拒绝 → 本任务只展示 diff（验收清单 + 变更），等待用户确认；不写入授权。
4. 用户在对话中明确说"不要自动提交/不要合并" → 该次及后续均只展示 diff，直到用户改变主意。

**授权记录写入模板**（写入**目标项目**根目录 `AGENTS.md`，不写进技能仓库）：

```markdown
## Git 自动提交授权（一次性）
本项目用户已授权 Agent 自动执行 git 提交与合并（每任务验收后：建功能分支 → 提交 → 合并回主分支 → 删除分支），后续会话无需再逐次询问；仅当用户明确说"不要自动提交/不要合并"时例外。
```

- 授权记录写在**目标项目**的根目录指令文件，跨会话持久有效；不影响其他用户决策事项（worktree、public API 变更等仍需询问）。

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

- **默认每个任务一个功能分支**，验收提交后合并回主分支并删除该分支（`git branch -d`）。用户明确要求直接在 main 上工作时，记录例外并按用户指令执行。
- 分支命名：`feat/{名称}` / `fix/{名称}` / `refactor/{名称}` / `docs/{名称}`。
- 默认顺序实现：建分支 → 实现 → 提交 → 合并 → 再建分支（下一个任务）；用户明确要求跳过分支时，说明风险后执行。

## 提交契约

任务验收（RED → GREEN → VERIFY → code-review 通过）之后，按一次性授权协议执行：

```
验收通过 → 检测目标项目指令文件（AGENTS.md 等）是否有「自动提交授权」记录
         → 无 → 询问一次；用户允许 → 写入授权记录
         → 有（或已获本次授权）→ 确保在功能分支上（不在则 git checkout -b feat/{task-name}）
         → git add <本任务产物> && git commit -m "feat: ..."（Conventional Commits）
         → git checkout main && git merge --no-ff feat/{task-name}
         → git branch -d feat/{task-name}   ← 删除已合并分支
         → 继续下一个任务（再建新分支）
```

| 场景 | 处理 | 说明 |
|------|------|------|
| **已有授权记录（目标项目 AGENTS.md）** | **验收后自动提交并合并** | 在功能分支上 `git add` + `git commit`（Conventional Commits），随后合并回主分支并删除分支；不再询问 |
| **无授权记录（首次）** | **询问一次** | 用户允许 → 写入授权记录并自动执行；用户拒绝 → 只展示 diff（验收清单 + 变更），等待用户确认 |
| **用户明确要求不自动提交/不合并** | 只展示 diff，等待用户确认 | 展示验收清单 + diff，等待用户决定（确认/修改/提交） |
| **非 git 仓库** | 只展示变更，不执行 git | `git rev-parse` 失败则跳过所有 git 操作 |

**批次检查点（与任务批次约束衔接）**：

- 多任务按批次执行（`moonbit-implement` / `moonbit-writing-plans`：每批最多 5 个任务）
- **每完成一个任务并自动提交合并后，即构成一个批次检查点**：压缩会话/开始新上下文，再继续下一任务
- 达到批次上限（5 个）时**必须停在检查点**：汇报进度 + 已自动提交合并 → 压缩会话 → 下一批
- 平台不支持会话压缩 → 收紧批次上限（≤3），批间强制提交

**提交前提检查（提交前必做）**：
```bash
# 1. 确认是 git 仓库
git rev-parse --is-inside-work-tree 2>/dev/null || echo "NOT_A_GIT_REPO"

# 2. 确认当前分支；若用户在 main 上且任务尚未开分支，先建功能分支
git branch --show-current

# 3. 检测一次性授权：目标项目 AGENTS.md 是否含「自动提交授权」记录？
#    有 → 自动提交并合并；无 → 询问一次（用户允许则写入授权再执行）；
#    用户明确要求"不要自动提交/不要合并" → 展示 diff，等待用户确认

# 4. 提交前工作区检查（提交的应只有本次任务产物）
git status --porcelain
```

**提交规则**：
- 单次提交只包含**一个 Task 的产物**（对应「模块化小步实现」的粒度），不把多个任务混在一个提交里
- commit message 遵循 Conventional Commits：`feat:` / `fix:` / `refactor:` / `test:` / `docs:`
- 提交后确认 `git status --porcelain` 干净（预期产物如 `pkg.generated.mbti` 按 allowlist 处理）
- 用户明确要求不自动提交 → 只展示 diff，等待用户确认后再提交

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
- 验收通过且已有授权记录却不自动提交/不合并（"反正用户会看，先不动 git"）——一次性授权后默认自动执行，除非用户明确要求例外。
- 用户明确要求"不要自动提交"后仍自动提交（"反正都做完了"）。
- 一次提交混入多个任务产物（"一起提交省事"）。
- 合并前不验证测试（"合并就完事了"）。
- 非 git 仓库却执行 git 命令。

**除用户明确覆盖的分支例外外，以上情况都意味着停止并重新检查分支工作流。**

## 停止条件

- 非 git 仓库 → 只展示变更，不执行 git 操作
- 分支冲突无法解决 → 停止，展示冲突文件，请求用户决策
- worktree 用户未同意 → 切换为顺序实现（建分支→合并→再建分支）
- 用户明确要求不自动提交 → 停止提交动作，展示 diff 等待用户确认

## 错误恢复

| 问题 | 诊断 | 修复 |
|------|------|------|
| 误在主分支修改 | 未建功能分支就动手 | `git stash` → 建分支 → `git stash pop`；已提交则新建分支并 `git reset --soft` 回退主分支 |
| 提交被拒（用户要求不自动提交） | 用户明确要求例外 | 展示 diff，等待用户确认 |
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
