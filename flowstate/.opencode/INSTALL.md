# flowstate — opencode installation

flowstate is loaded as a local opencode plugin from `.opencode/plugins/`.

## Install

1. Copy this plugin directory into your project (opencode picks up
   `.opencode/plugins/` automatically).
2. Restart opencode so it rescans the plugin and skill directories.

## Skill discovery

Skills live canonically in the repo-root `skills/` directory. The bootstrap
plugin (`.opencode/plugins/fst-bootstrap.ts`) registers that directory as an
opencode skill source at runtime via its `config` hook — superpowers-style
self-registration. No `.opencode/skills/` copy, no symlink, no `skills` key
in `opencode.json`.

Do NOT copy skills under `.opencode/skills/`; a duplicate tree drifts from
the canonical source.

## Use

- Entry: `using-flowstate` skill routes to the right `fst-*` skill
  (fst-init / fst-change / fst-review / fst-iterate) based on the situation.
- Bootstrap: `.opencode/plugins/fst-bootstrap.ts` injects the entry skill
  into session context (single marker `FLOWSTATE_BOOTSTRAP:flowstate`).
