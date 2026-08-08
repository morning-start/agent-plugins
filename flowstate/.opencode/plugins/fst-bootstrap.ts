/**
 * flowstate — opencode plugin (bootstrap).
 *
 * opencode has no shell hooks — this TypeScript plugin module is loaded from
 * `.opencode/plugins/` and returns a hooks object over the message/session
 * surface only. The injected body comes from the canonical
 * `skills/using-flowstate/SKILL.md` (frontmatter stripped, single marker),
 * never hand-copied here.
 */

// @ts-check
import { readFileSync } from "node:fs";
import { join } from "node:path";

const MARKER_PREFIX = "FLOWSTATE_BOOTSTRAP";
const PLUGIN_NAME = "flowstate";
const ENTRY_REL = join("skills", "using-flowstate", "SKILL.md");

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

/** @returns {Promise<Record<string, unknown>>} */
export const FstBootstrap = async ({ directory } = {}) => {
  const root = directory || process.cwd();
  const entry = loadEntry(root);

  return {
    "session.created": async (input, output) => {
      if (!entry) return;
      const text = JSON.stringify(output || {}) + JSON.stringify(input || {});
      if (text.includes(MARKER_PREFIX)) return;
      if (output && typeof output === "object") {
        output.prompt = output.prompt ? `${entry.text}\n\n${output.prompt}` : entry.text;
      }
    },
    "message.part.updated": async (input, output) => {
      // No-op adapter stub: idempotent, never duplicates the marker.
      void input;
      void output;
    },
  };
};

export default FstBootstrap;
