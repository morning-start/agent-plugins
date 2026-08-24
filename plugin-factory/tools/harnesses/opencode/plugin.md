# opencode plugin 格式 — 规格固化

> **固化于：2026-08-01** · 来源：
> - 文档(EN): https://opencode.ai/docs/plugins/ · 文档(zh-CN): https://opencode.ai/docs/zh-cn/plugins/
> - 生态/市场: https://opencode.ai/docs/ecosystem (社区插件目录)
>   （注：omp.sh 是 **oh-my-pi** 而非 opencode 的市场 — 见 plugins/oh-my-pi.md）
> **复核**：仅当插件格式破坏性变更时复核。不要预先重搜。

## 模型

- opencode 插件是 **JavaScript/TypeScript 模块**——**没有 plugin.json manifest**。
- 插件模块导出一个或多个**插件函数**；每个函数接收上下文对象、返回 **hooks 对象**
  （事件键见 `hooks/opencode.md`）。
- npm 插件由 Bun 启动时自动安装（缓存 `~/.cache/opencode/node_modules/`）。

## 位置与加载顺序

| 来源 | 范围 |
|--------|-------|
| `~/.config/opencode/opencode.json` | 全局配置（最先） |
| `opencode.json` | 项目配置 |
| `~/.config/opencode/plugins/` | 全局插件目录 |
| `.opencode/plugins/` | 项目插件目录（最后） |

- npm：`opencode.json` 中 `"plugin": ["opencode-helicone-session", ...]`。
- 本地插件 npm 依赖：加 `.opencode/package.json`（Bun 启动时安装）。
- 同名同版本 npm 包只加载一次；本地与 npm 同名但不同源的分别加载。

## 技能发现（superpowers 式自注册）

- opencode 的技能发现是**懒执行**的；插件在启动时先加载，其 `config` 钩子
  收到的 config 对象是缓存单例——钩子里 push 进去的路径，等 skill 工具真正
  做发现时才被读到。
- 因此生成的 bootstrap 插件（`{{PREFIX}}-bootstrap.ts`）带 `config` 钩子：
  把插件根的 `skills/` 目录以绝对路径注册进 `config.skills`。同时兼容两种
  形态——v1 对象 `{ skills: { paths: [...] } }` 与 v2 数组 `{ skills: [...] }`
  （dev 分支已把 v1 的 `skills.paths/urls` 迁移成数组）。
- 这是 obra/superpowers 的做法：单一源 `skills/` 服务所有端（bootstrap
  `config` 钩子运行时注册，见 `tools/harnesses/opencode/`）。
- 另一条路是声明式：`opencode.json` 里 `"skills": ["./skills/"]`，相对路径
  按项目目录解析；且每个配置目录下的 `<dir>/skill`、`<dir>/skills` 会被
  自动注册。本工厂选自注册（对 npm/git 安装同样有效），不用声明式键。

## 插件结构（生成项目）

```
<plugin>/
├── .opencode/
│   ├── opencode.json          # 配置（name/description；可选 "plugin" npm 数组）
│   └── plugins/               # *.ts / *.js 插件模块（即 "hooks"；含 config 钩子）
└── skills/                    # 单一技能源，由 bootstrap 的 config 钩子运行时注册
```

## 开发迭代提示

- 插件在**启动时加载**（npm 插件由 Bun 启动时自动安装并缓存
  `~/.cache/opencode/node_modules/`）——修改本地插件文件后重启 opencode 生效。
- 本地插件如需外部 npm 依赖：在 `.opencode/package.json` 声明，
  启动时 `bun install` 自动安装。
- 同名同版本 npm 包只加载一次；本地与 npm 同名但不同源的分别加载。

## 对 plugin-factory 的含义

- 生成的 opencode 插件 = `.opencode/plugins/<prefix>-bootstrap.ts`（`config`
  钩子注册技能源 + `session.created` 注入入口）+ `.opencode/opencode.json`
  （无声明式 `skills` 键）；无需生成 manifest。
- `Hooks.config` 是公开插件钩子（`packages/plugin/src/index.ts` 的 `Hooks`
  接口）；运行时在插件加载后逐个调用 `hook.config?.(cfg)`。复核时对照
  opencode 源码的 plugin 加载顺序与 `config/plugin/skill.ts`。
