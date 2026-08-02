# MoonBit 技能编排

## 入口

所有用户请求从 `skills/using-moonbit-skills/SKILL.md` 进入。该引导技能在 SessionStart 时通过 `hooks/session-start` 注入到 agent 系统提示中。

---

## 技能全景

### 开发管线（推荐流程）

```
用户说"我要做 X"
    │
    ▼
┌─────────────────────────────────────────────────────┐
│ using-moonbit-skills (alwaysApply, 路由入口)          │
│ 检测 intent → 路由到正确技能                          │
└─────────────────┬───────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────┐
│ moonbit-plan — 需求澄清 + 设计决策                    │
│ 输出: primary_type + capabilities + targets + API    │
│ 用户介入: 选择架构模式 + 设计 API                      │
│ 路由: → Spike (可选) 或 writing-plans 或 scaffold                     │
└─────────────────┬───────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────┐
│ [Spike] 原型验证（可选）                              │
│ 验证关键假设 → 丢弃代码 → 经验写入 writing-plans       │
│ 路由: → writing-plans                                 │
└─────────────────┬───────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────┐
│ moonbit-writing-plans — 设计→可执行任务拆解            │
│ 输出: task list (每任务含行为增量+验证命令+预期结果)     │
│ 路由: → scaffold (新项目) / implement (已有项目)       │
└─────────────────┬───────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────┐
│ moonbit-scaffold — 动态生成项目骨架                    │
│ 方式: 按类型动态生成，不依赖预置模板                    │
│ CLI: pkgtype(kind: "executable")                     │
│ 验证: moon fmt --check + moon check + moon test      │
│ 路由: → init 或 testing 或 implement                           │
└─────────────────┬───────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────┐
│ moonbit-init — Git hooks 配置（L1 + L2 本地门禁）      │
│ L1 pre-commit: fmt --check + check                    │
│ L2 pre-push: test + audit                             │
│ 路由: → ci                                            │
└─────────────────┬───────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────┐
│ moonbit-ci — CI 基础设施（新项目首次提交前必配）     │
│ 本地: commit-msg(Conventional Commits) + 安全扫描     │
│ 远端: GitHub Actions 多 job 流水线                     │
│ 路由: → testing 或 implement                           │
└─────────────────┬───────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────┐
│ moonbit-testing — 测试设计与编写                       │
│ 输出: 测试策略 + 文件组织 + 测试代码                    │
│ 路由: ↔ implement（双向）                              │
└─────────────────┬───────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────┐
│ moonbit-implement — TDD 实现 / Bug 修复              │
│ 模式: Feature TDD | Bug Fix                          │
│ Feature: RED(测试)→GREEN(实现)→VERIFY(全量)         │
│ Bug Fix: REPRODUCE→DIAGNOSE→FIX→VERIFY→LEARN        │
│ 模块化小步实现: 单任务单功能点, 目标过大回 writing-plans │
│ 每任务后: moonbit-code-review（未批准则循环）              │
│ Bug Fix 后: 自动触发 moonbit-learn                     │
│ 分类: main项目 + moon run . / lib项目 + 临时 consumer  │
│ 路由: → verify                                        │
└─────────────────┬───────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────┐
│ moonbit-perform — 性能优化                            │
│ 输出: 性能基线 + 优化实现 + 对比验证                    │
│ 路由: ↔ implement（双向）；↔ refactor（双向）；→ verify  │
└─────────────────┬───────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────┐
│ moonbit-refactor — 重构                               │
│ 输出: 重构后的代码（可观察行为不变）                     │
│ 路由: ↔ implement（双向）；↔ perform（双向）；→ verify   │
└─────────────────┬───────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────┐
│ moonbit-verify — 全量验证门禁                          │
│ 硬性: B1-B4 (格式/类型/测试/工作区) + C1-C3 (API/run/consumer) │
│ 专属: main→moon run . / lib→临时 consumer 编译验证     │
│ 软性: E1-E6 (跨平台/安全/性能/API深度/CI/文档)          │
│ 路由: → evaluate                                      │
└─────────────────┬───────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────┐
│ moonbit-evaluate — 验收评估 + 发布管理                    │
│ 委托 verify + 类型专属验证 + CHANGELOG/Release Notes/回退预案 │
│ main: moon run . + 输出验证                           │
│ lib: 临时 consumer 编译验证 + cross-platform           │
│ API: 比对 pkg.generated.mbti 与上一 Tag，自动建议 Major/Minor/Patch │
│ CI/CHANGELOG/Release Notes: 预览模式，用户批准后写入     │
│ 用户介入: 判断"好了"或"再改"                           │
│ 路由: → cd（部署） 或 → implement                      │
└─────────────────┬───────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────┐
│ moonbit-cd — 持续部署                                  │
│ 部署策略: 蓝绿/金丝雀/滚动/直接发布                     │
│ 制品管理: native binary / wasm / mooncake 包           │
│ 回滚预案: 每个部署必须附带回滚计划                       │
│ 路由: → 生产运行（或 hotfix → implement）               │
└─────────────────┬───────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────┐
│ 生产运行                                              │
│ 可观测性数据 (structured logs / metrics / traces)     │
│ 参考: references/patterns/observability.md             │
└─────────────────┬───────────────────────────────────┘
                  │
          ┌───────┴────────┐
          ▼                ▼
   ┌────────────┐   ┌──────────────┐
   │ 正常运行    │   │ 事故/异常    │
   └────────────┘   └──────┬───────┘
                           │
                           ▼
                    ┌──────────────────┐
                    │ incident →       │
                    │ moonbit-learn    │
                    │ (RCA 模式)       │
                    │ 复盘 → 沉淀      │
                    └──────────────────┘
```

