# flowstate — opencode installation

flowstate is loaded as a local opencode plugin from `.opencode/plugins/`.

## Install

1. Copy this plugin directory into your project (opencode picks up
   `.opencode/plugins/` and `.opencode/skills/` automatically).
2. Restart opencode so it rescans plugin and skill directories.

## Skill discovery

opencode scans `.opencode/skills/`, `.claude/skills/`, and `.agents/skills/` —
NOT the repo-root `skills/` directory. The plugin ships pre-copied skills
under `.opencode/skills/` (using-flowstate + fst-init/change/review/iterate)
so no manual copy step is required.

## Use

- Entry: `using-flowstate` skill routes to the right `fst-*` skill
  (fst-init / fst-change / fst-review / fst-iterate) based on the situation.
- Bootstrap: `.opencode/plugins/fst-bootstrap.ts` injects the entry skill
  into session context (single marker `FLOWSTATE_BOOTSTRAP:flowstate`).
