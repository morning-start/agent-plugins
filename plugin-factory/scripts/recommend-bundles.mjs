#!/usr/bin/env node
/**
 * recommend-bundles.mjs — Stage-1 deterministic bundle recommendation (BND-1).
 *
 * Given a directory of standalone skills, recommend which should be bundled
 * into one plugin and which should stay standalone. Deterministic,
 * zero-dependency: Jaccard similarity over trigger descriptions (skill name
 * weighted 2x, pipe words removed), then connected components above a
 * threshold become candidate bundles. Same input always yields the same
 * output — the LLM does only the qualitative Stage-2 review
 * (agents/bundle-advisor.md), never the grouping math.
 *
 * Threshold calibration (from references/bundling_heuristics.md):
 *   >= 0.40  high confidence, safe to bundle
 *   0.20-0.40  probably related, review suggested
 *   0.12-0.20  needs human/LLM review
 *   < 0.08  probably unrelated
 *
 * CLI:
 *   node scripts/recommend-bundles.mjs --root <dir> [--threshold 0.18] [--min-bundle 2] [--format table|json]
 *   node scripts/recommend-bundles.mjs --root <dir> --output-md report.md --output-json report.json
 *
 * Exit code: 0 always (informational; a no-bundle result is not an error).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { collectSkills, parseFrontmatter, keywordBag } from "./verify.mjs";

export const DEFAULT_THRESHOLD = 0.18;
export const DEFAULT_MIN_BUNDLE = 2;

/** Pipe words removed from the bag (skill/plugin/claude/invoke etc.). */
export const PIPE_WORDS = new Set([
  "skill", "skills", "plugin", "plugins", "claude", "codex", "opencode", "invoke",
  "invoked", "use", "using", "used", "when", "help", "create", "creating",
  "makes", "make", "the", "a", "an",
]);

/**
 * Multiset Jaccard over two keyword bags (frequencies matter — the name's
 * 2x weight survives, unlike set-based Jaccard which deduplicates away).
 * inter = sum(min(freqA[w], freqB[w])); union = sum(max(freqA[w], freqB[w])).
 */
export function multisetJaccard(a, b) {
  const freq = new Map();
  for (const w of a) freq.set(w, (freq.get(w) ?? 0) + 1);
  const freqB = new Map();
  for (const w of b) freqB.set(w, (freqB.get(w) ?? 0) + 1);
  let inter = 0;
  let union = 0;
  const all = new Set([...freq.keys(), ...freqB.keys()]);
  for (const w of all) {
    const fa = freq.get(w) ?? 0;
    const fb = freqB.get(w) ?? 0;
    inter += Math.min(fa, fb);
    union += Math.max(fa, fb);
  }
  return union === 0 ? 0 : inter / union;
}

/**
 * Keyword bag for one skill: name tokens duplicated (2x weight) and
 * hyphenated names split (git-commit -> git, commit), description tokens
 * once, pipe words and verify.mjs stopwords removed.
 * @returns {string[]}
 */
export function bagForSkill(name, description) {
  const nameBag = keywordBag(String(name || "").replace(/-/g, " "));
  const descBag = keywordBag(description || "");
  const bag = [...nameBag, ...nameBag, ...descBag]; // name weighted 2x
  return bag.filter((w) => !PIPE_WORDS.has(w));
}

/** Collect {name, description} for every skill under `<root>/skills/`. */
export async function skillsFromRoot(root) {
  const collected = await collectSkills(root);
  const out = [];
  for (const s of collected) {
    if (!s.text) continue;
    const fm = parseFrontmatter(s.text);
    if (!fm) continue;
    out.push({ name: s.dirName, description: fm.description ?? "" });
  }
  return out;
}

/**
 * Deterministic Stage-1 clustering: Jaccard edges above `threshold` form
 * connected components; components with >= `minBundle` members are bundles,
 * the rest are singletons.
 * @param {{name: string, description: string}[]} skills
 * @param {{threshold?: number, minBundle?: number}} [opts]
 * @returns {{bundles: {members: string[], maxSimilarity: number, avgSimilarity: number}[], singletons: {name: string, closest: string|null, closestSimilarity: number, reason: string}[], edges: {a: string, b: string, similarity: number}[], threshold: number, minBundle: number}}
 */
