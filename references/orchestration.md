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
│ moonbit-ci — CI/CD 基础设施（新项目首次提交前必配）     │
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
│ 硬性: H1-H5 (格式/类型/测试/info/工作区)               │
│ 专属: main→moon run . / lib→临时 consumer 编译验证     │
│ 软性: S1-S6 (跨平台/安全/性能/API深度/CI/文档)          │
│ 路由: → evaluate                                      │
└─────────────────┬───────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────┐
│ moonbit-evaluate — 验收评估 + 发布准备                 │
│ 委托 verify + 类型专属验证 + CI/README 预览 + SemVer API Tag 比对 │
│ main: moon run . + 输出验证                           │
│ lib: 临时 consumer 编译验证 + cross-platform           │
│ API: 比对 pkg.generated.mbti 与上一 Tag，自动建议 Major/Minor/Patch │
│ CI/README: 预览模式，用户批准后写入                     │
│ 用户介入: 判断"好了"或"再改"                           │
│ 路由: 完成 或 → implement                              │
└─────────────────────────────────────────────────────┘
```

### 独立技能（单次调用）

| 技能 | 触发场景 | 类型 |
|------|---------|------|
| `moonbit-init` | 初始化项目、配置 git hooks | 管线步骤 |
| `moonbit-ci` | CI/CD 基础设施构建（GitHub Actions + hooks 增强 + 分支保护） | 管线步骤 |
| `moonbit-plan` | 需求澄清、架构和 API 设计 | 管线入口 |
| `moonbit-writing-plans` | 设计→任务拆解 | 管线步骤 |
| `moonbit-scaffold` | 动态生成项目骨架 | 管线步骤 |
| `moonbit-testing` | 测试设计、组织、写法、迭代 | 管线并行 |
| `moonbit-perform` | 性能测量、瓶颈分析、优化实现 | 管线并行 |
| `moonbit-refactor` | 技术债务识别、小步重构、回归验证 | 管线并行 |
| `moonbit-implement` | TDD 实现 + Iron Law + debug | 管线核心 |
| `moonbit-code-review` | 任务间代码审查 | 任务间门禁 |
| `moonbit-verify` | 全量六维验证门禁 | 管线检查点 |
| `moonbit-evaluate` | 验收评估 + 发布准备 | 管线终点 |
| `moonbit-learn` | 吸收错误、更新技能 | 独立 |

---

## 硬性 vs 软性分类

### 硬性要求（必选，阻断型）

分布在 verify 和 evaluate 中，任何一项不通过则阻断：

| # | 要求 | 归属技能 | 命令 | 类型豁免 |
|---|------|---------|------|---------|
| H1 | 代码格式一致性 | verify | `moon fmt --check` | 无（所有项目类型必选） |
| H2 | 类型安全 | verify | `moon check --warn-list +73` | 无（所有项目类型必选） |
| H3 | 功能完整性 | verify | `moon test --target native` | 无（所有项目类型必选） |
| H4 | 工作区干净 | verify | `git status --porcelain`（发布阶段） | 无（所有项目类型必选） |
| H5 | API 稳定性 | verify | `moon info --target native` | c-ffi、wasm 豁免（无对外暴露的 MoonBit pub API） |
| H6 | [main] 可执行验证 | verify + evaluate | `moon run .` + 输出验证 | 仅 main 项目（cli）执行；lib 项目跳过 |
| H7 | [lib] 消费验证 | verify + evaluate | 临时 consumer 编译验证 | 仅 lib/c-ffi/wasm/parser/async 执行；main 项目跳过 |

> **类型豁免说明**：c-ffi 和 wasm 项目的主要对外接口是 C ABI 或 WASM 导出，MoonBit 层面的 `pub` API 不是发布契约的核心，因此豁免 H5。其发布验证以 H7（消费验证）+ 类型专属检查为准。详见 verify/SKILL.md 的「各类型验证全景」表。

### 软性要求（可选，加分型）

分布在 verify 的 S1-S6 中，不阻断发布：

| # | 要求 | 归属技能 | 命令 |
|---|------|---------|------|
| S1 | 跨平台兼容 | verify | `moon check --target all` |
| S2 | 安全审计 | verify | `moon-audit pipeline .` |
| S3 | 性能基线 | verify | 测试执行时间对比 |
| S4 | API 深度检查 | verify | 参数类型/可见性/错误处理审查 |
| S5 | CI 配置完整性 | verify | `.github/workflows/ci.yml` 校验 |
| S6 | 文档完整性 | verify | pub fn docstring / README 示例 / CLI --help |

---

## 项目类型分支

项目类型检测逻辑详见 [`references/type-detection.md`](./type-detection.md)，verify 和 evaluate 共用同一份检测逻辑，避免漂移。此处不再重复检测代码。

类型分支决定后续路径：

| 类型 | implement | verify | evaluate |
|------|-----------|--------|---------|
| **main**（`pkgtype(kind: "executable")` 或旧 `"is-main": true`） | `moon run .` 验证输出 | H1-H5 + H6 `moon run .` | `moon run .` + 输出非空 + CI 含 run |
| **lib**（都不是） | `moon check --target all` | H1-H5 + H7 临时 consumer 编译验证 | 临时 consumer + cross-platform + README 生成 |

---

## hooks 关联

| Hook 事件 | 触发时机 | 执行脚本 | 注入内容 |
|-----------|---------|---------|---------|
| SessionStart | startup/clear/compact | `hooks/session-start`（Bash；Windows 可用 `run-hook.cmd` / PowerShell 入口） | `skills/using-moonbit-skills/SKILL.md` |
| PreCommit | git commit | `hooks/pre-commit.sh` | H1 + H2（fmt + check） |
| PrePush | git push | `hooks/pre-push.sh` | H3 + S2（test + audit） |
| PreCompletion | 对话完成前 | `hooks/pre-completion.sh` | H1-H3 + H5 + S2（H4 仅发布阶段） |

---

## 技能间依赖关系

```
using-moonbit-skills (alwaysApply, 路由入口)
    │
    ├── moonbit-init（无依赖）
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
    │    │    │              └── → moonbit-evaluate（verify 通过后）
    │    │    │
    │    │    └── moonbit-implement（已有项目，跳过 scaffold）
    │    │
    │    └── moonbit-scaffold（直接 scaffold）
    │
    ├── moonbit-code-review（无依赖，可任何时候调用）
    ├── moonbit-verify（依赖 implement 完成）
    └── moonbit-learn（无依赖，可任何时候调用）
