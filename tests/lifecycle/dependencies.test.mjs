// tests/lifecycle/dependencies.test.mjs
// T-LIF-5 contract tests for cross-skill dependency analysis
// (scripts/check-dependencies.mjs).
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  buildDependencyGraph,
  endangeredDependents,
  checkDependencies,
} from "../../scripts/check-dependencies.mjs";

async function withTemp(fn) {
  const dir = await mkdtemp(join(tmpdir(), "pf-deps-"));
  try {
    return await fn(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

const skill = (name, body, status = "active") =>
  `---\nname: ${name}\ndescription: Use when ${name}.\nmetadata:\n  lifecycle:\n    status: ${status}\n    version: 0.1.0\n---\n${body}`;

async function writeSkill(root, name, text) {
  await mkdir(join(root, "skills", name), { recursive: true });
  await writeFile(join(root, "skills", name, "SKILL.md"), text, "utf8");
}

const SKILLS = [
  {
    dirName: "using-app",
    rel: "using-app/",
    text: skill("using-app", "After this, route to pf-intent."),
  },
  {
    dirName: "alpha",
    rel: "alpha/",
    text: skill("alpha", "After this, route to beta.", "active"),
  },
  {
    dirName: "beta",
    rel: "beta/",
    text: skill("beta", "Legacy flow.", "deprecated"),
  },
  {
    dirName: "gamma",
    rel: "gamma/",
    text: skill("gamma", "After this, route to missing-skill.", "active"),
  },
];

test("buildDependencyGraph maps handoff references between existing skills", () => {
  const graph = buildDependencyGraph(SKILLS);
  assert.deepEqual(graph.get("alpha"), ["beta"]);
  // gamma's reference to missing-skill is dropped (not an existing skill)
  assert.deepEqual(graph.get("gamma"), []);
  assert.deepEqual(graph.get("using-app"), []); // pf-* is a convention ref, not a local skill
});

test("endangeredDependents reports dependents of deprecated/retired skills", () => {
  const hits = endangeredDependents(SKILLS);
  assert.equal(hits.length, 1);
  assert.deepEqual(hits[0], { dependent: "alpha", target: "beta", status: "deprecated" });
});

test("checkDependencies emits WARN findings with stable shape", async () => {
  await withTemp(async (dir) => {
    await writeSkill(dir, "using-app", skill("using-app", "After this, route to pf-intent."));
    await writeSkill(dir, "alpha", skill("alpha", "After this, route to beta."));
    await writeSkill(dir, "beta", skill("beta", "Legacy flow.", "deprecated"));
    const { root, findings, graph } = await checkDependencies(dir);
    assert.equal(root, dir);
    assert.equal(findings.length, 1);
    assert.equal(findings[0].signal, "endangered-dependency");
    assert.equal(findings[0].severity, "WARN");
    assert.equal(findings[0].file, "skills/alpha/SKILL.md");
    assert.match(findings[0].action, /beta/);
    assert.deepEqual(graph["alpha"], ["beta"]);
  });
});

test("no findings when no dependent routes to an endangered skill", async () => {
  await withTemp(async (dir) => {
    await writeSkill(dir, "alpha", skill("alpha", "After this, route to beta."));
    await writeSkill(dir, "beta", skill("beta", "Alive and well.")); // active
    const { findings } = await checkDependencies(dir);
    assert.deepEqual(findings, []);
  });
});

test("retired skills also warn their dependents", async () => {
  await withTemp(async (dir) => {
    await writeSkill(dir, "alpha", skill("alpha", "After this, route to beta."));
    await writeSkill(dir, "beta", skill("beta", "Gone.", "retired"));
    const { findings } = await checkDependencies(dir);
    assert.equal(findings.length, 1);
    assert.equal(findings[0].impact.includes("retired"), true);
  });
});
