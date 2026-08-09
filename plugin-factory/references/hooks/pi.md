# pi hooks（= 扩展）— 规格固化

> **固化于：2026-08-01** · 来源：https://pi.dev/docs/latest/extensions 与
> https://github.com/earendil-works/pi/blob/v0.79.10/packages/coding-agent/docs/extensions.md
> **复核**：仅当 pi 发布破坏性扩展变更或接线失败时复核。
> 不要预先重搜；为这一端复核时不要动其他端文件。

## 模型

- pi 的 hook 机制是 **TypeScript 扩展**：模块 **默认导出工厂函数**
  `(pi: ExtensionAPI) => void | Promise<void>`。
- 异步工厂会在 `session_start` 前 await（也在 resources discover / provider 刷新前）。
- 位置（自动发现；项目级需先信任项目）：
  - `~/.pi/agent/extensions/*.ts`（全局）与 `~/.pi/agent/extensions/*/index.ts`
  - `.pi/extensions/*.ts`（项目级）与 `.pi/extensions/*/index.ts`
  - `package.json` 的 `"pi": {"extensions": [...]}`
  - `settings.json` 的 `"extensions"` 数组
- 热重载：`/reload`。
- 类型包：`@earendil-works/pi-coding-agent`（原 `@mariozechner/pi-coding-agent`）。

## API 面

- `pi.on(event, handler)` — 订阅；handler `(event, ctx) => void | result`
- `ctx.ui`：`notify(msg, level)`、`confirm(title, msg)`、`input(...)`、`select(...)`、
  `setStatus(id, text)`、`setWidget(id, lines)`
- `pi.registerTool(def)`、`pi.registerCommand(name, def)`、`pi.registerShortcut(keys, def)`、
  `pi.registerFlag(name, def)`、`pi.sendMessage(...)`、`pi.sendUserMessage(...)`、
  `pi.appendEntry(type, data)`
- **会话持久化**：`pi.appendEntry({key, value})` — 状态跨重启保留
  （如待办列表、连接池；用 `pi.on("session_start")` 读取恢复）。
- **Provider 注册**：异步工厂函数可 `pi.registerProvider(...)` 动态添加本地模型
  （pi 会 await 异步工厂完成后再继续启动）。

## 事件

- **生命周期**：`session_start`（reason: new/resume/fork）、`session_shutdown`（清理；
  reasons: quit/reload/new/resume/fork）、`exit`
- **会话**：`session_before_switch`（`{cancel:true}` 取消；reasons: new/resume）、
  `session_info_changed`（会话重命名）、`session_before_fork` / `session_tree`
  （取消或自定义摘要）、`session_before_compact` / `session_compact`
  （取消，或返回自定义 `{compaction, summary}`）
- **Agent**：`agent_start`、`agent_end`、`turn`、`turn_end`、`context`（修改深拷贝：
  `return { messages }`）
- **模型**：存在模型事件（固化于 2026-08-01——名称见钉住来源）
- **工具**：`tool_call`（阻断：`return { block: true, reason }`）、`tool_result`
  （修改：`return { content, details, isError }`）
- **其他**：`resources_discover`、`trust_decision`（项目信任）

## 示例（钉住模式）

```ts
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function (pi: ExtensionAPI): void {
  pi.on("session_start", async (_event, ctx) => {
    ctx.ui.notify("Extension loaded!", "info");
  });
  pi.on("tool_call", async (event, ctx) => {
    if (event.toolName === "bash" && event.input.command?.includes("rm -rf")) {
      const ok = await ctx.ui.confirm("Dangerous!", "Allow rm -rf?");
      if (!ok) return { block: true, reason: "Blocked by user" };
    }
  });
}
```

## 对 plugin-factory 的含义

- 生成的 pi hooks = `.pi/extensions/<插件名>.ts` 中的 `pi.on(...)` 处理器。
- 阻断 = `return {block:true}`；结果修改 = 返回修改后的结果。
- **工具参数用 TypeBox schema**（`Type.Object` 等）——定义清晰且类型安全。
- **分发注意**：通过 `pi install`（npm/git）分发的 pi 包，运行时依赖必须在
  `dependencies`（安装默认 `--omit=dev`，**devDependencies 运行时不可用**）。
- **开发提示**：`pi -e ./my-extension.ts` 快速测试单个扩展文件（无需放入
  目录）；自动发现位置的扩展可用 `/reload` 热重载（`-e` 不支持）。

## 已验证不变量（T3 落地）

- 引导扩展（`.pi/extensions/pf-bootstrap.ts`，omp 共用）只注入**一个**入口技能
  （`using-<plugin>`，frontmatter 剥离）的副本：`context` 事件仅在消息中缺失
  `PLUGIN_FACTORY_BOOTSTRAP:<plugin>` marker 时返回 `{messages}`；
  `session_compact` 不重复注入（压缩清空消息后由 `context` 在下一次模型轮注入）。
- 注入文本来自 `skills/using-<plugin>/SKILL.md` 的规范正文，适配器不含手工拷贝。