### 独立技能（单次调用）

| 技能 | 触发场景 | 类型 |
|------|---------|------|
| `moonbit-init` | 初始化项目、配置 git hooks | 管线步骤 |
| `moonbit-ci` | CI 基础设施构建（GitHub Actions + hooks 增强 + 分支保护） | 管线步骤 |
| `moonbit-docs` | API 文档、README、CHANGELOG、用户指南、ADR 维护 | 管线步骤 |
| `moonbit-security` | 威胁建模、依赖漏洞扫描、安全设计审查 | 管线步骤 |
| `moonbit-plan` | 需求澄清（目标/场景/客户/边界/维护五问）、架构和 API 设计；宏观设计 + 模块划分 + 规则承载 + 可维护性设计 | 管线入口 |
| `moonbit-writing-plans` | 设计→任务拆解（分阶段 Phase、分步骤、粒度约束、维护 Phase、批次 ≤5） | 管线步骤 |
| `moonbit-scaffold` | 动态生成项目骨架（按模块组织目录） | 管线步骤 |
| `moonbit-testing` | 测试设计、组织、写法、迭代；测试时机决策（先行 vs 后补） | 管线并行 |
| `moonbit-perform` | 性能测量、瓶颈分析、优化实现 | 管线并行 |
| `moonbit-refactor` | 技术债务识别、小步重构、回归验证 | 管线并行 |
| `moonbit-implement` | TDD 实现 + Iron Law + debug；模块化小步实现；批次上限（≤5/批）；Git 提交契约（任务验收后自动建分支→提交→合并） | 管线核心 |
| `moonbit-task` | 单一任务实现：测试前置 TDD + 逐项验收交付（交付后自动提交合并，构成批次检查点） | 管线核心 |
| `moonbit-git` | 功能分支工作流、提交契约、合并、worktree 并行管理 | 独立 |
| `moonbit-code-review` | 任务间代码审查（任务/模块粒度 + 验收项↔测试对应） | 任务间门禁 |
| `moonbit-verify` | 全量验证门禁 + 按模块/任务验证子集 | 管线检查点 |
| `moonbit-evaluate` | 验收评估（任务级验收清单汇总）+ 发布管理 | 管线终点 |
| `moonbit-cd` | 持续部署 + 制品管理 + 回滚执行 | 管线终点 |
| `moonbit-learn` | 吸收错误、更新技能 | 独立 |

---

## 三级检测体系

