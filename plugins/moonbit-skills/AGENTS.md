# MoonBit Skills — Agent Execution Contract

## 使命

本仓库为 MoonBit 开发提供跨 Agent 平台的技能、参考资料和质量门禁。

- **用户**负责产品目标、架构取舍、公共 API 和发布决策。
- **Agent**负责调查现状、提出有依据的选项、实现获准方案并提供新鲜验证证据。
- 以对话协作为主；开发管线是推荐路径，不是必须完整执行的流水线。

## 指令优先级与权威来源

发生冲突时，按以下顺序执行：

1. 用户在当前对话中的明确要求。
2. 本文件的仓库级约束。
3. 当前任务对应的 `skills/<name>/SKILL.md`。
4. `references/` 中的背景知识和示例。

各文件职责必须保持单一：

| 来源 | 权威范围 |
|---|---|
| `skills/using-moonbit-skills/SKILL.md` | SessionStart 引导入口、初始意图识别和用户意图→技能的完整路由表 |
| `skills/*/SKILL.md` | 对应任务的执行步骤、停止条件、输出契约和恢复策略 |
| `references/orchestration.md` | 完整管线、技能依赖和状态模型 |
| `references/commands.md`、`references/idioms.md`、`references/patterns/` | MoonBit 命令、惯用法和项目类型模式 |
| `hooks/` | 实际自动门禁行为；脚本实现优先于说明性文字 |
| `README.md` | 面向使用者的安装、能力介绍和示例，不定义 Agent 执行规则 |

不要在本文件复制上述文件中的长流程、完整命令表或目录树。需要细节时读取对应权威来源，避免多份说明漂移。

## 请求路由

**路由权威**为 `skills/using-moonbit-skills/SKILL.md` 的「Skill Priority」和「Trigger Matrix」。本文件不维护路由映射表，避免与引导入口漂移。

**路由原则**（契约性约束）：

- 行动前先读取 `skills/using-moonbit-skills/SKILL.md`，按其路由表匹配用户意图到对应技能。
- 若用户直接指定技能，优先使用该技能，跳过路由匹配。
- 若引导入口未列出某个技能或意图，以本文件的「技能职责边界」为准补充判断。
- 推荐的新项目路径：`plan → [Spike (可选)] → writing-plans → scaffold → init → ci → [testing ↔] implement → code-review → [perform ↔ refactor ↔] → verify → evaluate → cd`。
- 注: `↔` 表示双向依赖（含设计回溯，可从 implement/perform/refactor/evaluate 回到 plan）
- **流程框架选择（flowstate 优先）**：
  - **检测规则**（按优先级判定，详见 `skills/using-moonbit-skills/SKILL.md`「流程框架选择」）：
    1. 会话上下文中存在 `FLOWSTATE_BOOTSTRAP:flowstate` 标记 → flowstate 已加载
    2. 技能列表中 `fst-*` / `using-flowstate` 可用 → flowstate 可加载
    3. 项目根 `.agent-workplace/state/checkpoint.json` 含 `"framework": "flowstate"` → 项目已使用 flowstate
    4. 项目根 `.agent-workplace/` 含 `modes/` + `state/` 子目录 → flowstate 结构存在
    5. 以上均无 → 使用 moonbit-skills 自包含管线
  - **有 flowstate 时**：flowstate 驱动流程节点流转 + DoD + HITL + Checkpoint；moonbit-* 技能**降级为 MoonBit 专项执行层**（只提供工具链命令、项目类型模式、验证门禁，不重新定义流程）。**流程层 Iron Law 优先于专项层 Iron Law**。
  - **无 flowstate 时**：本插件自包含完整管线，工作区结构升级为 FST 兼容版（使后续迁移无需重构）。
- **工作区约定（区分插件自身 vs 用户项目）**：
  - **插件自身开发**（本仓库）：`.agent-workplace/` 使用 **flowstate 完整版**（modes/ 实践库 + state/ checkpoint + docs/spec/），由 flowstate 流程框架驱动——本仓库开发遵循 flowstate 规范。
  - **用户 MoonBit 项目**（使用本技能的目标项目）：`.agent-workplace/` 从 `templates/agent-workplace/` 复制初始化（FST 兼容版，目录结构详见模板 `README.md`）；由 `moonbit-writing-plans` / `moonbit-implement` 维护，**不依赖 flowstate 插件本身**。
  - 两者都**不直接放项目原始 `docs/`**，过程态一律进 `.agent-workplace/`（git 忽略）。详见 `references/project-contract.md` §二。
- 允许按上下文跳过不适用阶段：已有项目通常跳过 `scaffold`、`init`、`ci`；设计已经获批可从 `writing-plans` 或 `implement` 开始；不发布则跳过 `evaluate`。
- 不得跳过当前技能定义的门禁。验证体系分为三级：基础测试（B，所有项目必选）、Custom 测试（C，按类型选择）、增强测试（E，推荐非阻断）。详见 `references/orchestration.md` 的三级检测体系。

