#!/usr/bin/env node
/**
 * route-intent.mjs — intent routing core (ENT-1).
 *
 * Replaces the manual routing judgment in using-pf with a deterministic
 * `routeIntent()` function: natural-language input -> match the skill priority /
 * trigger tables -> output target scenario + routing evidence.
 *
 * CLI:
 *   node scripts/route-intent.mjs "创建插件"
 *   node scripts/route-intent.mjs "add a skill to an existing plugin"
 *   node scripts/route-intent.mjs "how does X work"
 *
 * Exit code: 0 always (informational; a no-match is not an error).
 */
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

/**
 * Routing table — single source of truth is scripts/routing-table.json.
 * First match wins (the using-pf priority rule). Order in the JSON matters:
 * more specific routes (S9 release) come before broad catch-alls.
 * The Skill Priority + Trigger Matrix tables in skills/using-pf/SKILL.md are
 * rendered from the same JSON by scripts/render-routing.mjs — never edit the
 * two independently (scripts/verify.mjs fails on drift).
 */
const ROUTES = JSON.parse(
  readFileSync(new URL("./routing-table.json", import.meta.url), "utf8"),
).routes.map((r) => ({
  scenario: r.scenario,
  skill: r.skill,
  path: r.path,
  keywords: r.keywords,
}));

/** Lowercase, collapse whitespace, keep CJK as-is. */
function normalize(text) {
  return String(text || "").toLowerCase().replace(/\s+/g, " ").trim();
}

/**
 * Route a natural-language intent to a pf-* scenario.
 * @param {string} text - user intent (EN or zh).
 * @returns {{matched: boolean, scenario: string|null, skill: string|null, path: string|null, evidence: string[]}}
 *   `evidence` lists the keywords that matched (routing evidence).
 */
export function routeIntent(text) {
  const input = normalize(text);
  if (!input) return { matched: false, scenario: null, skill: null, path: null, evidence: [] };
  for (const route of ROUTES) {
    const hit = route.keywords.find((k) => input.includes(k));
    if (hit) {
      return {
        matched: true,
        scenario: route.scenario,
        skill: route.skill,
        path: route.path,
        evidence: [hit],
      };
    }
  }
  return { matched: false, scenario: null, skill: null, path: null, evidence: [] };
}

function usage() {
  console.log("Usage: node scripts/route-intent.mjs <intent text>");
}

async function main() {
  const text = process.argv.slice(2).join(" ");
  if (!text) {
    usage();
    process.exit(2);
  }
  const r = routeIntent(text);
  if (!r.matched) {
    console.log("No scenario matches. Suggest creating a scenario request (ENT-2 fallback).");
    process.exit(0);
  }
  console.log(`Scenario: ${r.scenario ?? "(none)"}`);
  console.log(`Skill:    ${r.skill ?? "(answer directly)"}`);
  console.log(`Path:     ${r.path}`);
  console.log(`Evidence: ${r.evidence.join(", ")}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
