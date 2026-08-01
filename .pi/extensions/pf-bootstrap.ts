/**
 * plugin-factory — pi extension bootstrap.
 *
 * M0 placeholder. The exact pi extension API surface is verified in M2
 * (see references/agent-adapters.md "pi — 待验证 items"). At minimum this
 * module must remain valid TypeScript so `node --check` passes.
 *
 * Intended behavior (M2):
 *   - inject the "check pf-* skills before any task" bootstrap prompt at
 *     session start, mirroring the pattern used by superpowers' pi package.
 */
export const meta = {
  name: "plugin-factory",
  version: "0.1.0",
  description:
    "Bootstrap for plugin-factory: make the agent check pf-* skills before any task.",
} as const;
