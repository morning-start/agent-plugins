# 插件模型（通用插件模型）

一个抽象模型描述所有 agent 插件；各端适配器把它映射为具体位置与格式。
技能按 Agent Skills 标准编写一次、按端渲染——逐端映射见 `agent-adapters.md`。

## 组件

| 组件 | 是什么 | 规范形式 | 各端说明 |
|-----------|------------|----------------|---------------|
| **skills** | 能力包：`SKILL.md` + 附属文件 | 每技能一目录，根部 `skills/` | Claude Code 插件 `skills/`、pi 包 `skills/`、opencode `.opencode/skills/` |
| **hooks** | 生命周期脚本（会话启动、工具调用、完成…） | `hooks/*.sh` + `hooks/*.ps1` + `hooks/hooks.json` | 各端事件模型不同（按端核实） |
| **commands** | 斜杠命令 / 快捷方式 | `commands/*.md`（frontmatter description） | Claude Code `commands/`、opencode `.opencode/command/`、pi `/skill:` 强制调用 |
| **agents / subagents** | 专用系统提示词的子代理 | `agents/*.md` | Claude Code `agents/`；他端可选 |
| **rules** | 持久行为约束 | `rules/*.md` | Claude Code `rules/`；他端用 AGENTS.md |
| **references** | 共享设计/规格文档 | `references/*.md` | — |
| **scripts** | 校验器、生成器、辅助脚本 | bash + PowerShell 成对 | 多 shell 要求 |
| **tests / evals** | 基础设施与行为测试 | `tests/`、`evals/` | — |
| **manifests** | 各端元数据 | `.claude-plugin/plugin.json`、`package.json`（`pi.skills`）、`.opencode/opencode.json` | — |
| **orchestration** | 入口点 / 触发链 / 交接产物 / 冲突（构件清单一等字段）；方法论插件的引导技能 | 构件清单的 `orchestration` 段 | 渲染进每个技能的 "next steps" + `using-<plugin>` 引导技能 |

## 插件必须包含的内容（发布门禁）

1. 至少一个技能（每个经 skill-creator 评测）——或有书面理由。
2. 每个对外宣称的端都有对应 manifest。
3. hooks（若有）须有 bash 与 PowerShell 双实现。
4. `AGENTS.md`（+ `CLAUDE.md`）项目说明。
5. 双语 README：`README.md` + `README.zh-CN.md`。
6. 安装说明（`install.sh` / `install.ps1` 或各端文档）。
7. 方法论插件：引导/入口技能（`using-<plugin>`）+ 编排元数据
   （`references/orchestration-patterns.md`）。

## 生成插件布局（模板）

```
<plugin-name>/
├── .claude-plugin/plugin.json
├── .pi/extensions/<plugin-name>.ts      # pi/omp 引导（M2）
├── .opencode/opencode.json + INSTALL.md # opencode（M2）
├── skills/<skill-name>/SKILL.md         # 经 skill-creator 创建
├── commands/                            # /<prefix>-* 命令
├── hooks/                               # 多 shell
├── rules/ or references/
├── scripts/  tests/  docs/
├── AGENTS.md  CLAUDE.md
├── README.md  README.zh-CN.md
└── install.sh  install.ps1
```

命名：目录与 `name` 用 `<项目前缀>-<短名>`（如 `pf-intent`、`moonbit-verify`）。
前缀防止共享技能目录中的命名冲突。
