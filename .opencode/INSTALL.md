# plugin-factory — opencode installation

plugin-factory is a meta-plugin: it guides the agent through creating **standalone,
multi-agent plugin projects** (Claude Code / pi / opencode) from a user's intent,
goals, and scenarios.

## Install

1. Make the `pf-*` skills discoverable by opencode. opencode scans
   `.opencode/skills/`, `.claude/skills/`, and `.agents/skills/` — but NOT the
   repo-root `skills/` directory. Copy the skills into place:

   ```sh
   mkdir -p .opencode/skills
   cp -r skills/pf-intent skills/pf-design skills/pf-build skills/pf-verify skills/pf-lifecycle .opencode/skills/
   ```

   > A dedicated installer script (`.opencode/skills` sync) is planned for M2;
   > until then the copy step above is the supported path.

2. Restart opencode so it rescans skill directories.

## Use

Ask the agent to **create a plugin** (or mention "plugin-factory"). The agent will
run the `pf-intent` interview, produce a one-page PRD, and drive design → build →
verify → release using the `pf-*` skills and skill-creator.

## Notes

- Skills live canonically in the repo-root `skills/` directory; opencode needs the
  copy under `.opencode/skills/` because its discovery paths do not include repo root.
- Documentation is English; the user-facing README has a Chinese edition
  (`README.zh-CN.md`).
