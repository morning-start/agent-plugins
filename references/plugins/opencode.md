# opencode plugin 格式 — 规格固化

> **Captured: 2026-08-01** · Sources:
> - 文档(EN): https://opencode.ai/docs/plugins/ · 文档(zh-CN): https://opencode.ai/docs/zh-cn/plugins/
> - 生态/市场: https://opencode.ai/docs/ecosystem (社区插件目录)
>   (注: omp.sh 是 **oh-my-pi** 而非 opencode 的市场 — 见 plugins/oh-my-pi.md)
> **Re-verify**: only on breaking plugin-format changes. Do not re-search pre-emptively.

## Model

- opencode plugins are **JavaScript/TypeScript modules** — **no plugin.json manifest**.
- A plugin module exports one or more **plugin functions**; each receives a context
  object and returns a **hooks object** (event keys in `hooks/opencode.md`).
- npm plugins are auto-installed with Bun at startup (cache `~/.cache/opencode/node_modules/`).

## Locations & load order

| Source | Scope |
|--------|-------|
| `~/.config/opencode/opencode.json` | global config (first) |
| `opencode.json` | project config |
| `~/.config/opencode/plugins/` | global plugins dir |
| `.opencode/plugins/` | project plugins dir (last) |

- npm: `"plugin": ["opencode-helicone-session", ...]` in `opencode.json`.
- Local plugin npm deps: add `.opencode/package.json` (Bun installs at startup).
- Duplicate npm packages (same name+version) load once; similar local/npm names load separately.

## Plugin structure (generated project)

```
<plugin>/
├── .opencode/
│   ├── opencode.json          # config (name/description; optional "plugin" npm array)
│   └── plugins/               # *.ts / *.js plugin modules (the "hooks")
└── (skills via .opencode/skills/ or .agents/skills/ — see agent-adapters.md)
```

## Implication for plugin-factory

- Generated opencode plugin = `.opencode/plugins/*.ts` (one module per event group) +
  `.opencode/opencode.json`; no manifest to generate.
- Hooks spec (event keys, signatures, examples) lives in `hooks/opencode.md` — this file
  covers only the packaging side.
