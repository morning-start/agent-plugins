/**
 * plugin-factory — pi / oh-my-pi bootstrap extension.
 *
 * Implements the pi extension API per the frozen spec:
 * references/hooks-reference.md §3 (captured 2026-08-01).
 * Auto-discovered from `.pi/extensions/*.ts` (project-local, after project trust);
 * hot-reloaded with `/reload`. omp loads the same module via `pkg.omp || pkg.pi`.
 *
 * Canonical source of the injected body is `skills/using-pf/SKILL.md`; this
 * adapter only wires lifecycle events and detects duplicates — it never
 * hand-copies the entry-skill body.
 *
 * Contract:
 * - `session_start` may show a user-facing notification (UX only).
 * - `context` returns `{ messages }` only when the bootstrap marker is absent.
 * - `session_compact` schedules re-injection for the next model turn without
 *   duplicating the marker (the `context` handler re-injects after compaction
 *   clears the message list).
 *
 * Kept dependency-free and node-checkable: types live in JSDoc only. For full
 * types, prefer the official package `@earendil-works/pi-coding-agent`
 * (formerly `@mariozechner/pi-coding-agent`).
 */

// @ts-check
import { readFileSync } from "node:fs";
import { join } from "node:path";

const MARKER_PREFIX = "PLUGIN_FACTORY_BOOTSTRAP";
const PLUGIN_NAME = "plugin-factory";
const ENTRY_REL = join("skills", "using-pf", "SKILL.md");

/** @type {{ marker: string, text: string } | null} */
let cached = null;

/** Read the canonical entry skill once; strip frontmatter; add the marker. */
function loadEntry(root) {
  if (cached) return cached;
  let raw;
  try {
    raw = readFileSync(join(root, ENTRY_REL), "utf8");
  } catch {
    return null;
  }
  const m = /^---\r?\n[\s\S]*?\r?\n---\r?\n?/.exec(raw);
  const body = m ? raw.slice(m[0].length).replace(/^\s*\r?\n/, "") : raw.trim();
  cached = {
    marker: `${MARKER_PREFIX}:${PLUGIN_NAME}`,
    text: `${MARKER_PREFIX}:${PLUGIN_NAME}\n\n${body}`,
  };
  return cached;
}

/**
 * @param {import("@earendil-works/pi-coding-agent").ExtensionAPI} pi
 */
export default function (pi) {
  pi.on("session_start", async (_event, ctx) => {
    ctx.ui.notify("plugin-factory loaded — check pf-* skills before any task.", "info");
  });

  pi.on("context", async (_event, ctx) => {
    const messages = ctx.messages;
    if (!Array.isArray(messages)) return undefined;
    // Idempotence: never inject a second copy once the marker is present.
    if (JSON.stringify(messages).includes(MARKER_PREFIX)) return undefined;
    const entry = loadEntry(process.cwd());
    if (!entry) return undefined;
    return { messages: [...messages, { role: "user", content: entry.text }] };
  });

  pi.on("session_compact", async (_event, ctx) => {
    // Do not duplicate: compaction clears messages, and the `context` handler
    // re-injects the single entry copy on the next model turn.
    void ctx;
    return undefined;
  });
}
