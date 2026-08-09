# Plugin Creators — 官方工具清单（调用 vs 吸收）

> **Captured: 2026-08-01** · 盘点官方/生态的"插件创建"工具，评估 plugin-factory
> 是**调用**（build 阶段委托执行）还是**吸收**（借鉴其模式/规范）。
> Sources pinned; re-verify on breaking changes only.

## 清单与建议

| 工具 | 出处 | 覆盖能力 | 建议 | 理由 |
|------|------|----------|------|------|
| **skill-creator** | https://skills.sh/anthropics/skills/skill-creator · https://claude.com/plugins/skill-creator（Anthropic） | skill 全生命周期：意图→草稿→测试用例→A/B 评测→迭代 | **调用** | 已是 plugin-factory 铁律 #2：skill 创建/评测全部委托它；**安装由用户自行执行**（`anthropics/skills@skill-creator`，缺失时只提醒、不自动安装） |
| **Plugin Developer Toolkit** | https://claude.com/plugins/plugin-dev（Anthropic 官方插件） | 7 个专家技能：hooks（9 种事件）、MCP（stdio/SSE/HTTP/WS）、插件结构与 settings、slash 命令、agents、skill 编写；`/plugin-dev:create-plugin` 八阶段引导（discovery→planning→design→implementation→validation→testing→documentation）；12+ 示例、6 个校验脚本 | **吸收** | Claude Code 端的"插件创建器"；pf-build 的 Claude 适配器借鉴其八阶段与校验思路；校验脚本可对照我们的 validate 脚本。若用户环境已装，也可在 build 阶段**调用**其 create-plugin 命令 |
| **Claude Code Setup** | https://claude.com/plugins/claude-code-setup（Anthropic 官方插件） | 分析代码库并推荐 hooks/skills/MCP/agents 自动化 | 吸收（可选项） | 与 pf-intent 的"复杂度信号"思路重叠；不直接创建插件 |
| **Hookify** | https://claude.com/plugins/hookify（Anthropic 官方插件） | 用 markdown 描述生成自定义 hooks，防止不良行为 | 吸收 | hooks 生成的另一种范式（描述→钩子）；对照我们的"多 shell 渲染" |
| **pi 自建扩展** | https://pi.dev/docs/latest/extensions | "pi can create extensions — ask it to build one" | 吸收 | pi 端没有独立 creator 工具；由 agent 直接按固化规格（hooks/pi.md）生成 `.pi/extensions/*.ts` |
| **opencode 插件体系** | https://opencode.ai/docs/plugins/ | TS 插件 + 事件系统（无独立 creator CLI 可确认） | 吸收 | 由 agent 按 hooks/opencode.md 直接生成 `.opencode/plugins/*.ts` |
| **oh-my-pi (omp)** | https://omp.sh · https://github.com/can1357/oh-my-pi（Pi 的 fork） | 自带插件管理器（`omp plugin install git:/npm:`）；官方说法 "Ask omp to write the piece you're missing" | 吸收 | 无独立 creator CLI；agent 按 plugins/oh-my-pi.md 固化规格直接生成；omp 本身可协助生成扩展 |

| **Codex / ChatGPT plugin-creator** | ChatGPT Work 内置 `@plugin-creator`、Codex 内置 `$plugin-creator`（生成 `.codex-plugin/plugin.json` + 组织插件目录 + 可选本地市场条目） | 插件清单 + skills + MCP + 本地市场测试 | **吸收** | Codex 端的官方脚手架：scaffold 的 codex harness 参照其生成形状（`.codex-plugin/plugin.json`）；本地市场测试流程与 pf-verify 的 codex 检查互补（见 `plugins/codex.md`） |

## 决策规则（固化）

1. **skill 层 → 调用 skill-creator**（唯一创建路径，铁律 #2）。
2. **Claude Code 插件层 → 吸收 Plugin Developer Toolkit**：pf-build 的 Claude 适配器
   参照其八阶段引导与校验脚本；如用户环境已安装该插件，build 阶段可调用
   `/plugin-dev:create-plugin` 生成骨架后由 plugin-factory 接管多端渲染。
3. **opencode / pi / oh-my-pi 插件层 → 按固化规格直接生成**（无官方 creator 工具）。
4. 任何"调用"动作都必须与"吸收"的规格一致——**不许出现第三方工具输出与
   references/ 固化规格冲突**；冲突时以 references/ 为准并触发复核。
5. **skill-creator 安装由用户负责**：缺失时提醒用户自行安装
   （`anthropics/skills@skill-creator`），agent/插件未经允许不得自动安装。

## 待办（网络受限未完成，2026-08-01）

- ⚠️ 确认是否存在其他官方 plugin-creator（如 opencode 专用 CLI、Codex plugin creator）——
  网络恢复后补充检索并更新本清单。
