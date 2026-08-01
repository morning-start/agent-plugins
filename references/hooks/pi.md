# pi hooks (= extensions) — 规格固化

> **Captured: 2026-08-01** · Sources: https://pi.dev/docs/latest/extensions and
> https://github.com/earendil-works/pi/blob/v0.79.10/packages/coding-agent/docs/extensions.md
> **Re-verify**: only when pi ships a breaking extension change or wiring fails at
> runtime. Do not re-search pre-emptively; do not edit other harness files for this one.

## Model

- pi's hook mechanism is **TypeScript extensions**: a module with a **default export
  factory** `(pi: ExtensionAPI) => void | Promise<void>`.
- An async factory is awaited before `session_start` (and before resources discover /
  provider flush).
- Locations (auto-discovered; project-local loads only after the project is trusted):
  - `~/.pi/agent/extensions/*.ts` (global) and `~/.pi/agent/extensions/*/index.ts`
  - `.pi/extensions/*.ts` (project-local) and `.pi/extensions/*/index.ts`
  - `"pi": {"extensions": [...]}` in `package.json`
  - `"extensions"` array in `settings.json`
- Hot-reload with `/reload`.
- Types package: `@earendil-works/pi-coding-agent` (formerly `@mariozechner/pi-coding-agent`).

## API surface

- `pi.on(event, handler)` — subscribe; handler `(event, ctx) => void | result`
- `ctx.ui`: `notify(msg, level)`, `confirm(title, msg)`, `input(...)`, `select(...)`,
  `setStatus(id, text)`, `setWidget(id, lines)`
- `pi.registerTool(def)`, `pi.registerCommand(name, def)`, `pi.registerShortcut(keys, def)`,
  `pi.registerFlag(name, def)`, `pi.sendMessage(...)`, `pi.sendUserMessage(...)`,
  `pi.appendEntry(type, data)`

## Events

- **Lifecycle**: `session_start` (reason: new/resume/fork), `session_shutdown` (cleanup;
  reasons: quit/reload/new/resume/fork), `exit`
- **Session**: `session_before_switch` (cancel: `{cancel:true}`; reasons: new/resume),
  `session_info_changed` (renamed session), `session_before_fork` / `session_tree`
  (cancel or custom summary), `session_before_compact` / `session_compact`
  (cancel, or return custom `{compaction, summary}`)
- **Agent**: `agent_start`, `agent_end`, `turn`, `turn_end`, `context` (modify a deep
  copy: `return { messages }`)
- **Model**: model events exist (captured 2026-08-01 — names in pinned source)
- **Tools**: `tool_call` (block: `return { block: true, reason }`), `tool_result`
  (modify: `return { content, details, isError }`)
- **Other**: `resources_discover`, `trust_decision` (project trust)

## Example (pinned pattern)

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

## Implication for plugin-factory

- Generated pi hooks = `pi.on(...)` handlers inside `.pi/extensions/<plugin-name>.ts`.
- Blocking = return `{block:true}`; result modification = return a modified result.
