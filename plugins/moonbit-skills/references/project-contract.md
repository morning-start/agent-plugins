# 契约式 MoonBit 项目结构参考（经验式，非强制）

> **定位**：本文档是「经验式/契约式」的项目结构参考——来自真实 MoonBit 项目（如 prism）沉淀的通用约定。
> **性质**：**默认建议，不是必要结构**。在用户没有特殊要求时提供一定结构性；用户有强制要求时（如项目 `AGENTS.md` 自定义），**以用户/项目约定为准**，本文档不覆盖。
> **使用方式**：技能按需读取本文档作为背景知识；不把本文档内容写死进任何 skill 的 Iron Law。

---

## 一、标准包结构

```
{project}/
├── moon.mod              # 模块元数据（顶层）
├── {pkg}/                # 每个目录 = 一个包
│   ├── moon.pkg          # 包声明 + 依赖列表
│   ├── *.mbt             # 包源码（block style，///| 分隔）
│   ├── *_test.mbt        # 黑盒测试（从包外部视角测试公共 API）
│   ├── *_wbtest.mbt      # 白盒测试（可访问包内实现细节）
│   └── deprecated.mbt    # （约定）已废弃的 block 集中存放
└── ...
```

约定要点：
- **每目录一个包**，`moon.pkg` 声明该包及其依赖
- **黑盒测试** `_test.mbt` 与**白盒测试** `_wbtest.mbt` 分开命名（verify C3 包结构检查的依据）
- 已废弃的 block 建议集中在各目录的 `deprecated.mbt`，便于后续清理
- MoonBit 代码为 **block style**：每个 block 以 `///|` 分隔，block 间顺序无关；重构时可逐 block 独立处理

## 二、规划与任务文档分离（放 .agent-workplace，不直接放项目 docs/）

> 本节约定针对**用户 MoonBit 项目**（使用本技能的目标项目）；插件自身开发见仓库根 `.agent-workplace/`（flowstate 完整版）。

### 工作区目录结构（FST 兼容版）

```
.agent-workplace/
├── docs/
│   ├── plan/           # 计划文档（路线图式规划：Phase→Batch→Task）
│   ├── task/           # 任务拆解文档（分阶段实现计划，含验证命令）
│   ├── spec/           # 规格草稿（implement 阶段的详细设计）
│   └── decisions.md    # 决策记录（DEC-xxx 格式，记录重大设计取舍）
├── state/
│   ├── checkpoint.json # 断点续跑（当前节点/阶段/批次/进度，FST 对齐）
│   └── artifacts.json  # 产物注册（跨阶段产出物追踪）
├── scripts/            # 实验脚本（探索性/验证性代码）
├── scratch/            # 一次性探索产物（`{YYYYMMDD}-{type}-{slug}`）
└── research/           # 调研缓存（技术选型/方案对比/根因调查）
```

| 路径 | 用途 | 规则 |
|------|------|------|
| `.agent-workplace/docs/plan/` | **计划文档**（路线图式规划） | 开发前先写计划：计划 → 阶段(Phase) → 批次(Batch) → 任务(Task)；长期方向与任务拆解分层，避免混入 |
| `.agent-workplace/docs/task/` | **任务拆解文档**（分阶段实现计划） | 任务拆解放这里，与计划分离；含验证命令 |
| `.agent-workplace/docs/spec/` | **规格草稿**（详细设计） | implement 阶段的详细规格、API 契约、接口签名；从 plan 细化而来 |
| `.agent-workplace/docs/decisions.md` | **决策记录** | 重大设计取舍用 DEC-xxx 编号记录（日期 + 决策 + 理由 + 影响） |
| `.agent-workplace/state/checkpoint.json` | **断点续跑** | 对齐 FST checkpoint 语义：当前节点、阶段、批次、任务进度；每批完成即更新 |
| `.agent-workplace/state/artifacts.json` | **产物注册** | 跨阶段产出物追踪（plan 输出 → task 拆解 → spec → 代码 → 测试） |
| `.agent-workplace/scripts/` | **脚本尝试** | 探索性/实验性脚本，验证"怎么做才对"，不提交 |
| `.agent-workplace/scratch/` | **一次性探索** | 命名格式 `{YYYYMMDD}-{type}-{slug}`；体积膨胀时自行清理（保留最近产物） |
| `.agent-workplace/research/` | **调研缓存** | 技术选型、方案对比、根因调查的中间产物 |
| `docs/requirements.md` | 需求文档（设计决策的权威来源） | plan 阶段产出 |

> **为什么放 `.agent-workplace/`**：计划/任务/脚本/状态是**过程态**，高频变动、不提交 git；
> 直接放项目原始 `docs/` 会污染提交历史。`.agent-workplace/` 全目录被 gitignore。
> **用户项目用 FST 兼容版**（上述目录结构，由 `moonbit-writing-plans` /
> `moonbit-implement` 自行创建，无需模板、不依赖 flowstate 插件本身）；
> **插件自身开发用 flowstate 完整版**。两者目录结构兼容，迁移时无需重构。

