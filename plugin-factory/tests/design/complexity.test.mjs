// tests/complexity/complexity.test.mjs
// T-INT-2 contract tests for the automated complexity gate (scripts/complexity.mjs).
import { test } from "node:test";
import assert from "node:assert/strict";
import { scoreComplexity } from "../../tools/design/complexity.mjs";

test("defaults score to Light", () => {
  const r = scoreComplexity();
  assert.equal(r.score, 0);
  assert.equal(r.verdict, "light");
  assert.match(r.path, /pf-build/);
});

test("single skill, single harness stays Light", () => {
  const r = scoreComplexity({ skills: 1, hooks: false, harnesses: 1, rules: false });
  assert.equal(r.score, 0);
  assert.equal(r.verdict, "light");
});

test("two skills plus no extras stays Light (score 0-1)", () => {
  const r = scoreComplexity({ skills: 2 });
  assert.equal(r.score, 0);
  assert.equal(r.verdict, "light");
});

test("more than 2 skills adds +1 per extra skill", () => {
  const r = scoreComplexity({ skills: 4 });
  assert.equal(r.score, 2);
  assert.equal(r.verdict, "medium");
  assert.ok(r.signals.some((s) => s.includes("more than 2 skills (4) -> +2")));
});

test("hooks add +2", () => {
  const r = scoreComplexity({ skills: 1, hooks: true });
  assert.equal(r.score, 2);
  assert.equal(r.verdict, "medium");
  assert.ok(r.signals.includes("hooks required -> +2"));
});

test("extra harness beyond the first adds +1 each", () => {
  const r = scoreComplexity({ harnesses: 3 });
  assert.equal(r.score, 2);
  assert.equal(r.verdict, "medium");
});

test("rules/agents/subagents add +1", () => {
  const r = scoreComplexity({ skills: 1, rules: true });
  assert.equal(r.score, 1);
  assert.equal(r.verdict, "light");
});

test("score 5+ is Heavy with ADR path", () => {
  const r = scoreComplexity({ skills: 4, hooks: true, rules: true });
  assert.equal(r.score, 5);
  assert.equal(r.verdict, "heavy");
  assert.match(r.path, /ADR/);
});

test("cross-scenario forces split verdict (Iron Law 5)", () => {
  const r = scoreComplexity({ crossScenario: true });
  assert.equal(r.score, 5);
  assert.equal(r.verdict, "split");
  assert.match(r.path, /split into separate plugins/);
});

test("signals are empty when nothing contributes", () => {
  const r = scoreComplexity();
  assert.deepEqual(r.signals, []);
});