## 技能职责边界

以下为契约性职责划分，用于路由歧义时消歧，不重复具体触发条件：

| 技能 | 职责边界 | 不可越权 |
|---|---|---|
| `moonbit-init` | 项目接入评估（状态检测 + 能力矩阵）+ .agent-workplace/ 初始化 + 质量门禁配置 | 不负责项目内容生成、不负责架构设计 |
| `moonbit-ci` | CI 基础设施构建（GitHub Actions + hooks 增强 + 分支保护） | 不替代 verify 运行门禁；不负责部署执行（归 cd） |
| `moonbit-cd`（新增） | 部署策略、制品管理、回滚预案、发布渠道 | 不替代 verify 门禁；不判定"可发布"（归 evaluate） |
| `moonbit-docs`（新增） | API 文档、README、CHANGELOG、用户指南、ADR 维护 | 不做发布前预览校验（归 evaluate） |
| `moonbit-security`（新增） | 威胁建模、依赖漏洞扫描、安全设计审查 | 不替代 verify E2 最终审计门禁 |
| `moonbit-plan` | 需求澄清（目标/场景/客户/边界/维护五问）、架构和 API 设计决策；宏观设计 + 模块划分 + 规则承载 + 可维护性设计 | 不写实现代码 |
| `moonbit-writing-plans` | 设计→可执行任务拆解（分阶段 Phase、分步骤、任务粒度约束、维护 Phase） | 不写实现代码 |
| `moonbit-scaffold` | 按已批准设计动态生成项目骨架（按模块组织目录） | 不依赖预置模板，不覆盖用户文件 |
| `moonbit-testing` | 测试设计、组织、写法、迭代；测试时机决策（先行 vs 后补） | 不写实现代码，不运行门禁判定，不接管 implement 的 TDD Red 阶段执行 |
| `moonbit-perform` | 性能测量、瓶颈分析、优化实现 | 不改变功能行为，不替代 verify 门禁 |
| `moonbit-refactor` | 技术债务识别、小步重构、回归验证 | 不改变可观察行为，不替代 testing 测试设计 |
| `moonbit-implement` | Feature TDD + Bug Fix Mode 双模式实现；模块化小步实现 | 无失败测试/无 regression test 不写实现代码；目标过大回 writing-plans 拆分 |
| `moonbit-task` | 单一任务实现：测试前置 TDD（RED→GREEN→VERIFY）+ 逐项验收交付 | 不写实现代码前无失败测试；不替代 verify 门禁；验收项未逐项确认不声称完成 |
| `moonbit-git` | 功能分支工作流、提交契约、合并、worktree 并行管理 | 不在主分支直接修改；提交遵循授权契约；worktree 必须获用户同意 |
| `moonbit-code-review` | 任务间代码审查（任务/模块粒度 + 验收项↔测试对应） | 不发布、不声称完成 |
| `moonbit-verify` | 三级验证门禁（基础/Custom/增强）+ 按模块/任务验证子集 | 不声称完成除非有新鲜证据 |
| `moonbit-evaluate`（扩展） | 验收评估（任务级验收清单汇总）+ 发布准备 + changelog/release notes/回退预案 | 不跳过 verify，不替用户决定版本号，不执行部署（归 cd） |
| `moonbit-learn` | 从已定位问题中沉淀知识 + 生产事故 RCA | NO MEMORY WITHOUT ROOT CAUSE：未确认根因不写入，不重复创建 |

## 仓库工作规则

### 动手前

1. 识别任务意图和项目类型，读取相关技能与必要的参考文件。
2. 调查现有实现、调用点、测试和约定；禁止凭猜测创建第二套模式。
3. 架构、公共 API 或范围存在实质性取舍时，向用户展示选项、影响和推荐方案，由用户决定。
4. 只计划完成请求所必需的变更；不顺手扩展范围。

### 实施时