分布在 verify 中，按三级分类组织：

### 基础测试（B — 所有项目必选）

任何 MoonBit 项目均须通过，否则不能声称代码可用：

| # | 要求 | 归属技能 | 命令 |
|---|------|---------|------|
| B1 | 代码格式一致性 | verify | `moon fmt --check` |
| B2 | 类型安全 | verify | `moon check --warn-list +73` |
| B3 | 功能完整性 | verify | `moon test`（目标由项目类型决定） |
| B4 | 工作区干净 | verify | `git status --porcelain`（发布阶段） |

### Custom 测试（C — 按项目类型选择）

不同项目类型有不同验证标准，属于该类型则必选：

| # | 要求 | 归属技能 | 命令 | 适用类型 |
|---|------|---------|------|---------|
| C1 | API 稳定性 | verify | `moon info --target native` + `git diff --exit-code` | lib/cli/parser/async；ffi/wasm 豁免 |
| C2 | [main] 可执行验证 | verify + evaluate | `moon run .` + 输出验证 | main/cli 项目 |
| C3 | [lib] 消费验证 | verify + evaluate | 临时 consumer 编译验证 | lib/ffi/wasm/parser/async |

### 增强测试（E1-E6 — 推荐但非阻断）

推荐执行，报告结果供用户决策：

| # | 要求 | 归属技能 | 命令 |
|---|------|---------|------|
| E1 | 跨平台兼容 | verify | `moon check --target all` |
| E2 | 安全审计 | verify | `moon-audit pipeline .` |
| E3 | 性能基线 | verify | 测试执行时间对比 |
| E4 | API 深度检查 | verify | 参数类型/可见性/错误处理审查 |
| E5 | CI 配置完整性 | verify | `.github/workflows/ci.yml` 校验 |
| E6 | 文档完整性 | verify | pub fn docstring / README 示例 / CLI --help |

---

## 项目类型分支

项目类型检测逻辑详见 [`references/type-detection.md`](./type-detection.md)，verify 和 evaluate 共用同一份检测逻辑，避免漂移。此处不再重复检测代码。

类型分支决定后续路径：

| 类型 | implement | verify | evaluate |
|------|-----------|--------|---------|
| **main**（`pkgtype(kind: "executable")` 或旧 `"is-main": true`） | `moon run .` 验证输出 | B1-B4 + C1 + C2 `moon run .` | `moon run .` + 输出非空 + CI 含 run |
| **lib**（都不是） | `moon check --target all` | B1-B4 + C1 + C3 临时 consumer 编译验证 | 临时 consumer + cross-platform + README 生成 |

---

## hooks 关联

| Hook 事件 | 触发时机 | 执行脚本 | 注入内容 |
|-----------|---------|---------|---------|
| SessionStart | startup/clear/compact | `hooks/session-start`（Bash；Windows 可用 `run-hook.cmd` / PowerShell 入口） | `skills/using-moonbit-skills/SKILL.md` |
| PreCommit | git commit | `hooks/pre-commit.sh` | B1 + B2（fmt + check） |
| PrePush | git push | `hooks/pre-push.sh` | B3 + E2（test + audit） |
| PreCompletion | 对话完成前 | `hooks/pre-completion.sh` | B1-B3 + C1 + E2 |

平台差异：Claude/Kimi 的 `hooks/hooks.json` 接入完整 Git/完成前事件；OMP/Pi 接入 SessionStart 与 PostTool；Codex/Cursor/Gemini 默认接入编辑后的轻量验证。平台 Hook 不能替代显式 `moonbit-verify`。

---

## 技能间依赖关系

