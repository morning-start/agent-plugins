# Bootstrap Adapters and Injection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use a task-by-task implementation workflow with a review gate after every checkbox group.

**Goal:** Make the `using-<plugin>` entry skill reliably reach the model on Claude Code, pi, oh-my-pi, and opencode with per-harness idempotence.

**Architecture:** Keep the entry skill as the canonical source. A small renderer reads its body, removes frontmatter, adds a factual bootstrap marker, and emits the harness-specific transport. Each adapter owns only lifecycle wiring and duplicate detection.

**Tech Stack:** Bash, PowerShell, TypeScript, Node.js template renderer, pinned adapter references under `references/hooks/`.

## Global Constraints

- Do not duplicate the entry skill body in shell, pi, or opencode source files.
- Bootstrap text must be factual context, not a second competing workflow.
- Each lifecycle event must inject at most once per session/turn/compact phase.
- Use the pinned harness specifications in `references/hooks/`; do not invent event names.
- Hook paths must resolve from the plugin root, not the caller's current working directory.

## File Map

- Create `scripts/render-bootstrap.mjs`: canonical entry-body loader and marker renderer.
- Modify `hooks/session-start.sh`: emit Claude-compatible JSON context.
- Modify `hooks/session-start.ps1`: emit the same JSON context through PowerShell.
- Modify `.pi/extensions/pf-bootstrap.ts`: context injection, session start handling, and compact re-injection.
- Create `.opencode/plugins/pf-bootstrap.ts`: opencode message/session adapter.
- Modify `hooks/hooks.json`: root-safe command paths and explicit shell fields.
- Create `tests/bootstrap/bootstrap-contract.test.mjs`: renderer and adapter contract tests.
- Modify `references/hooks/claude-code.md`, `references/hooks/pi.md`, and `references/hooks/opencode.md` only if the implementation exposes a new verified invariant.

## Interfaces

The renderer must expose:

```js
export function renderBootstrap({ entrySkillPath, pluginName, harness }) {
  return {
    marker: `PLUGIN_FACTORY_BOOTSTRAP:${pluginName}`,
    text: "...",
  };
}
```

The marker must be stable for one plugin and must appear exactly once in an injected context.

Claude output contract:

```json
{
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": "PLUGIN_FACTORY_BOOTSTRAP:<plugin> ..."
  }
}
```

Pi adapter contract:

- `session_start` may show a user-facing notification;
- `context` returns `{ messages }` only when the marker is absent;
- `session_compact` schedules the same context for the next model turn without duplicating it.

Opencode adapter contract:

- the plugin is an exported `Plugin` function;
- it uses the pinned message/session hook surface;
- it does not attempt to run shell hooks.

## Implementation Tasks

- [ ] **Step 1: Add renderer and duplication tests**

Tests must verify:

1. frontmatter is removed from injected body;
2. the marker is stable;
3. repeated rendering does not duplicate the marker;
4. missing entry skill fails with a clear error;
5. special characters in plugin names remain intact.

Run:

```text
node --test tests/bootstrap/bootstrap-contract.test.mjs
```

Expected before implementation: FAIL because the renderer and adapters do not exist.

- [ ] **Step 2: Implement the canonical renderer**

Read `skills/using-pf/SKILL.md`, parse its frontmatter boundary, and render only the body plus a single factual marker. The renderer must resolve paths relative to the plugin root supplied by the caller.

- [ ] **Step 3: Implement Claude Code transport**

Update both shell implementations to call the renderer and serialize valid JSON. The Bash and PowerShell outputs must contain the same `hookEventName`, marker, and body after JSON decoding.

Update `hooks/hooks.json` to use a plugin-root-safe command path and explicit `shell` values for both shell variants.

- [ ] **Step 4: Implement pi and oh-my-pi transport**

Update `.pi/extensions/pf-bootstrap.ts` using the pinned `context` event contract. Preserve a short `ctx.ui.notify` message only as optional UX; the model-visible context is the required behavior.

Handle `session_start` and `session_compact` without adding duplicate bootstrap messages.

- [ ] **Step 5: Implement opencode transport**

Create `.opencode/plugins/pf-bootstrap.ts` using the pinned `Plugin` signature. Register the smallest supported message/session transform that makes the entry context model-visible and idempotent.

- [ ] **Step 6: Verify adapter parity**

Run:

```text
node --test tests/bootstrap/bootstrap-contract.test.mjs
node --check .pi/extensions/pf-bootstrap.ts
node --check .opencode/plugins/pf-bootstrap.ts
npm run validate
npm run validate:ps
```

For shell parity, decode both outputs and compare the marker and normalized body rather than comparing JSON whitespace.

## Acceptance Criteria

- Every advertised harness receives the full entry-skill context automatically.
- The marker appears once per relevant lifecycle phase.
- Shell adapters emit valid Claude hook JSON.
- Pi and opencode adapters use their native TypeScript extension/plugin surfaces.
- No adapter contains a manually copied `using-pf` body.

## Non-goals

- Do not add profile switches or disabled-hook configuration yet.
- Do not inject every skill into the session; only the single entry skill is bootstrapped.
- Do not add runtime telemetry.
