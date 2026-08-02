# plugin-factory（插件工厂）

一个**元插件**：引导你的编程 Agent 仅凭你的**核心功能、目标、场景**，创建出**全新的、独立的 Agent 插件项目**。

> English version: [README.md](README.md)

你只需告诉 Agent"这个插件要做什么"，剩下的由 plugin-factory 按软件开发流程驱动：
**意图访谈 → PRD → 设计 → 构建（每个 skill 委托给 Anthropic 官方 skill-creator）→ 验证 → 发布 → 生命周期分析**（拆分 / 合并 / 重组 / 移植 / 退役）。

## 支持的平台

| 平台 | 安装方式 | 技能位置 |
|------|----------|----------|
| Claude Code | `/plugin install plugin-factory@<marketplace>` 或本地插件 | 插件内 `skills/` |
| pi | `pi install git:github.com/<you>/plugin-factory` | 包内 `skills/`（package.json 的 `pi.skills`） |
| oh-my-pi (omp) | `omp plugin install git:github.com/<you>/plugin-factory` | 包内 `skills/`（`omp`/`pi` 字段） |
| opencode | 按 `.opencode/INSTALL.md` | `.opencode/skills/`（scaffold 自动复制，无需手工拷贝） |

四个平台均由自举冒烟测试（`npm run smoke`）验证；一个平台只有在 manifest、
引导、技能发现路径与冒烟检查齐备时才被声明支持（T1 契约）。

## 快速开始

1. 按上表为你的平台安装 plugin-factory。
2. 运行 `/pf-new`（Claude Code），或直接让 Agent 创建插件。
3. 回答意图访谈：核心功能、可衡量的目标、3–5 个典型场景、使用人群/触发方式、边界与非目标。
4. 确认一页式 PRD；Agent 自主推进设计 → 构建 → 验证 → 发布。
5. 产出**独立的插件项目**（独立目录/仓库，双语 README、各平台 manifest、多 shell 的 hooks 与 commands）。

## 工作流程

| 阶段 | 技能 / 命令 | 产物 |
|------|-------------|------|
| 1. 意图 | `pf-intent` | 一页式 PRD + 复杂度判定（轻量→直通，中/重型→完整流程） |
| 2. 设计 | `pf-design` | 构件清单 + 各平台 manifest 规格 |
| 3. 构建 | `pf-build` | 独立插件项目；skill 走 skill-creator 的 TDD 评测循环 |
| 4. 验证 | `pf-verify` | 结构与合规审计 |
| 5. 发布 | `/pf-release` | SemVer、CHANGELOG、双语 README、安装脚本 |
| 6. 生命周期 | `pf-lifecycle` | 纯结构分析 → 拆分/合并/重组/移植/退役建议 |

## 仓库结构

```
plugin-factory/
├── .claude-plugin/plugin.json    # Claude Code 插件清单
├── .pi/extensions/               # pi 引导扩展
├── .opencode/                    # opencode 配置 + INSTALL.md
├── skills/                       # pf-* 工作流子技能
├── commands/                     # /pf-* 斜杠命令
├── hooks/                        # 会话启动引导（多 shell）
├── references/                   # 设计文档：适配器、插件模型、生命周期矩阵
├── scripts/                      # 校验/审计/脚手架（bash + PowerShell）
├── templates/                    # 生成插件项目的模板
├── docs/                         # ADR + 术语表
└── tests/                        # 基础设施测试
```

## 路线图

- **M0** — 插件骨架、三平台 manifest、`pf-intent`、references ✅
- **M1** — 全流程编排，先出 Claude Code 端，双 shell 脚手架脚本
- **M2** — pi + opencode 适配器、多 shell hooks/commands 渲染、独立项目生成完善
- **M3** — 生命周期分析引擎（纯结构）+ 决策矩阵 + 审计升级
- **M4** — dogfood：用 plugin-factory 自己生成一个示例插件；测试与文档完善

## 安全发布流程

发布准备与**发布动作分离**（见 `/pf-release`）：

1. `npm run verify` — 必须退出码 0（无 `FAIL` finding）。
2. `npm run release:check -- --json` — 发布门禁：版本同步、版本审计、可执行
   验证器、当前版本的 CHANGELOG 证据、已宣称 harness 的 manifest、以及
   **干净的工作树**。任何违规都以稳定 `signal` 失败（`version-drift`、
   `missing-changelog-entry`、`dirty-worktree`、`missing-harness-artifact`、
   `verification-failed`）。
3. `scripts/bump-version.sh <X.Y.Z>`（或 `.ps1`）— 按 `.version-bump.json`
   同步所有声明的 manifest；不要手工改版本。
4. 更新 CHANGELOG 与双语 README，复核 diff。
5. **显式**打标签（`git tag v<版本>`）并仅在用户要求分发时推送——门禁本身
   从不打标签或推送。

## 验证

`npm run validate` 与 `npm run validate:ps` 调用同一个 Node 验证器
（`scripts/verify.mjs`）；`npm test` 运行全部契约测试。

## 许可证

MIT
