#!/usr/bin/env node
/**
 * evals.mjs — eval result recording (X-2).
 *
 * Wires `evals/` into the workflow: `recordEval()` appends a per-skill eval
 * result to `evals/evals.json` (a `results` section keyed by skill -> eval
 * name), so skill-creator / pf-build eval outcomes are captured instead of
 * living only in conversation. `evalCoverage()` reports how many declared
 * evals have a recorded result (feeds pf-verify's advisory check and the v2
 * `eval-pass-rate` signal).
 *
 * CLI:
 *   node scripts/evals.mjs record --skill <name> --name <eval-name> --passed <true|false> [--notes <text>]
 *   node scripts/evals.mjs check  [--root <dir>]
 *
 * Exit code: 0 always for record; check exits 1 when declared evals lack
 * recorded results (advisory — never a release blocker by itself).
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";

/** Location of the eval file under `root`. */
export function evalsPath(root) {
  return join(root, "evals", "evals.json");
}

/** Read the eval file; returns an empty doc when absent or unparsable. */
export async function readEvals(root) {
  try {
    const parsed = JSON.parse(await readFile(evalsPath(root), "utf8"));
    if (!parsed.results) parsed.results = {};
    return parsed;
  } catch {
    return { evals: [], results: {} };
  }
}

/**
 * Record one eval result for a skill. Preserves the whole document; only the
 * `results.<skill>.<name>` entry is touched. Rewrites the file deterministically.
 * @param {string} root - project root (evals/evals.json lives here).
 * @param {{skill: string, name: string, passed: boolean, notes?: string}} entry
 * @returns {Promise<object>} the stored result entry.
 */
export async function recordEval(root, { skill, name, passed, notes = "" }) {
  const doc = await readEvals(root);
  doc.results[skill] = doc.results[skill] ?? {};
  doc.results[skill][name] = {
    passed: Boolean(passed),
    date: new Date().toISOString().slice(0, 10),
    notes,
  };
  await mkdir(dirname(evalsPath(root)), { recursive: true });
  await writeFile(evalsPath(root), JSON.stringify(doc, null, 2) + "\n", "utf8");
  return doc.results[skill][name];
}

/**
 * Coverage of declared evals by recorded results.
 * @param {object} doc - parsed evals.json.
 * @returns {{total: number, recorded: number, uncovered: string[]}}
 */
export function evalCoverage(doc) {
  const names = (doc.evals ?? []).map((e) => e.name);
  const recorded = new Set(Object.values(doc.results ?? {}).flatMap((m) => Object.keys(m)));
  return {
    total: names.length,
    recorded: names.filter((n) => recorded.has(n)).length,
    uncovered: names.filter((n) => !recorded.has(n)),
  };
}

function usage() {
  console.error(
    [
      "Usage:",
      "  node scripts/evals.mjs record --skill <name> --name <eval-name> --passed <true|false> [--notes <text>]",
      "  node scripts/evals.mjs check [--root <dir>]",
    ].join("\n"),
  );
}

async function main() {
  const argv = process.argv.slice(2);
  const cmd = argv[0];
  const root = argv.includes("--root") ? argv[argv.indexOf("--root") + 1] : process.cwd();
  if (cmd === "record") {
    const skill = argv.includes("--skill") ? argv[argv.indexOf("--skill") + 1] : null;
    const name = argv.includes("--name") ? argv[argv.indexOf("--name") + 1] : null;
    const passed = argv.includes("--passed") ? argv[argv.indexOf("--passed") + 1] === "true" : null;
    const notes = argv.includes("--notes") ? argv[argv.indexOf("--notes") + 1] : "";
    if (!skill || !name || passed === null) {
      usage();
      process.exit(2);
    }
    const stored = await recordEval(root, { skill, name, passed, notes });
    console.log(`Recorded eval ${skill}/${name}: passed=${stored.passed}`);
  } else if (cmd === "check") {
    const doc = await readEvals(root);
    const c = evalCoverage(doc);
    console.log(`Eval coverage: ${c.recorded}/${c.total} recorded`);
    for (const u of c.uncovered) console.log(`  UNRECORDED: ${u}`);
    process.exit(c.uncovered.length > 0 ? 1 : 0);
  } else {
    usage();
    process.exit(2);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