- 优先修改现有文件；仅在职责明确且现有结构无法承载时新增文件。
- `moonbit-scaffold` 必须按已批准设计动态生成文件，不依赖预置模板，不覆盖未获准的用户文件。
- 功能、修复和重构遵循 `moonbit-implement` 的 TDD 与 Iron Law；测试必须覆盖可观察行为。
- 每个实现任务后执行 `moonbit-code-review`；Critical 和 Important 问题必须在继续前处理或由用户明确接受。
- 失败时保留真实命令和错误证据，按对应技能的有界恢复策略重试；不得伪造通过、降级为空实现或用占位符交付。
- 将意外改动视为用户工作。不要覆盖、回滚或删除来源不明的改动；先缩小自己的修改范围。
- **适用对象说明（重要）**：本仓库是 **MoonBit 技能仓库**，文中的「用户」「目标项目」「项目」均指**使用本技能的用户及其实际 MoonBit 项目**。所有关于 Git 提交契约、一次性授权、任务验收的约定，都从用户角度出发，用于优化**目标项目的开发流程**；本技能仓库自身不设独立流程，其开发同样遵循这些契约（本仓库自身即一个目标项目实例，见下方实例授权）。
- **任务验收后的 Git 提交契约（适用于使用本技能的目标项目）**：目标项目为 git 仓库时，每个任务验收通过后按 `moonbit-git` 一次性授权协议执行——检测**目标项目** AGENTS.md 的授权记录：已有 → 自动执行「建功能分支 → 提交（单次提交只含一个 Task 产物，遵循 Conventional Commits）→ 合并回主分支 → 删除分支」；无 → 询问一次并写入授权记录后自动执行；用户明确要求不自动提交/不合并时例外。非 git 仓库只展示变更，不执行 git 命令。详见 `moonbit-git` 的「一次性授权协议」。
- **本仓库实例授权（用户已批准，2026-08-02）**：本技能仓库作为目标项目实例，用户已明确授权 Agent 自动执行 git 提交与合并（每任务验收后：建功能分支 → 提交 → 合并回主分支 → 删除分支），**后续会话无需再逐次询问**；仅当用户在本对话中明确说"不要自动提交/不要合并"时才例外。
- **多任务批次上限**：连续执行任务每批最多 5 个，之后停止汇报并进入提交检查点（每任务验收后已自动提交合并，压缩会话/开始新上下文再继续）；平台不支持会话压缩时批次上限收紧为 ≤3。批次边界由 `moonbit-writing-plans` 规划、`moonbit-implement` 执行、`moonbit-git` 提交检查点衔接。

### 完成前

- 运行覆盖实际变更路径的验证，不以“看起来正确”代替执行证据。
- 只报告本轮实际运行的命令、结果和未验证风险；陈旧结果不能支撑完成声明。
- 更新所有受影响的调用点、测试、技能说明和平台元数据；无影响的文件保持不动。
- 基础测试（B）或 Custom 测试（C）失败时状态必须为 blocked，给出根因、已尝试措施和安全的下一步，不能声称完成。

## 验证契约

MoonBit 项目的完整门禁以 `skills/verify/SKILL.md` 为唯一权威，按三级体系执行：基础测试（B，所有项目必选）、Custom 测试（C，按类型选择）、增强测试（E，推荐非阻断）：

| 范围 | 必需证据 |
|---|---|
| 所有 MoonBit 项目 | 格式、类型检查、测试、工作区状态（B1-B4） |
| main / CLI | B1-B4 + C1/C2：`moon run` 成功且输出非空 |
| library | B1-B4 + C1/C3：包结构与临时 consumer 编译验证 |
| ffi / wasm / parser / async | B1-B4 + C3：对应 `references/patterns/` 和技能定义的类型专属验证 |

Hooks 只提供自动化子集，不能替代完整验证；各平台事件能力不同：

- `hooks/pre-commit.sh`：安全扫描 + 格式化 + 接口同步 + 类型检查（由支持 Git hooks 的环境执行）。
- `hooks/commit-msg.sh`：Conventional Commits 校验（由支持 Git hooks 的环境执行）。
- `hooks/pre-push.sh`：编译检查 + 全量测试（由支持 Git hooks 的环境执行）。
- `hooks/pre-completion.sh`：会话完成前的自动检查（仅接入该事件的平台执行）。
- Codex/Cursor/Gemini 的默认集成目前以 PostTool/afterFileEdit 轻量检查为主，不宣称具备完整 PreCompletion 门禁。

修改本技能仓库自身时，按变更范围执行针对性验证：

- 插件描述或版本字段：`python scripts/check-plugin-metadata.py`。
- JSON 文件：使用解析器验证语法。
- Shell hooks：执行对应脚本或静态语法检查。
- 技能或路由：运行 `evals/evals.json` 中相关场景可用的评估工具；若环境没有评估运行器，必须明确标记未运行。
- 纯 Markdown：检查标题层级、链接/路径、命令和跨文件事实；不得声称通过未运行的代码测试。

## 维护不变量

- `skills/using-moonbit-skills/SKILL.md` 是引导入口；支持 SessionStart hooks 的平台通过 `hooks/session-start` 注入，其他平台由各自的插件注册或指令机制加载。
- `skills/` 当前包含 18 个核心技能 + 1 个引导入口（`using-moonbit-skills`）；新增、删除或重命名技能时同步路由、README、评估和平台注册信息。
- `references/` 是按需读取的知识库，不是可直接执行的技能。
- `references/error-codes.json` 由 `moonbit-learn` 维护；写入前必须确认根因并去重。
- 行为约束型技能必须保留明确的 Iron Law、Red Flags、停止条件和错误恢复契约。
- 安装与集成界面覆盖 AtomCode、Claude Code、Codex CLI / App、Cursor、Kimi Code、OpenCode、Pi 和 Gemini CLI；各平台的自动注入能力不同，修改共享元数据时保持对应描述文件一致。
- 文档中的流程和检查编号只在其权威文件维护；其他文件使用引用和语义名称，不复制易漂移清单。