export function recommendBundles(skills, { threshold = DEFAULT_THRESHOLD, minBundle = DEFAULT_MIN_BUNDLE } = {}) {
  const n = skills.length;
  const bags = skills.map((s) => bagForSkill(s.name, s.description));
  const edges = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const sim = multisetJaccard(bags[i], bags[j]);
      if (sim >= threshold) {
        edges.push({ a: skills[i].name, b: skills[j].name, similarity: Math.round(sim * 1000) / 1000 });
      }
    }
  }

  // Connected components (union-find).
  const parent = Array.from({ length: n }, (_, i) => i);
  const find = (x) => (parent[x] === x ? x : (parent[x] = find(parent[x])));
  const union = (x, y) => (parent[find(x)] = find(y));
  for (const e of edges) {
    const i = skills.findIndex((s) => s.name === e.a);
    const j = skills.findIndex((s) => s.name === e.b);
    union(i, j);
  }
  const groups = new Map();
  for (let i = 0; i < n; i++) {
    const root = find(i);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root).push(i);
  }

  const bundles = [];
  const singletons = [];
  for (const [root, idxs] of groups) {
    const members = idxs.map((i) => skills[i].name).sort();
    if (idxs.length >= minBundle) {
      const sims = [];
      for (let a = 0; a < idxs.length; a++) {
        for (let b = a + 1; b < idxs.length; b++) {
          sims.push(multisetJaccard(bags[idxs[a]], bags[idxs[b]]));
        }
      }
      bundles.push({
        members,
        maxSimilarity: sims.length ? Math.round(Math.max(...sims) * 1000) / 1000 : 0,
        avgSimilarity: sims.length ? Math.round((sims.reduce((x, y) => x + y, 0) / sims.length) * 1000) / 1000 : 0,
      });
    } else {
      for (const i of idxs) {
        let closest = null;
        let closestSim = 0;
        for (let j = 0; j < n; j++) {
          if (j === i) continue;
          const sim = multisetJaccard(bags[i], bags[j]);
          if (sim > closestSim) {
            closestSim = sim;
            closest = skills[j].name;
          }
        }
        singletons.push({
          name: skills[i].name,
          closest,
          closestSimilarity: Math.round(closestSim * 1000) / 1000,
          reason: closest
            ? `Closest neighbor "${closest}" at ${Math.round(closestSim * 1000) / 1000}, below threshold ${threshold}.`
            : "No other skills to compare against.",
        });
      }
    }
  }

  return {
    bundles: bundles.sort((a, b) => b.maxSimilarity - a.maxSimilarity),
    singletons: singletons.sort((a, b) => b.closestSimilarity - a.closestSimilarity),
    edges,
    threshold,
    minBundle,
  };
}

/** Render the bundle report as Markdown (threshold table + bundles + singletons). */
export function renderBundleMarkdown(result) {
  const lines = [];
  lines.push("# Bundle Recommendation Report");
  lines.push("");
  lines.push(`Threshold: ${result.threshold} · Min bundle size: ${result.minBundle} · Skills analyzed: ${result.bundles.reduce((a, b) => a + b.members.length, 0) + result.singletons.length}`);
  lines.push("");
  lines.push("| Jaccard | Meaning |");
  lines.push("|---------|---------|");
  lines.push("| ≥ 0.40 | High confidence, safe to bundle |");
  lines.push("| 0.20 – 0.40 | Probably related, review suggested |");
  lines.push("| 0.12 – 0.20 | Needs human/LLM review |");
  lines.push("| < 0.08 | Probably unrelated |");
  lines.push("");
  if (result.bundles.length > 0) {
    lines.push("## Candidate bundles (Stage-1 heuristic)");
    lines.push("");
    lines.push("| Members | Max similarity | Avg similarity |");
    lines.push("|---------|----------------|----------------|");
    for (const b of result.bundles) {
      lines.push(`| ${b.members.join(", ")} | ${b.maxSimilarity} | ${b.avgSimilarity} |`);
    }
  } else {
    lines.push("## Candidate bundles");
    lines.push("");
    lines.push("_None — no skills met the similarity threshold._");
  }
  lines.push("");
  if (result.singletons.length > 0) {
    lines.push("## Singletons (stay standalone or review)");
    lines.push("");
    lines.push("| Skill | Closest neighbor | Similarity | Reason |");
    lines.push("|-------|------------------|------------|--------|");
    for (const s of result.singletons) {
      lines.push(`| ${s.name} | ${s.closest ?? "—"} | ${s.closestSimilarity} | ${s.reason} |`);
    }
  }
  lines.push("");
  lines.push("> Stage 2: feed this report's JSON to the `bundle-advisor` subagent for qualitative review (accept/split/merge/reject).");
  return lines.join("\n");
}

function parseArgs(argv) {
  const args = { root: process.cwd(), threshold: DEFAULT_THRESHOLD, minBundle: DEFAULT_MIN_BUNDLE, format: "table", outputMd: null, outputJson: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--root") args.root = argv[++i];
    else if (a === "--threshold") args.threshold = Number(argv[++i]);
    else if (a === "--min-bundle") args.minBundle = Number(argv[++i]);
    else if (a === "--format") args.format = argv[++i];
    else if (a === "--output-md") args.outputMd = argv[++i];
    else if (a === "--output-json") args.outputJson = argv[++i];
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const skills = await skillsFromRoot(args.root);
  const result = recommendBundles(skills, { threshold: args.threshold, minBundle: args.minBundle });
  if (args.outputMd) {
    writeFileSync(args.outputMd, renderBundleMarkdown(result), "utf8");
  }
  if (args.outputJson) {
    writeFileSync(args.outputJson, JSON.stringify(result, null, 2), "utf8");
  }
  if (args.format === "json") {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(renderBundleMarkdown(result));
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
