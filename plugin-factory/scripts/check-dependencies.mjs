#!/usr/bin/env node
/**
 * check-dependencies.mjs — cross-skill dependency analysis (LIF-5).
 *
 * Builds the handoff/chain dependency graph between skills (A references B when
 * A's body routes/hands off to B) and reports the impact of lifecycle state:
 * when skill B is `deprecated` or `retired`, every skill A that depends on B
 * gets a WARN — the dependent must be updated before B is cleaned up.
 *
 * Reuses verify.mjs's `collectSkills` and `collectSkillRefs` — the same handoff
 * patterns that drive `broken-handoff` also drive this probe, so the two can
 * never disagree about what counts as a reference.
 *
 * CLI:
 *   node scripts/check-dependencies.mjs [--root <dir>] [--format table|json]
 *
 * Exit code: 1 when any WARN finding exists (deprecated/retired dependents),
 * otherwise 0.
 */
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { collectSkills, collectSkillRefs, LIFECYCLE_STATUS_RE } from "./verify.mjs";

/**
 * Build the dependency graph: for every skill, the set of skills it references.
 * @param {{name: string, text: string|null, rel: string}[]} skills - from collectSkills.
 * @returns {Map<string, string[]>} name -> referenced skill names (existing only).
 */
export function buildDependencyGraph(skills) {
  const names = new Set(skills.map((s) => s.dirName));
  const graph = new Map();
  for (const s of skills) {
    if (!s.text) continue;
    const refs = collectSkillRefs(s.text).filter((r) => names.has(r));
    graph.set(s.dirName, refs);
  }
  return graph;
}

/**
 * Find dependents of lifecycle-endangered skills.
 * @param {{name: string, text: string|null, rel: string}[]} skills
 * @returns {{dependent: string, target: string, status: string}[]}
 *   For every skill `target` whose lifecycle.status is deprecated/retired,
 *   every skill that references it.
 */
export function endangeredDependents(skills) {
  const statusOf = new Map();
  for (const s of skills) {
    if (!s.text) continue;
    const m = LIFECYCLE_STATUS_RE.exec(s.text);
    if (m) statusOf.set(s.dirName, m[1]);
  }
  const graph = buildDependencyGraph(skills);
  const hits = [];
  for (const [dependent, refs] of graph) {
    for (const target of refs) {
      const status = statusOf.get(target);
      if (status === "deprecated" || status === "retired") {
        hits.push({ dependent, target, status });
      }
    }
  }
  return hits;
}

/**
 * Run the dependency check against a plugin root.
 * @param {string} root
 * @returns {Promise<{root: string, findings: object[], graph: Record<string, string[]>}>}
 */
export async function checkDependencies(root) {
  const skills = await collectSkills(root);
  const graph = buildDependencyGraph(skills);
  const findings = [];
  for (const { dependent, target, status } of endangeredDependents(skills)) {
    findings.push({
      signal: "endangered-dependency",
      file: `skills/${dependent}/SKILL.md`,
      severity: "WARN",
      action: `Update ${dependent} to stop routing to ${target} (now ${status}), or keep ${target} until the chain is reworked.`,
      impact: `${dependent} depends on ${target}, which is ${status}.`,
    });
  }
  const graphObj = Object.fromEntries([...graph.entries()].map(([k, v]) => [k, [...v]]));
  return { root, findings, graph: graphObj };
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
    result = await checkDependencies(args.root);
  } catch (err) {
    console.error(`check-dependencies: failed: ${err.message}`);
    process.exit(2);
  }
  if (args.format === "json") {
    console.log(JSON.stringify(result, null, 2));
  } else {
    if (result.findings.length === 0) {
      console.log("No endangered dependencies (no dependent routes to a deprecated/retired skill).");
    } else {
      console.log("SEVERITY\tSIGNAL\tFILE\tACTION");
      for (const f of result.findings) console.log(`${f.severity}\t${f.signal}\t${f.file}\t${f.action}`);
    }
  }
  process.exit(result.findings.length > 0 ? 1 : 0);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
