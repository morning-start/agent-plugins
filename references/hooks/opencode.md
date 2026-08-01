# opencode hooks (= plugins) — 规格固化

> **Captured: 2026-08-01** · Source: https://opencode.ai/docs/plugins/
> **Re-verify**: only when opencode ships a breaking plugin/hooks change or wiring fails
> at runtime. Do not re-search pre-emptively; do not edit other harness files for this one.

## Model

- opencode has **no shell hooks**. Its hook mechanism is **TypeScript/JS plugins**:
  a module exporting one or more plugin functions; each function receives a context
  object and returns a hooks object.
- Load locations (order: global config → project config → global plugins dir →
  project plugins dir):
  - `.opencode/plugins/*.{ts,js}` — project-level
  - `~/.config/opencode/plugins/` — global
  - npm packages via `"plugin": [...]` in `opencode.json` (installed with Bun)

## Plugin signature

```ts
import type { Plugin } from "@opencode-ai/plugin";

export const MyPlugin: Plugin = async ({ project, client, $, directory, worktree }) => {
  return { /* hook implementations */ };
};
```

- `$` is Bun's shell API (for executing commands).
- Local plugins using npm deps: add `.opencode/package.json` (Bun installs at startup).

## Event keys (hooks object keys)

- **Tool**: `tool.execute.before`, `tool.execute.after`
- **Shell**: `shell.env`
- **Permission**: `permission.asked`, `permission.replied`
- **Session**: `session.created`, `session.compacted`, `session.deleted`, `session.diff`,
  `session.error`, `session.idle`, `session.status`, `session.updated`
- **Message**: `message.part.removed`, `message.part.updated`, `message.removed`, `message.updated`
- **File**: `file.edited`, `file.watcher.updated`
- **Todo**: `todo.updated`
- **LSP**: `lsp.client.diagnostics`, `lsp.updated`
- **Command**: `command.executed`
- **Installation**: `installation.updated`
- **Server**: `server.connected`
- **TUI**: `tui.prompt.append`, `tui.command.execute`, `tui.toast.show`
- **Catch-all**: `event` (receive any event)
- **Compaction**: `experimental.session.compacting` (push `output.context` or set `output.prompt`)
- **Custom tools**: `tool` (registry of `tool({...})` definitions)

## Behavior

- Hook handlers receive `(input, output)`; **mutate `output`** to change behavior or
  **throw** to block.
  - `tool.execute.before` (bash): `output.args.command = ...` to rewrite, throw to block.
  - `shell.env`: `output.env.X = ...` to inject env vars.
- Logging: `client.app.log(...)` (levels: debug/info/warn/error).

## Implication for plugin-factory

- Generated opencode hooks = one `.ts` plugin per event group under `.opencode/plugins/`.
- "Multi-shell" does not apply — TS is cross-platform.
