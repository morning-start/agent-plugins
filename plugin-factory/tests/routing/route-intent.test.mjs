// tests/routing/route-intent.test.mjs
// T-ENT-1 contract tests for the automated intent router (scripts/route-intent.mjs).
import { test } from "node:test";
import assert from "node:assert/strict";
import { routeIntent } from "../../scripts/route-intent.mjs";

test("new plugin intents route to S1 pf-intent Full", () => {
  for (const t of ["I want to create a plugin", "创建一个插件", "我有个插件想法"]) {
    const r = routeIntent(t);
    assert.equal(r.matched, true, t);
    assert.equal(r.scenario, "S1", t);
    assert.equal(r.skill, "pf-intent (Full)", t);
    assert.ok(r.evidence.length > 0, t);
  }
});

test("change / add-a-skill intents route to S2 Change", () => {
  const r = routeIntent("add a skill to my plugin");
  assert.equal(r.scenario, "S2");
  assert.equal(r.skill, "pf-intent (Change)");
});

test("improve intents route to S3 light Change", () => {
  const r = routeIntent("优化一下这个技能");
  assert.equal(r.scenario, "S3");
  assert.equal(r.skill, "pf-intent (Change, light)");
});

test("reorganize intents route to S4 pf-lifecycle", () => {
  for (const t of ["split the skills", "合并技能"]) {
    const r = routeIntent(t);
    assert.equal(r.scenario, "S4", t);
    assert.equal(r.skill, "pf-lifecycle", t);
  }
});

test("retire intents route to S5", () => {
  const r = routeIntent("retire this skill");
  assert.equal(r.scenario, "S5");
  assert.equal(r.skill, "pf-lifecycle");
});

test("port / add-harness intents route to S6", () => {
  for (const t of ["port to opencode", "加个平台"]) {
    const r = routeIntent(t);
    assert.equal(r.scenario, "S6", t);
    assert.equal(r.skill, "pf-design (adapters)", t);
  }
});

test("orchestration tweak routes to S7", () => {
  const r = routeIntent("rework the orchestration");
  assert.equal(r.scenario, "S7");
  assert.equal(r.skill, "pf-design (orchestration)");
});

test("config/hook fix routes to S8", () => {
  const r = routeIntent("fix config");
  assert.equal(r.scenario, "S8");
  assert.equal(r.skill, "pf-build (fix)");
});

test("release intents route to S9", () => {
  for (const t of ["release the plugin", "发布新版本", "bump version"]) {
    const r = routeIntent(t);
    assert.equal(r.scenario, "S9", t);
    assert.equal(r.skill, "/pf-release", t);
  }
});

test("lifecycle analysis routes to S10", () => {
  const r = routeIntent("analyze plugin health");
  assert.equal(r.scenario, "S10");
  assert.equal(r.skill, "pf-lifecycle");
});

test("general questions answer directly, no scenario", () => {
  const r = routeIntent("how does pf-intent work?");
  assert.equal(r.matched, true);
  assert.equal(r.scenario, null);
  assert.equal(r.skill, null);
});

test("unrelated text yields no match with empty evidence", () => {
  const r = routeIntent("what color is the sky");
  assert.deepEqual(r, { matched: false, scenario: null, skill: null, path: null, evidence: [] });
});

test("empty input yields no match", () => {
  assert.equal(routeIntent("").matched, false);
  assert.equal(routeIntent(undefined).matched, false);
});

test("first match wins: release beats generic new-plugin keywords", () => {
  const r = routeIntent("bump version and release");
  assert.equal(r.scenario, "S9");
});