```
using-moonbit-skills (alwaysApply, 路由入口)
    │
    ├── moonbit-init（无依赖）
    ├── moonbit-docs（无依赖，可任何时候调用）
    ├── moonbit-security（无依赖，可任何时候调用）
    ├── moonbit-plan（无依赖）
    │    │
    │    ├── moonbit-writing-plans（依赖 plan 输出）
    │    │    │
    │    │    ├── moonbit-scaffold（依赖 plan 输出类型）
    │    │    │    │
    │    │    │    ├── moonbit-testing（与 implement 双向依赖）
    │    │    │    │    │
    │    │    │    │    └── moonbit-implement（testing 提供组织决策，implement 遵循）
    │    │    │    │
    │    │    │    └── → moonbit-implement（依赖 plan+scaffold）
    │    │    │         │
    │    │    │         ├── → moonbit-code-review（每任务后）
    │    │    │         │
    │    │    │         ├── → moonbit-perform（可选，性能优化循环）
    │    │    │         │
    │    │    │         ├── → moonbit-refactor（可选，重构循环）
    │    │    │         │
    │    │    │         └── → moonbit-verify（全量后）
    │    │    │              │
    │    │    │              ├── → moonbit-evaluate（verify 通过后）
    │    │    │              │    │
    │    │    │              │    └── → moonbit-cd（evaluate 批准后）
    │    │    │              │
    │    │    │              └── → moonbit-learn（bug fix 后自动触发）
    │    │    │
    │    │    └── moonbit-implement（已有项目，跳过 scaffold）
    │    │    └── moonbit-task（单一任务：测试前置 TDD + 逐项验收交付，依赖 writing-plans 输出）
    │    │
    │    └── moonbit-scaffold（直接 scaffold）
    │
    ├── moonbit-code-review（无依赖，可任何时候调用）
    ├── moonbit-verify（依赖 implement 完成）
    └── moonbit-learn（无依赖，可任何时候调用）
```

---

## 管线持久化状态 (.moonbit-pipeline.json)

在长周期或跨 Session / Context 压缩开发时，Agent 在项目根目录读写轻量级持久化状态文件 `.moonbit-pipeline.json`。由 `moonbit-writing-plans` 初始化，并由 `moonbit-implement` / `moonbit-verify` / `moonbit-evaluate` / `moonbit-cd` / `moonbit-learn` 实时更新；状态必须通过 `scripts/validate-pipeline-state.py` 校验：

```json
{
  "schema_version": 1,
  "pipeline": "development",
  "phase": "implement",
  "status": "in_progress",
  "project_type": "cli",
  "primary_type": "parser",
  "capabilities": ["lexer", "tokenizer"],
  "targets": ["native"],
  "plan_file": "docs/plans/2026-07-29-parser-plan.md",
  "tasks": {"total": 13, "completed": 4, "current": 5},
  "last_verification": "2026-07-29T10:25:00Z",
  "last_updated": "2026-07-29T10:30:00Z",
  "next": "implement:task-5"
}
```

验证命令输出应另存为 `moonbit-verification.schema.json` 定义的验证产物，不要把检查详情混入管线状态文件。

**Session 恢复机制**：
当 Session 重新初始化或发生 Context 压缩重入时，Agent 若在根目录检测到 `.moonbit-pipeline.json`，优先读取该文件恢复进度断点，跳过重复的计划与探索逻辑。
---

## 回落链

当某个技能不适用时：

```
技能不适用
    │
    ├── 有替代技能 → 切换到替代技能
    ├── 有降级方案 → 执行降级方案
    └── 无替代 → 问用户
```

例如：
- `moon-audit` 未安装 → 跳过 S2，提示用户安装
- `ffi` 项目无 C 编译器 → 提示安装 GCC/Clang，中止
- `wasm` 项目无 WASM 运行时 → 提示安装 wasmtime，继续
- `moonbit-code-review` 未找到 → 归入 `moonbit-verify` 执行
- 项目无 `moon.pkg` → 提示先执行 `moonbit-scaffold`
- CI 本地通过后失败 → 回到 `moonbit-implement` (Bug Fix Mode)，使用 CI 日志接入规范 (Log Ingestion) 提取 target/错误码进行诊断与复现

### 设计回溯

```
设计回溯触发
    │
    ├── implement 发现 API 不可测 → 回到 plan
    ├── perform 发现瓶颈是架构问题 → 回到 plan
    ├── refactor 发现坏味是设计缺陷 → 回到 plan
    └── evaluate 用户不认可设计方向 → 回到 plan
```