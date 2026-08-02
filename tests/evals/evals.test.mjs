// tests/evals/evals.test.mjs
// T-X-2 contract tests for eval result recording (scripts/evals.mjs).
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { evalsPath, readEvals, recordEval, evalCoverage } from "../../scripts/evals.mjs";

async function seedEvals(dir, doc) {
  await mkdir(dirname(evalsPath(dir)), { recursive: true });
  await writeFile(evalsPath(dir), JSON.stringify(doc, null, 2), "utf8");
}

async function withTemp(fn) {
  const dir = await mkdtemp(join(tmpdir(), "pf-evals-"));
  try {
    return await fn(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

const DOC = {
  skill_name: "using-pf-routing",
  description: "Routing evals.",
  evals: [
    { id: 1, name: "new-plugin-idea", should_trigger: true, skills: ["pf-intent"] },
    { id: 2, name: "non-plugin-question", should_trigger: false, skills: [] },
  ],
};

test("recordEval writes into evals/evals.json and preserves the doc", async () => {
  await withTemp(async (dir) => {
    await seedEvals(dir, DOC);
    const stored = await recordEval(dir, {
      skill: "using-pf-routing",
      name: "new-plugin-idea",
      passed: true,
      notes: "routes to S1 Full",
    });
    assert.equal(stored.passed, true);
    assert.match(stored.date, /^\d{4}-\d{2}-\d{2}$/);
    const doc = await readEvals(dir);
    assert.equal(doc.evals.length, 2, "declared evals untouched");
    assert.equal(doc.results["using-pf-routing"]["new-plugin-idea"].passed, true);
    assert.equal(doc.results["using-pf-routing"]["new-plugin-idea"].notes, "routes to S1 Full");
  });
});

test("recordEval creates the file when evals/evals.json is absent", async () => {
  await withTemp(async (dir) => {
    const stored = await recordEval(dir, { skill: "pf-intent", name: "e1", passed: false });
    assert.equal(stored.passed, false);
    const doc = await readEvals(dir);
    assert.equal(doc.results["pf-intent"]["e1"].passed, false);
  });
});

test("recordEval overwrites the same skill/name entry (latest result wins)", async () => {
  await withTemp(async (dir) => {
    await recordEval(dir, { skill: "pf-intent", name: "e1", passed: true });
    await recordEval(dir, { skill: "pf-intent", name: "e1", passed: false, notes: "regression" });
    const doc = await readEvals(dir);
    assert.equal(doc.results["pf-intent"]["e1"].passed, false);
    assert.equal(doc.results["pf-intent"]["e1"].notes, "regression");
    const keys = Object.keys(doc.results["pf-intent"]);
    assert.deepEqual(keys, ["e1"], "no duplicate entries");
  });
});

test("evalCoverage counts recorded vs uncovered declared evals", async () => {
  await withTemp(async (dir) => {
    await seedEvals(dir, DOC);
    await recordEval(dir, { skill: "using-pf-routing", name: "new-plugin-idea", passed: true });
    const c = evalCoverage(await readEvals(dir));
    assert.equal(c.total, 2);
    assert.equal(c.recorded, 1);
    assert.deepEqual(c.uncovered, ["non-plugin-question"]);
  });
});

test("evalCoverage handles an empty doc", () => {
  const c = evalCoverage({ evals: [], results: {} });
  assert.deepEqual(c, { total: 0, recorded: 0, uncovered: [] });
});

test("evalsPath resolves under the project root", () => {
  assert.equal(evalsPath("/tmp/x"), join("/tmp/x", "evals", "evals.json"));
});
