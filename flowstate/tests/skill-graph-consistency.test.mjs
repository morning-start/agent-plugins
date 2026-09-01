// tests/skill-graph-consistency.test.mjs
// Guards the orchestration graph as a single source of truth.
// The canonical graph is references/skill-graph.md; each SKILL.md frontmatter
// (owns / handoffs_to / handoffs_from / layer) is a machine-readable digest that
// MUST agree with it. This test fails on drift so the graph is edited once, not
// hand-copied into 8 SKILL files.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// ---- skills and the layer each frontmatter must declare -------------------
const SKILLS = {
  "using-fst": { layer: "entry", owns: ["routing"] },
  "fst-init": { layer: "lifecycle", owns: ["N1", "N2", "N3"] },
  "fst-change": { layer: "lifecycle", owns: ["N5", "N9"] },
  "fst-review": { layer: "lifecycle", owns: ["N6", "N7"] },
  "fst-iterate": { layer: "lifecycle", owns: ["N4", "N8", "execution"] },
  "fst-workplace": { layer: "cross-cutting", owns: ["workspace", "placement", "checkpoint"] },
  "fst-research": { layer: "cross-cutting", owns: ["evidence", "analysis"] },
  "fst-promote": { layer: "cross-cutting", owns: ["promotion-gate", "HITL"] },
};

// canonical edges, derived from skill-graph.md "边契约" table
const EDGES = [
  ["using-fst", "fst-init"],
  ["using-fst", "fst-change"],
  ["using-fst", "fst-iterate"],
  ["using-fst", "fst-review"],
  ["fst-init", "fst-iterate"],
  ["fst-change", "fst-iterate"],
  ["fst-iterate", "fst-review"],
  ["fst-review", "fst-iterate"],
  ["fst-change", "fst-review"], // N9 hotfix
];

// handoff targets that are allowed from/for any skill without an explicit edge
const CROSS_CUTTING = ["fst-workplace", "fst-research", "fst-promote"];
const PLACEHOLDERS = ["caller", "docs", "all"];
const EDGE_SET = new Set(EDGES.map(([a, b]) => `${a}->${b}`));

const SKILL_NAMES = Object.keys(SKILLS);

function parseArrayField(text, field) {
  const re = new RegExp(`${field}:\\s*\\[([^\\]]*)\\]`);
  const m = text.match(re);
  if (!m) return null;
  return m[1]
    .split(",")
    .map((s) => s.trim().replace(/`/g, ""))
    .filter(Boolean);
}

// parse the graph's responsibility matrix into { node: "N1" -> skill }
function parseNodeOwners(graph) {
  const matrix = graph.slice(
    graph.indexOf("## 生命周期职责矩阵"),
    graph.indexOf("## 边契约"),
  );
  const owners = {};
  for (const line of matrix.split("\n")) {
    // skill names are kebab-cased (fst-init), so match [\w-]+; allow an
    // annotation after the backtick cell (e.g. "`fst-change`（紧急例外）").
    const m = line.match(/^\|\s*(N[\d~N\-]+)\s*\|\s*`([\w-]+)`[^|]*\|/);
    if (!m) continue;
    // node labels are "N4" or ranges "N1~N3"; allow an optional N before the
    // range's upper bound (e.g. "N1~N3"). Expand to N1, N2, N3.
    const mn = m[1].match(/N(\d+)(?:~N?(\d+))?/);
    if (!mn) continue;
    const lo = Number(mn[1]);
    const hi = mn[2] ? Number(mn[2]) : lo;
    for (let n = lo; n <= hi; n++) owners[`N${n}`] = m[2];
  }
  return owners;
}

test("skill-graph.md lists every skill (graph is the only source)", async () => {
  const graph = await readFile(join(ROOT, "references", "skill-graph.md"), "utf8");
  const table = graph.slice(graph.indexOf("## 技能全表"));
  for (const name of SKILL_NAMES) {
    assert.ok(table.includes(`\`${name}\``), `skill-graph.md missing skill ${name}`);
  }
});

test("node ownership matrix in skill-graph matches frontmatter owns", async () => {
  const graph = await readFile(join(ROOT, "references", "skill-graph.md"), "utf8");
  const nodeOwners = parseNodeOwners(graph);
  for (const [name, { owns }] of Object.entries(SKILLS)) {
    const skill = await readFile(join(ROOT, "skills", name, "SKILL.md"), "utf8");
    const frontmatterOwns = parseArrayField(skill, "owns") ?? [];
    assert.deepEqual(
      [...frontmatterOwns].sort(),
      [...owns].sort(),
      `${name} frontmatter owns drifted from skill-graph`,
    );
    // every node-owned skill must own exactly the nodes the matrix assigns it
    const expectedNodes = Object.entries(nodeOwners)
      .filter(([, s]) => s === name)
      .map(([n]) => n);
    for (const n of expectedNodes) {
      assert.ok(frontmatterOwns.includes(n), `${name} should own ${n} (matrix) but frontmatter lacks it`);
    }
    for (const n of frontmatterOwns) {
      if (!/^N\d+$/.test(n)) continue; // capability words, not graph nodes
      assert.equal(nodeOwners[n], name, `node ${n} owned by ${nodeOwners[n]} in graph, not ${name}`);
    }
  }
});

test("edge table in skill-graph agrees with frontmatter handoffs_to", async () => {
  const skillNamesSet = new Set(SKILL_NAMES);
  for (const name of Object.keys(SKILLS)) {
    const skill = await readFile(join(ROOT, "skills", name, "SKILL.md"), "utf8");
    const handoffsTo = parseArrayField(skill, "handoffs_to") ?? [];
    for (const to of handoffsTo) {
      // allowed: canonical edge, or a cross-cutting/placeholder target callable by anyone
      if (CROSS_CUTTING.includes(to) || PLACEHOLDERS.includes(to)) continue;
      assert.ok(
        skillNamesSet.has(to),
        `${name} declares unknown handoff target ${to}`,
      );
      assert.ok(
        EDGE_SET.has(`${name}->${to}`),
        `${name} handoff to ${to} is not a canonical edge in skill-graph.md`,
      );
    }
    // every canonical edge OUT of this skill must be declared in frontmatter
    for (const [from, to] of EDGES) {
      if (from !== name) continue;
      assert.ok(
        handoffsTo.includes(to),
        `${name} missing canonical handoff to ${to}`,
      );
    }
  }
});

test("frontmatter layer is consistent with graph classification", async () => {
  for (const [name, { layer }] of Object.entries(SKILLS)) {
    const skill = await readFile(join(ROOT, "skills", name, "SKILL.md"), "utf8");
    const m = skill.match(/layer:\s*(entry|lifecycle|cross-cutting)/);
    assert.ok(m, `${name} must declare a layer`);
    assert.equal(m[1], layer, `${name} layer ${m[1]} != expected ${layer}`);
  }
});