约定要点：
- **路线图与任务拆解分层**：`.agent-workplace/docs/plan/` 管方向，`.agent-workplace/docs/task/` 管执行
- **规格与计划分离**：`.agent-workplace/docs/spec/` 存放 implement 阶段细化的设计规格，从 plan 输出进一步细化
- **决策可追溯**：`.agent-workplace/docs/decisions.md` 记录每个 DEC-xxx 决策的日期、内容、理由和影响范围
- **单一状态文件**：`.agent-workplace/state/checkpoint.json` 是唯一的状态源（FST 兼容），每批完成即更新，支持跨 Session 恢复
- 会话开始时按序读取：`state/checkpoint.json` → `docs/plan/` → `docs/task/`，恢复上下文

## 三、进度与提交约定

- **one feature per commit**：一次提交只包含一个功能/任务产物
- **commit after each task**：每个任务验收通过后提交（功能分支上）；按一次性授权协议执行——目标项目 AGENTS.md 已有授权 → 自动提交；无授权 → 询问一次并写入授权记录后自动提交；用户明确要求不自动提交时例外
- **branch per task**：每个任务一个功能分支，验收提交后合并回主分支（`--no-ff`）再删除
- **提交前必须通过**：`moon fmt --check` + `moon check` + `moon test`
- 与 `moonbit-git` 提交契约一致：单次提交只含一个 Task 产物，遵循 Conventional Commits

## 四、Tooling 使用约定

| 命令 | 约定用法 | 信号 |
|------|---------|------|
| `moon fmt` | 代码格式化 | 提交前必须通过 `--check` |
| `moon ide` | 语义导航：`peek-def` / `outline` / `find-references` | 比 grep 更精确 |
| `moon info` | 更新包的 `.mbti` 接口文件 | **`.mbti` 无变化 = 安全重构**（不带来对外可见变化） |
| `moon test` | 运行测试 | 支持快照测试 |
| `moon test --update` | 刷新快照 | 输出变化影响快照时使用 |
| `moon coverage analyze > uncovered.log` | 查看未覆盖代码 | 覆盖信号（verify E3a） |

约定要点：
- **收尾步骤**：最后一步运行 `moon info && moon fmt`，检查 `.mbti` diff 是否符合预期
- `.mbti` 是包的简要正式接口描述；diff 为空的改动对包外部用户无可见变化
- **探索产物落 scratch/**：实验性代码、一次性验证脚本写入 `.agent-workplace/scratch/`（命名 `{YYYYMMDD}-{type}-{slug}`），不混入正式代码

## 五、测试断言偏好（经验式）

| 场景 | 推荐 | 说明 |
|------|------|------|
| 稳定/极不易变的结果 | `assert_eq` / `assert_true(pattern is Pattern(...))` | 明确断言 |
| 结构化调试输出的快照 | `derive(Debug)` + `debug_inspect` | 快照记录调试输出，**不**用 `Show` |
| 确定性的计算结果 | 断言测试 | 如科学计算 |
| 未覆盖检查 | `moon coverage analyze > uncovered.log` | 定位测试盲区 |

---

## 六、与本仓库的关系

- 本文档是**知识参考**，供技能按需读取（`moonbit-scaffold` 生成骨架、`moonbit-writing-plans` 规划文档布局、`moonbit-testing` 断言策略、`moonbit-verify` 包结构检查时参考）
- **不写死进任何 skill**：用户在项目 `AGENTS.md` 或对话中的明确约定优先于本文档
- 项目若已有自己的结构约定，以项目为准；本文档只作为无特殊要求时的默认基线

---

## 七、Session 恢复机制

> 本节定义跨 Session / Context 压缩时的恢复优先级。

### 恢复优先级（从高到低）

1. **`.agent-workplace/state/checkpoint.json`**（唯一状态源，FST 兼容）
   - 包含：node、phase、status、batch、task_index、framework、project_type、plan_file、tasks 进度
   - 由 `moonbit-writing-plans` 初始化，`moonbit-implement` / `moonbit-verify` / `moonbit-evaluate` / `moonbit-cd` 更新
2. **`.agent-workplace/docs/plan/PLAN.md`**（计划文档）
   - 最后的上下文兜底：从计划文档重建任务列表

### 恢复流程

```
Session 重新初始化
    │
    ├── 检测 .agent-workplace/state/checkpoint.json 存在？
    │   ├── 是 → 读取 checkpoint，恢复到断点位置（node/batch/task_index/phase）
    │   └── 否 → 继续
    │
    ├── 检测 .agent-workplace/docs/plan/PLAN.md 存在？
    │   ├── 是 → 从计划文档重建上下文
    │   └── 否 → 全新开始（无历史状态）
    │
    └── 有 flowstate？
        ├── 是 → 按 FST checkpoint 恢复（fst-iterate 的 checkpoint/resume 机制）
        └── 否 → 按上述 moonbit-skills 自包含恢复
```
