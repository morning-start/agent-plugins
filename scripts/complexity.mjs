#!/usr/bin/env node
/**
 * complexity.mjs — complexity-gate core (INT-2).
 *
 * Replaces the manual score table in pf-intent with a deterministic
 * `scoreComplexity()` function. Accepts the complexity signals collected in the
 * interview (skill count, hooks, harness count, rules/agents, cross-scenario)
 * and returns { score, verdict, path, signals }.
 *
 * CLI:
 *   node scripts/complexity.mjs --skills 3 --hooks --harnesses 2 --rules
 *   node scripts/complexity.mjs --cross-scenario
 *
 * Exit code: 0 always (informational; the verdict is not an error).
 */
import { pathToFileURL } from "node:url";

/**
 * Score the plugin complexity per the pf-intent gate table.
 * @param {{skills?: number, hooks?: boolean, harnesses?: number, rules?: boolean, crossScenario?: boolean}} [opts]
 * @returns {{score: number, verdict: "light"|"medium"|"heavy"|"split", path: string, signals: string[]}}
 *
 * Scoring (mirrors the pf-intent table):
 *   more than 2 skills          +1 per extra skill
 *   hooks required              +2
 *   extra harness beyond first  +1 each
 *   rules / agents / subagents  +1
 *   cross-scenario (>=3 cats)   +5 -> split into multiple plugins
 *
 * Verdict: 0-1 Light -> direct pf-build; 2-4 Medium -> full path;
 * 5+ Heavy -> full path + ADR; cross-scenario -> split (Iron Law 5).
 */
export function scoreComplexity({
  skills = 1,
  hooks = false,
  harnesses = 1,
  rules = false,
  crossScenario = false,
} = {}) {
  const signals = [];

  if (crossScenario) {
    return {
      score: 5,
      verdict: "split",
      path: "split into separate plugins, each through its own S1 creation",
      signals: ["cross-scenario (>=3 unrelated categories) -> +5, split"],
    };
  }

  let score = 0;
  if (skills > 2) {
    const extra = skills - 2;
    score += extra;
    signals.push(`more than 2 skills (${skills}) -> +${extra}`);
  }
  if (hooks) {
    score += 2;
    signals.push("hooks required -> +2");
  }
  if (harnesses > 1) {
    const extra = harnesses - 1;
    score += extra;
    signals.push(`extra harness beyond the first (${harnesses}) -> +${extra}`);
  }
  if (rules) {
    score += 1;
    signals.push("rules / agents / subagents needed -> +1");
  }

  let verdict;
  let path;
  if (score <= 1) {
    verdict = "light";
    path = "direct path -> pf-build (skip design)";
  } else if (score <= 4) {
    verdict = "medium";
    path = "full path -> pf-design -> pf-build -> pf-verify";
  } else {
    verdict = "heavy";
    path = "full path + explicit ADR in pf-design";
  }

  return { score, verdict, path, signals };
}

function parseArgs(argv) {
  const args = { skills: 1, hooks: false, harnesses: 1, rules: false, crossScenario: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--skills") args.skills = Number(argv[++i]);
    else if (a === "--harnesses") args.harnesses = Number(argv[++i]);
    else if (a === "--hooks") args.hooks = true;
    else if (a === "--rules") args.rules = true;
    else if (a === "--cross-scenario") args.crossScenario = true;
    else if (a === "--help" || a === "-h") args.help = true;
  }
  return args;
}

function usage() {
  console.log(
    "Usage: node scripts/complexity.mjs [--skills N] [--hooks] [--harnesses N] [--rules] [--cross-scenario]",
  );
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    process.exit(0);
  }
  const r = scoreComplexity(args);
  console.log(`Score:   ${r.score}`);
  console.log(`Verdict: ${r.verdict}`);
  console.log(`Path:    ${r.path}`);
  for (const s of r.signals) console.log(`  signal: ${s}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
