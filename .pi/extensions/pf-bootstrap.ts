/**
 * plugin-factory — pi extension bootstrap.
 *
 * Implements the pi extension API per the frozen spec:
 * references/hooks-reference.md §3 (captured 2026-08-01).
 * Auto-discovered from `.pi/extensions/*.ts` (project-local, after project trust);
 * hot-reloaded with `/reload`.
 *
 * Kept dependency-free and node-checkable: types live in JSDoc only. For full
 * types, prefer the official package `@earendil-works/pi-coding-agent`
 * (formerly `@mariozechner/pi-coding-agent`).
 */

// @ts-check
/** @param {import("@earendil-works/pi-coding-agent").ExtensionAPI} pi */
export default function (pi) {
  pi.on("session_start", async (_event, ctx) => {
    ctx.ui.notify("plugin-factory loaded — check pf-* skills before any task.", "info");
  });
}
