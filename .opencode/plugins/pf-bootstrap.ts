/**
 * plugin-factory — opencode plugin (bootstrap).
 *
 * Pinned surface: references/hooks/opencode.md (plugin-factory). opencode has
 * no shell hooks — this TypeScript plugin module is loaded from
 * `.opencode/plugins/` and returns a hooks object over the message/session
 * surface only. It never attempts to run shell hooks.
 *
 * The injected body comes from the canonical `skills/using-pf/SKILL.md`
 * (frontmatter stripped, single marker), never hand-copied here.
 */

// @ts-check
import { readFileSync } from "node:fs";
import { join } from "node:path";

const MARKER_PREFIX = "PLUGIN_FACTORY_BOOTSTRAP";
const PLUGIN_NAME = "plugin-factory";
const ENTRY_REL = join("skills", "using-pf", "SKILL.md");

/** @type {{ marker: string, text: string } | null} */
let cached = null;

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
 * opencode plugin factory. `directory` is the project directory opencode passes
 * to plugins; entry lookup falls back to process.cwd() for direct `node --check`
 * / unit scenarios.
 * @returns {Promise<Record<string, unknown>>}
 */
export const PfBootstrap = async ({ directory } = {}) => {
  const root = directory || process.cwd();
  const entry = loadEntry(root);

  return {
    "session.created": async (input, output) => {
      if (!entry) return;
      const text = JSON.stringify(output || {}) + JSON.stringify(input || {});
      if (text.includes(MARKER_PREFIX)) return;
      // Surface the entry context as a model-visible prompt augmentation.
      if (output && typeof output === "object") {
        output.prompt = output.prompt
          ? `${entry.text}\n\n${output.prompt}`
          : entry.text;
      }
    },
    "message.part.updated": async (input, output) => {
      // No-op adapter stub: opencode's message surface is hydrated above; this
      // keeps the plugin idempotent without duplicating the marker.
      void input;
      void output;
    },
  };
};

export default PfBootstrap;
