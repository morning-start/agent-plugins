// scripts/routing-render.mjs — pure table renderers for the pf routing table.
//
// Single source of truth: scripts/routing-table.json.
// - scripts/render-routing.mjs (CLI) rewrites skills/using-pf/SKILL.md from it.
// - scripts/verify.mjs runs a drift check against it.
// Never embed routing data in skill bodies or other scripts — edit the JSON,
// then re-render. First-match-wins order is the JSON array order (S9 before
// the broad catch-alls); tables render in scenario order (S1…S10, fallback last).

/** Sort key: S1..S10 numerically; fallback (scenario === null) goes last. */
export function scenarioSortKey(route) {
  if (route.scenario === null) return Number.MAX_SAFE_INTEGER;
  const n = Number(route.scenario.slice(1));
  return Number.isNaN(n) ? Number.MAX_SAFE_INTEGER : n;
}

/** Skill Priority table — one row per `priority` entry, in scenario order. */
export function renderPriorityTable(routes) {
  const sorted = [...routes].sort((a, b) => scenarioSortKey(a) - scenarioSortKey(b));
  const lines = ["| Intent / state | Route |", "|----------------|-------|"];
  for (const r of sorted) {
    for (const p of r.priority || []) {
      lines.push(`| ${p.intent} | ${p.route} |`);
    }
  }
  return lines.join("\n");
}

/** Trigger Matrix — one row per distinct trigger (S2/S3 share a row). */
export function renderTriggerTable(routes) {
  const sorted = [...routes].sort((a, b) => scenarioSortKey(a) - scenarioSortKey(b));
  const lines = ["| User says (EN) | 用户说（中文） | Route |", "|----------------|----------------|-------|"];
  const seen = new Set();
  for (const r of sorted) {
    const t = r.trigger;
    if (!t) continue;
    const key = `${t.en}|${t.zh}|${t.route}`;
    if (seen.has(key)) continue;
    seen.add(key);
    lines.push(`| ${t.en} | ${t.zh} | ${t.route} |`);
  }
  return lines.join("\n");
}

/** Render both tables from a parsed routing-table.json object. */
export function renderRoutingTables(json) {
  const routes = json.routes || [];
  return {
    priority: renderPriorityTable(routes),
    trigger: renderTriggerTable(routes),
  };
}
