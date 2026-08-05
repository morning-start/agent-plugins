#!/usr/bin/env node
/**
 * render-bootstrap.mjs — canonical bootstrap renderer.
 *
 * Reads the `using-<plugin>` entry skill (canonical source), strips its YAML
 * frontmatter, and renders the body plus a single factual bootstrap marker.
 * Each harness adapter owns only lifecycle wiring and duplicate detection —
 * the entry-skill body is never duplicated in shell, pi, or opencode sources.
 *
 * Marker: `PLUGIN_FACTORY_BOOTSTRAP:<pluginName>` — stable for one plugin and
 * must appear exactly once in an injected context.
 *
 * CLI:
 *   node scripts/render-bootstrap.mjs --root <plugin-root> --plugin-name <name> [--harness claude|pi|opencode]
 *   claude  → {"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":"..."}}
 *   pi/open → {"marker":"...","text":"..."}
 */
import { readFile, readdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

export const MARKER_PREFIX = "PLUGIN_FACTORY_BOOTSTRAP";

/** Extract the body of a SKILL.md (everything after the closing `---`). */
export function stripFrontmatter(text) {
  const m = /^---\r?\n[\s\S]*?\r?\n---\r?\n?/.exec(text);
  return m ? text.slice(m[0].length).replace(/^\s*\r?\n/, "") : text.trim();
}

/**
 * Render the bootstrap payload for one plugin.
 * @param {{entrySkillPath: string, pluginName: string}} opts
 * @returns {Promise<{marker: string, text: string, body: string}>}
 */
export async function renderBootstrap({ entrySkillPath, pluginName }) {
  if (typeof pluginName !== "string" || pluginName.length === 0) {
    throw new Error("render-bootstrap: pluginName is required");
  }
  const marker = `${MARKER_PREFIX}:${pluginName}`;
  let raw;
  try {
    raw = await readFile(entrySkillPath, "utf8");
  } catch (err) {
    throw new Error(
      `render-bootstrap: entry skill not found at ${entrySkillPath} (${err.code || err.message})`,
    );
  }
  const body = stripFrontmatter(raw);
  if (!body) {
    throw new Error(`render-bootstrap: entry skill is empty after frontmatter: ${entrySkillPath}`);
  }
  return { marker, body, text: `${marker}\n\n${body}` };
}

/**
 * Entry skill path for a plugin root + name. Prefers `skills/using-<name>`;
 * falls back to scanning `skills/` for the first `using-*` directory (the
 * plugin-factory root itself uses `using-pf`, not `using-plugin-factory`).
 */
export async function entrySkillPathFor(root, pluginName) {
  const base = pluginName.replace(/^using-/, "");
  const direct = join(root, "skills", `using-${base}`, "SKILL.md");
  try {
    await readFile(direct, "utf8");
    return direct;
  } catch {
    /* try scan */
  }
  try {
    const entries = await readdir(join(root, "skills"), { withFileTypes: true });
    const entry = entries
      .filter((e) => e.isDirectory() && e.name.startsWith("using-"))
      .sort((a, b) => a.name.localeCompare(b.name))[0];
    if (entry) return join(root, "skills", entry.name, "SKILL.md");
  } catch {
    /* no skills dir */
  }
  return direct; // let renderBootstrap produce the "not found" error
}

function parseArgs(argv) {
  const args = { root: process.cwd(), pluginName: "plugin-factory", harness: "claude" };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--root") args.root = argv[++i];
    else if (a === "--plugin-name") args.pluginName = argv[++i];
    else if (a === "--harness") args.harness = argv[++i];
    else if (a === "-h" || a === "--help") {
      console.log(
        "Usage: node scripts/render-bootstrap.mjs --root <dir> --plugin-name <name> [--harness claude|pi|opencode]",
      );
      process.exit(0);
    }
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const root = resolve(args.root);
  const entrySkillPath = await entrySkillPathFor(root, args.pluginName);
  let out;
  try {
    out = await renderBootstrap({ entrySkillPath, pluginName: args.pluginName });
  } catch (err) {
    console.error(`render-bootstrap: ${err.message}`);
    process.exit(2);
  }
  if (args.harness === "claude") {
    process.stdout.write(
      JSON.stringify({
        hookSpecificOutput: {
          hookEventName: "SessionStart",
          additionalContext: out.text,
        },
      }) + "\n",
    );
  } else {
    process.stdout.write(JSON.stringify({ marker: out.marker, text: out.text }, null, 2) + "\n");
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
