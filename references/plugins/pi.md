# pi plugin 格式 — 规格固化

> **Captured: 2026-08-01** · Sources:
> - Extensions: https://pi.dev/docs/latest/extensions + https://github.com/earendil-works/pi/blob/v0.79.10/packages/coding-agent/docs/extensions.md
> - Skills: https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/skills.md
> **Re-verify**: only on breaking pi package/extension changes. Do not re-search pre-emptively.

## Model

- A pi plugin is a **package** (git repo or local dir) installed with
  `pi install git:github.com/<owner>/<repo>` (or `pi -e /path/to/checkout` for dev).
- The package contributes: **skills** (via `skills/` dir or `pi.skills` in package.json)
  and **extensions** (`.pi/extensions/*.ts` or `pi.extensions` in package.json).

## Packaging (package.json)

```json
{
  "name": "<plugin-name>",
  "version": "0.1.0",
  "pi": {
    "skills": ["skills"],
    "extensions": [".pi/extensions/<plugin-name>.ts"]
  }
}
```

- Skill discovery from packages: `skills/` directories or `pi.skills` entries.
- Extension discovery: `~/.pi/agent/extensions/*.ts` (global), `.pi/extensions/*.ts`
  (project-local, after trust), `package.json` `pi.extensions`, settings `extensions`
  array; hot-reload via `/reload`.

## Structure (generated project)

```
<plugin>/
├── package.json               # name/version + pi.skills / pi.extensions
├── skills/                    # Agent Skills standard SKILL.md dirs
├── .pi/extensions/<plugin>.ts # extension (pi.on(...) handlers; full spec in hooks/pi.md)
└── (commands via registerCommand — see hooks/pi.md)
```

## Implication for plugin-factory

- Generated pi plugin = `package.json` (`pi.skills` + `pi.extensions`) + `skills/` +
  `.pi/extensions/<plugin-name>.ts`.
- `pi install git:...` is the install path; plugin-factory's own `package.json`
  already carries `"pi": { "skills": ["skills"] }`.
- ⚠️ `pi.extensions` key shape for package-local extensions: verify against pi docs
  at M2 wiring (the pinned source lists it under package.json).
