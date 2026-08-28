/**
 * flowstate — pi / oh-my-pi bootstrap extension.
 *
 * Implements the pi extension API (pi / oh-my-pi compatible). Auto-discovered
 * from package.json `pi.extensions` (and `omp.extensions` for oh-my-pi).
 * Injects the canonical entry skill `skills/using-fst/SKILL.md` into
 * session context so the agent knows which fst-* skill to route to.
 * Kept dependency-free and node-checkable: types live in JSDoc only.
 */

// @ts-check
import { readFileSync } from "node:fs";
import { join } from "node:path";

const MARKER_PREFIX = "FLOWSTATE_BOOTSTRAP";
const PLUGIN_NAME = "flowstate";
const ENTRY_REL = join("skills", "using-fst", "SKILL.md");

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
  // Canonical frontmatter regex — keep in sync with .opencode/plugins/fst-bootstrap.ts,
  // hooks/session-start.sh (awk), and hooks/session-start.ps1 ([regex]).
  const m = /^---\r?\n[\s\S]*?\r?\n---\r?\n?/.exec(raw);
  const body = m ? raw.slice(m[0].length).replace(/^\s*\r?\n/, "") : raw.trim();
  cached = {
    marker: `${MARKER_PREFIX}:${PLUGIN_NAME}`,
    text: `${MARKER_PREFIX}:${PLUGIN_NAME}\n\n${body}`,
  };
  return cached;
}

/** @param {import("@earendil-works/pi-coding-agent").ExtensionAPI} pi */
export default function (pi) {
  pi.on("session_start", async (_event, ctx) => {
    ctx.ui.notify(
      "flowstate loaded — route via using-fst: fst-init / fst-change / fst-review / fst-iterate.",
      "info",
    );
  });

  pi.on("context", async (_event, ctx) => {
    const messages = ctx.messages;
    if (!Array.isArray(messages)) return undefined;
    if (JSON.stringify(messages).includes(MARKER_PREFIX)) return undefined;
    const entry = loadEntry(process.cwd());
    if (!entry) return undefined;
    return { messages: [...messages, { role: "user", content: entry.text }] };
  });

  pi.on("session_compact", async (_event, ctx) => {
    // Do not duplicate: compaction clears messages; the `context` handler
    // re-injects the single entry copy on the next model turn.
    void ctx;
    return undefined;
  });
}
