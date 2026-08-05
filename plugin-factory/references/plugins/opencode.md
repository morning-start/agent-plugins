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

## 插件结构（生成项目）

```
<plugin>/
├── .opencode/
│   ├── opencode.json          # 配置（name/description；可选 "plugin" npm 数组）
│   └── plugins/               # *.ts / *.js 插件模块（即 "hooks"）
└── (skills 经 .opencode/skills/ 或 .agents/skills/ — 见 agent-adapters.md)
```

## 对 plugin-factory 的含义

- 生成的 opencode 插件 = `.opencode/plugins/*.ts`（每个事件组一个模块）+
  `.opencode/opencode.json`；无需生成 manifest。
- hooks 规格（事件键、签名、示例）在 `hooks/opencode.md`——本文件只管打包侧。
