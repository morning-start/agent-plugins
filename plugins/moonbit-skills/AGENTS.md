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
- 推荐的新项目路径：`plan → [Spike (可选)] → scaffold → ci → [testing ↔] verify`。
- 注: `↔` 表示双向依赖（含设计回溯，可从实现/测试/验证阶段回到 plan）
- **能力边界**：moonbit-skills 是 **MoonBit 专属**能力插件，聚焦设计、骨架生成、测试设计、验证、CI 五类，**不承载**通用开发流程（实现、任务拆解、代码审查、发布、部署、性能、重构、git 操作、文档、安全、学习、接入初始化）。实现类流程由用户或外部流程插件（如 flowstate/fst）承担。详见 `skills/using-moonbit-skills/SKILL.md`「能力边界」。
- `moonbit-*` 技能可在任何阶段被外部流程插件调用，与 fst 等插件可协同使用，本插件不与其冲突、不接管其管线状态。
- 允许按上下文跳过不适用阶段：已有项目通常跳过 `scaffold`；设计已获批可从 `scaffold` 开始；不需要 CI 则跳过 `moonbit-ci`。
- 不得跳过当前技能定义的门禁。验证体系分为三级：基础测试（B，所有项目必选）、Custom 测试（C，按类型选择）、增强测试（E，推荐非阻断）。详见 `references/orchestration.md` 的三级检测体系。

## 技能职责边界

以下为契约性职责划分，用于路由歧义时消歧，不重复具体触发条件：

| 技能 | 职责边界 | 不可越权 |
|---|---|---|
| `moonbit-plan` | 需求澄清（目标/场景/客户/边界/维护五问）、架构和 API 设计决策；宏观设计 + 模块划分 + 规则承载 + 可维护性设计 | 不写实现代码 |
| `moonbit-scaffold` | 按已批准设计动态生成项目骨架（按模块组织目录） | 不依赖预置模板，不覆盖用户文件 |
| `moonbit-testing` | 测试设计、组织、写法、迭代；测试时机决策（先行 vs 后补） | 不写实现代码，不运行门禁判定 |
| `moonbit-verify` | 三级验证门禁（基础/Custom/增强）+ 按模块/任务验证子集 | 不声称完成除非有新鲜证据 |
| `moonbit-ci` | CI 基础设施构建（GitHub Actions + 本地 hooks + 分支保护） | 不替代 verify 运行门禁；不负责部署执行 |

> 通用开发流程（实现、任务拆解、代码审查、发布、部署、性能、重构、git、文档、安全、学习、接入初始化）**不属于**本插件，交由用户或外部流程插件承担。

## 仓库工作规则

### 动手前

1. 识别任务意图和项目类型，读取相关技能与必要的参考文件。
2. 调查现有实现、调用点、测试和约定；禁止凭猜测创建第二套模式。
3. 架构、公共 API 或范围存在实质性取舍时，向用户展示选项、影响和推荐方案，由用户决定。
4. 只计划完成请求所必需的变更；不顺手扩展范围。

### 实施时

- 优先修改现有文件；仅在职责明确且现有结构无法承载时新增文件。
- `moonbit-scaffold` 必须按已批准设计动态生成文件，不依赖预置模板，不覆盖未获准的用户文件。
- 本插件不承载实现类流程；功能、修复和重构的编码由用户或外部流程插件执行，测试必须覆盖可观察行为。
- 引导入口按 `moonbit-plan` / `moonbit-scaffold` / `moonbit-testing` / `moonbit-verify` / `moonbit-ci` 的约定执行；关键取舍在继续前由用户明确确认。
- 失败时保留真实命令和错误证据，按对应技能的有界恢复策略重试；不得伪造通过、降级为空实现或用占位符交付。
- 将意外改动视为用户工作。不要覆盖、回滚或删除来源不明的改动；先缩小自己的修改范围。
- **本仓库实例 Git 约定（用户已批准，2026-08-02）**：本技能仓库自身作为 git 仓库，用户已明确授权 Agent 自动执行 git 提交与合并（每完成一个原子改动：建功能分支 → 提交（遵循 Conventional Commits）→ 合并回主分支 → 删除分支），**后续会话无需再逐次询问**；仅当用户在本对话中明确说"不要自动提交/不要合并"时才例外。本插件不提供 `moonbit-git` 技能，此约定为仓库级工作规则，直接执行 git 命令。

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
- `skills/` 当前包含 5 个核心技能 + 1 个引导入口（`using-moonbit-skills`）：`plan`、`scaffold`、`testing`、`verify`、`moonbit-ci`；新增、删除或重命名技能时同步路由、README、评估和平台注册信息。
- `references/` 是按需读取的知识库，不是可直接执行的技能。
- 行为约束型技能必须保留明确的 Iron Law、Red Flags、停止条件和错误恢复契约。
- 安装与集成界面覆盖 AtomCode、Claude Code、Codex CLI / App、Cursor、Kimi Code、OpenCode、Pi 和 Gemini CLI；各平台的自动注入能力不同，修改共享元数据时保持对应描述文件一致。
- 文档中的流程和检查编号只在其权威文件维护；其他文件使用引用和语义名称，不复制易漂移清单。
