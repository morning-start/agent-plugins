#!/usr/bin/env node
/**
 * check-creator.mjs — skill-creator availability gate (BLD-1).
 *
 * Replaces the manual availability check in pf-build with a deterministic
 * `checkCreator()` function. Detects the two accepted install forms:
 *   - global:  ~/.pi/agent/skills/skill-creator  (os.homedir()-based)
 *   - local:   <root>/.agents/skills/skill-creator  (+ <root>/skills-lock.json)
 *
 * CLI:
 *   node scripts/check-creator.mjs [--root <dir>] [--format table|json]
 *
 * Exit code: 0 when available, 1 when missing (never auto-installs).
 */
import { stat } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

/** Candidate install locations in priority order. */
export function creatorCandidates(root, home = homedir()) {
  return [
    { type: "global", path: join(home, ".pi", "agent", "skills", "skill-creator") },
    { type: "local", path: join(root, ".agents", "skills", "skill-creator") },
  ];
}

async function exists(p) {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check whether skill-creator is available (either accepted install form).
 * A local install additionally requires the tracked `skills-lock.json` marker
 * at the repo root (the vendor dir itself is gitignored).
 * @param {string} root - project root to check for the local install.
 * @param {{home?: string}} [opts] - override the global install root (tests).
 * @returns {Promise<{available: boolean, found: {type: string, path: string}[], hint: string}>}
 */
export async function checkCreator(root, { home } = {}) {
  const found = [];
  for (const c of creatorCandidates(root, home)) {
    const skillFile = join(c.path, "SKILL.md");
    if (await exists(skillFile)) {
      if (c.type === "local" && !(await exists(join(root, "skills-lock.json")))) {
        continue; // vendor dir present without its lock marker — not a tracked install
      }
      found.push({ type: c.type, path: c.path });
    }
  }
  return {
    available: found.length > 0,
    found,
    hint:
      "Install it yourself (never auto-install): npx skills add https://github.com/anthropics/skills --skill skill-creator",
  };
}

function parseArgs(argv) {
  const args = { root: process.cwd(), format: "table" };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--root") args.root = argv[++i];
    else if (a === "--format") args.format = argv[++i];
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  let result;
  try {
    result = await checkCreator(args.root);
  } catch (err) {
    console.error(`check-creator: failed: ${err.message}`);
    process.exit(2);
  }
  if (args.format === "json") {
    console.log(JSON.stringify(result, null, 2));
  } else if (result.available) {
    console.log(`skill-creator available (${result.found.map((f) => `${f.type}:${f.path}`).join(", ")})`);
  } else {
    console.log("skill-creator NOT available.");
    console.log(result.hint);
  }
  process.exit(result.available ? 0 : 1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
