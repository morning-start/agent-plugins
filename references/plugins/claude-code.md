# Claude Code plugin 格式 — 规格固化

> **Captured: 2026-08-01** · Sources:
> - 创建指南: https://code.claude.com/docs/en/plugins (Create plugins)
> - 完整技术规格: https://code.claude.com/docs/en/plugins-reference ⚠️ (network-restricted on capture day; verify at M1 wiring)
> - 市场/目录: https://claude.com/plugins (directory, captured)
> - 分发: https://code.claude.com/docs/en/plugin-marketplaces, https://code.claude.com/docs/en/discover-plugins
> **Re-verify**: only on breaking plugin-format changes. Do not re-search pre-emptively.

## Model: standalone vs plugin

| | Standalone (`.claude/`) | Plugin (self-contained dir) |
|---|---|---|
| Skill names | `/hello` | `/plugin-name:hello` (namespaced, no conflicts) |
| Best for | personal / single-project / experiments | sharing, distribution, versioned releases |
| Hooks | in `settings.json` | in `hooks/hooks.json` (same format) |

Start standalone, then migrate to a plugin to share.

## Plugin structure

Every plugin lives in **its own directory** containing skills, agents, commands, or
hooks, optionally alongside a `.claude-plugin/plugin.json` manifest:

```
my-plugin/
├── .claude-plugin/plugin.json   # identity: name, description, version
├── skills/                      # namespaced /my-plugin:skill-name
├── agents/
├── commands/
├── hooks/
│   └── hooks.json               # format identical to settings.json "hooks" object
└── (rules/, references/, scripts/, tests/ — plugin-factory extensions)
```

### Manifest (`plugin.json`)

Verified fields (from the guide): `name`, `description`, `version`.
Full schema (author, license, tags, homepage, repository, dependencies…) lives in
`plugins-reference` ⚠️ — check that source when wiring.

### Hooks in plugins

`hooks/hooks.json` uses the **same format** as the `hooks` object in
`settings.json` — copy the object verbatim when migrating:

```json
{
  "hooks": {
    "PostToolUse": [
      { "matcher": "Write|Edit", "hooks": [{ "type": "command", "command": "jq -r '.tool_input.file_path' | xargs npm run lint:fix" }] }
    ]
  }
}
```

## Testing

Load locally: `claude --plugin-dir ./my-plugin`. Then exercise commands, agents
(`/context`), and every hooked event; matched hooks appear in the debug log.

## Migration (standalone → plugin)

1. `mkdir -p my-plugin/.claude-plugin` + write `plugin.json` (name/description/version).
2. `cp -r .claude/commands my-plugin/` (same for `agents`, `skills`).
3. Hooks: create `my-plugin/hooks/` + `hooks.json` copied from settings.
4. Test with `--plugin-dir`; remove originals from `.claude/` afterwards.

## Distribution

- Marketplaces: `plugin-marketplaces` doc; install via `/plugin install`, add via
  `/plugin marketplace add`.
- Directory submission: https://clau.de/plugin-directory-submission (out of scope M0–M4).

## Implication for plugin-factory

- Generated Claude Code plugin = manifest + root `skills/`/`commands/`/`agents/` +
  `hooks/hooks.json`; skills are namespaced `<plugin-name>:<skill>`.
- plugin-factory's own `.claude-plugin/plugin.json` (name/description/version/tags)
  matches the verified field set.
