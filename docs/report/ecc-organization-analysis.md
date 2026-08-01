# ECC 组织编排分析 —— 插件职责边界与组织形式

> 分析日期 2026-08-02 · 基于两轮并行测绘（技能体系 + 组织机制）+ 主 agent 复核
> 目标：回答 ①ECC 如何组织编排庞大能力 ②什么样的组织形式更好 ③插件职责边界标准

---

## 1. ECC 的组织编排事实（吸收）

### 1.1 分层结构（解决"分发"，不解决"职责"）

- **权威源**：顶层 `skills/`（281 全量技能库）。
- **按端裁剪**：`.agents/skills`（39）、`.cursor/skills`（11）、`.kiro/skills`（43）、
  `.opencode`（36 commands、无 skills）、`.codex`（agents/*.toml）——同一内容多份副本。
- **分类索引**：`manifests/install-modules.json` 把技能分成 15+ 模块
  （framework-language / database / workflow-quality / security / research-apis /
  business-content / operator-workflows / social-distribution / media-generation /
  machine-learning / devops-infra / agentic-patterns …）。
- **安装档位**：`install-profiles.json` → `minimal`（无 hooks 运行时）/ `core`
  （+hooks）/ `developer`（+语言框架/数据库）/ `security` / `research` / `full`；
  `./install.sh --profile <档> --target <harness>`，组件级 `--skills a,b`。
- **运行时严格度**：`ECC_HOOK_PROFILE=minimal|standard|strict` + `ECC_DISABLED_HOOKS`
  逐条禁用（我们 hooks 渲染可直接吸收此档位模式）。
- **agents 专业化**：`.kiro/agents` 33 个——architect / planner / code-reviewer /
  security-reviewer / build-error-resolver / tdd-guide / database-reviewer /
  mle-reviewer / e2e-runner / 语言族 reviewer×8（go/rust/kotlin/java/cpp/swift/python/
  react）。
- **instinct 机制**：`continuous-learning-v2`——从真实会话经 hook 观察学到"原子行为
  模式"（置信度评分、`~/.claude/homunculus/` 存储、`/evolve` 聚类升级为 skills）。

### 1.2 功能分类跨度（39 技能粗分类）

| 类别 | 数量 | 代表 |
|------|------|------|
| 开发方法论/工程流程 | 13 | tdd-workflow、verification-loop、api-design、plan-canvas |
| 技术栈/架构模式 | 8 | backend-patterns、mcp-server-patterns、nextjs-turbopack |
| 研究/情报分析 | 7 | deep-research、market-research、competitive-platform-analysis |
| 内容创作/社媒 | 7 | article-writing、brand-discovery、crosspost、video-editing |
| 商务/投资者 | 2 | investor-materials、investor-outreach |
| 平台/API 工具 | 2 | x-api、fal-ai-media |

**跨 6 个不相关领域**——这是"能力边界缺失"的直接证据。

### 1.3 命名与内部组织

- 小写 kebab-case、2~3 词、无统一前缀；有词缀簇（`-patterns`、`-workflow`、
  `competitive-*`、`brand-*`、`investor-*`）；产品名直接入名（bun、nextjs、exa）。
- 技能内部：frontmatter + "When to Activate" 清单 → 检查表 → "Related Skills" 互链；
  **无 scripts/ 目录**（多为纯指令技能）；skills 目录扁平无分组，分类靠
  install-modules.json 与文档表格。

## 2. 判断：能力边界 / 职责划分 / 组织形式

### 2.1 能力边界：ECC 没有边界，只有分层治理

281 技能横跨方法论/技术栈/研究/内容/商务/媒体——README 自封 **"the agent harness
operating system"**。它的治理术（install modules + profiles + 按端裁剪）解决的是
"**分发与选择**"，不是"**职责边界**"：用户依然无法一句话说清这个插件做什么。

### 2.2 职责划分：按"资产类型"分，不按"场景"分

- **可学**：五类资产分工（Agents / Skills / Hooks / Rules / Instincts）清晰；
  agents 按语言/主题专业化；hooks 有档位与禁用列表。
- **问题**：install-modules 的模块是"内容目录"而非"场景归属"——同一用户场景被拆散在
  多个模块，多个不相关场景又挤在同一个插件里。

### 2.3 组织形式对比

| | ECC | superpowers | 理想（plugin-factory 模型） |
|---|---|---|---|
| 场景数 | 多场景聚合 | 单场景（开发方法论） | **一个插件 = 一个固定场景** |
| 技能数 | 281 | 14 | 场景驱动（5–20 量级） |
| 组织 | 分层权威源 + 分档选择 | 扁平 + 链式编排 | 场景内技能 + 编排链 |
| 发散治理 | install profiles 掩盖 | 写作纪律 | **职责边界门禁（创建时强制）** |

## 3. 插件职责边界标准（草案）

### 3.1 定义

- **Skill**：一项清晰的**原子任务**——单能力、CSO 一句话可描述、边界明确。
- **Plugin**：**一个固定业务场景**下的一整套任务——场景内完整流程、单一入口
  （`using-<plugin>`）、一个用户目标（如"Moonbit 项目开发"）。
- **禁止**：多场景聚合（ECC 反例）——用户无法理解插件做什么。

### 3.2 发散度检查（6 维，创建与新增技能时强制）

| # | 维度 | 判定 | 发散信号 |
|---|------|------|----------|
| D1 | 场景单一性 | 插件能否一句话说清"服务于什么场景" | 说不清 / 需要多句 → 发散 |
| D2 | 用户目标一致性 | 所有技能是否服务同一用户目标 | 技能间无共享触发上下文 → 发散 |
| D3 | 主题收敛 | 技能是否围绕同一主题域 | 跨多个不相关主题词 → 发散 |
| D4 | 功能分类跨度 | 技能横跨几个不相关功能类别 | ≥3 类不相关（方法论/内容/商务/媒体…）→ 发散 |
| D5 | 场景归属 | 每个技能能否回答"属于本插件场景吗" | 答不上 → 拆到另一插件 |
| D6 | 入口覆盖 | 单一入口能否路由全部技能 | 需要多入口 / 多场景 → 拆 |

### 3.3 规则

1. 新增技能必须通过 D1–D6；D5 失败 → **拒绝并建议另开插件**。
2. pf-intent 复杂度门禁增加"**场景发散度**"信号：跨场景意图 → 建议拆成多个插件
   （各自独立走 S1 创建）。
3. 规模参考：方法论插件 5–20 技能（superpowers 14）；>30 且跨类别 → 强提示拆分。
4. 共享内容与插件分离：插件 = 场景专属技能集；通用技能/参考库独立成层
   （plugin-factory 的 `references/` 模型）——可共享，但不并入任何单一插件。

## 4. 对 plugin-factory 的落地

| 落点 | 内容 |
|------|------|
| `references/design-principles.md` | 新增铁律：**职责边界**（skill=单任务、plugin=固定场景整套流程、6 维发散检查） |
| `skills/pf-intent/SKILL.md` | 复杂度门禁增加场景发散度信号（D5/D6）；跨场景建议拆插件 |
| `references/plugin-model.md` | "一个插件 = 一个固定场景"写入模型定义 |
