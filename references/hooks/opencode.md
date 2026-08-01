# opencode hooks（= 插件）— 规格固化

> **固化于：2026-08-01** · 来源：https://opencode.ai/docs/plugins/
> **复核**：仅当 opencode 发布破坏性插件/hooks 变更或接线失败时复核。
> 不要预先重搜；为这一端复核时不要动其他端文件。

## 模型

- opencode **没有 shell 钩子**。其 hook 机制是 **TypeScript/JS 插件**：
  一个模块导出一个或多个插件函数；每个函数接收上下文对象、返回 hooks 对象。
- 加载位置（顺序：全局配置 → 项目配置 → 全局插件目录 → 项目插件目录）：
  - `.opencode/plugins/*.{ts,js}` — 项目级
  - `~/.config/opencode/plugins/` — 全局
  - `opencode.json` 的 `"plugin": [...]` npm 包（Bun 安装）

## 插件签名

```ts
import type { Plugin } from "@opencode-ai/plugin";

export const MyPlugin: Plugin = async ({ project, client, $, directory, worktree }) => {
  return { /* hook 实现 */ };
};
```

- `$` 是 Bun 的 shell API（用于执行命令）。
- 本地插件用 npm 依赖：加 `.opencode/package.json`（Bun 启动时安装）。

## 事件键（hooks 对象键）

- **工具**：`tool.execute.before`、`tool.execute.after`
- **Shell**：`shell.env`
- **权限**：`permission.asked`、`permission.replied`
- **会话**：`session.created`、`session.compacted`、`session.deleted`、`session.diff`、
  `session.error`、`session.idle`、`session.status`、`session.updated`
- **消息**：`message.part.removed`、`message.part.updated`、`message.removed`、`message.updated`
- **文件**：`file.edited`、`file.watcher.updated`
- **待办**：`todo.updated`
- **LSP**：`lsp.client.diagnostics`、`lsp.updated`
- **命令**：`command.executed`
- **安装**：`installation.updated`
- **服务器**：`server.connected`
- **TUI**：`tui.prompt.append`、`tui.command.execute`、`tui.toast.show`
- **全量**：`event`（接收任意事件）
- **压缩**：`experimental.session.compacting`（push `output.context` 或设置 `output.prompt`）
- **自定义工具**：`tool`（`tool({...})` 定义注册表）

## 行为

- hook 处理器接收 `(input, output)`；**修改 `output`** 改变行为，或 **throw** 阻断。
  - `tool.execute.before`（bash）：`output.args.command = ...` 重写，throw 阻断。
  - `shell.env`：`output.env.X = ...` 注入环境变量。
- 日志：`client.app.log(...)`（级别：debug/info/warn/error）。

## 对 plugin-factory 的含义

- 生成的 opencode hooks = `.opencode/plugins/` 下每个事件组一个 `.ts` 插件。
- "多 shell" 不适用——TS 天然跨平台。
