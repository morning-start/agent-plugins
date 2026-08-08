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

| 路径 | 用途 | 规则 |
|------|------|------|
| `.agent-workplace/docs/plan/` | **计划文档**（路线图式规划） | 开发前先写计划：计划 → 阶段(Phase) → 批次(Batch) → 任务(Task)；长期方向与任务拆解分层，避免混入 |
| `.agent-workplace/docs/task/` | **任务拆解文档**（分阶段实现计划） | 任务拆解放这里，与计划分离；含验证命令 |
| `.agent-workplace/scripts/` | **脚本尝试** | 探索性/实验性脚本，验证"怎么做才对"，不提交 |
| `.moonbit-pipeline.json` | 管线状态（当前阶段、计划文件指针、任务进度） | 用作**会话检查点** |
| `docs/requirements.md` | 需求文档（设计决策的权威来源） | plan 阶段产出 |

> **为什么放 `.agent-workplace/`**：计划/任务/脚本是**过程态**，高频变动、不提交 git；
> 直接放项目原始 `docs/` 会污染提交历史。`.agent-workplace/` 全目录被 gitignore
> （无 flowstate 时为简化版：docs/plan + docs/task + scripts；安装 flowstate 后升级完整版）。

约定要点：
- **路线图与任务拆解分层**：`.agent-workplace/docs/plan/` 管方向，`.agent-workplace/docs/task/` 管执行
- 会话开始时按序读取：`.agent-workplace/docs/plan/` → `.agent-workplace/docs/task/` → `.moonbit-pipeline.json`，恢复上下文
- `.moonbit-pipeline.json` 是跨会话的进度锚点（writing-plans 初始化，implement/verify/evaluate 更新）

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