```

---

## 管线持久化状态 (.moonbit-pipeline.json)

在长周期或跨 Session / Context 压缩开发时，Agent 在项目根目录读写轻量级持久化状态文件 `.moonbit-pipeline.json`。由 `moonbit-writing-plans` 初始化，并由 `moonbit-implement` / `moonbit-verify` / `moonbit-evaluate` 实时更新：

```json
{
  "pipeline": "development",
  "phase": "implement",
  "project_type": "main",
  "primary_type": "parser",
  "capabilities": ["lexer", "tokenizer"],
  "targets": ["native"],
  "plan_file": "docs/plans/2026-07-29-parser-plan.md",
  "hard_checks": {
    "fmt": "pass",
    "check": "pass",
    "test": "pass (12/12)",
    "info": "pass",
    "workspace": "pass"
  },
  "type_specific": {
    "moon_run": "pass (output: 'Hello')"
  },
  "soft_checks": {
    "cross_platform": "skipped (main project)",
    "security": "pass (0 findings)",
    "perf": "pass (1.2s)"
  },
  "progress": {
    "total_tasks": 13,
    "completed_tasks": 4,
    "current_task": 5
  },
  "last_updated": "2026-07-29T10:30:00Z",
  "next": "implement:task-5"
}
```

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
- `c-ffi` 项目无 C 编译器 → 提示安装 GCC/Clang，中止
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