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
import { pathToFileURL } from "node:url";

/**
 * Routing table — mirrors using-pf's Skill Priority + Trigger Matrix.
 * First match wins (the using-pf priority rule). Order matters: more specific
 * routes (S9 release) come before broad catch-alls.
 */
const ROUTES = [
  {
    scenario: "S9",
    skill: "/pf-release",
    path: "verify -> pf-git version bump -> release",
    keywords: ["release", "bump version", "bump", "tag it", "发布", "升版本", "打标签", "发版"],
  },
  {
    scenario: "S1",
    skill: "pf-intent (Full)",
    path: "new plugin, no signed-off PRD",
    keywords: ["create a plugin", "new plugin", "i have an idea", "make a plugin", "做一个插件", "创建一个插件", "创建插件", "插件想法", "新插件", "写一个插件"],
  },
  {
    scenario: "S2",
    skill: "pf-intent (Change)",
    path: "add a skill -> design/build -> verify -> release",
    keywords: ["add a skill", "add skill", "加个技能", "新增技能", "加技能"],
  },
  {
    scenario: "S3",
    skill: "pf-intent (Change, light)",
    path: "improve -> build -> verify -> release",
    keywords: ["improve", "improve a skill", "优化技能", "改进技能", "优化"],
  },
  {
    scenario: "S4",
    skill: "pf-analyze",
    path: "split/merge/reorganize -> design -> build -> verify -> release",
    keywords: ["split", "merge", "reorganize", "拆分", "合并", "重组"],
  },
  {
    scenario: "S5",
    skill: "pf-analyze (confirm)",
    path: "confirm retire -> build (remove) -> verify -> release",
    keywords: ["retire", "remove this skill", "remove skill", "退役", "删掉这个技能", "删除技能", "移除技能"],
  },
  {
    scenario: "S6",
    skill: "pf-design (adapters)",
    path: "port harness -> build -> verify -> release",
    keywords: ["port", "add opencode", "add pi", "add a harness", "移植", "加个平台", "新平台", "支持 opencode", "支持 pi"],
  },
  {
    scenario: "S7",
    skill: "pf-design (orchestration)",
    path: "orchestration tweak -> build -> verify -> release",
    keywords: ["orchestration", "rework orchestration", "entry point", "改编排", "换入口", "编排"],
  },
  {
    scenario: "S8",
    skill: "pf-build (fix)",
    path: "config/dependency fix -> verify -> release",
    keywords: ["fix config", "fix hooks", "fix hook", "fix dependency", "修配置", "修 hook", "修复配置", "修 hook 配置"],
  },
  {
    scenario: "S10",
    skill: "pf-analyze",
    path: "lifecycle health -> recommendations -> route to S4/S5/S7",
    keywords: ["analyze", "health", "what should evolve", "分析", "健康检查", "演进", "该演进了"],
  },
  {
    scenario: null,
    skill: null,
    path: "answer directly; no scenario",
    keywords: ["how does", "how do i", "what is", "怎么用", "怎么用", "是什么", "一般提问"],
  },
];

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
