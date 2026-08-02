// tests/lifecycle/lifecycle-report.test.mjs
// T-LIF-2 contract tests for the markdown lifecycle report
// (scripts/lifecycle-report.mjs).
import { test } from "node:test";
import assert from "node:assert/strict";
import { renderLifecycleReport } from "../../scripts/lifecycle-report.mjs";

const finding = (signal, severity, action = "Fix it.", impact = "Impacts.") => ({
  signal,
  file: "skills/foo/SKILL.md",
  severity,
  action,
  impact,
});

test("empty findings render a healthy report", () => {
  const md = renderLifecycleReport("/tmp/x", []);
  assert.match(md, /# Lifecycle Report/);
  assert.match(md, /Total.*0/);
  assert.match(md, /No lifecycle signals fired/);
  assert.match(md, /No findings\./);
  assert.match(md, /No FAIL\/WARN findings/);
});

test("findings render severity-ranked summary and distribution", () => {
  const md = renderLifecycleReport("/tmp/x", [
    finding("skill-too-large", "WARN"),
    finding("broken-handoff", "FAIL"),
    finding("lifecycle-status", "INFO"),
  ]);
  assert.match(md, /\| FAIL \| 1 \|/);
  assert.match(md, /\| WARN \| 1 \|/);
  assert.match(md, /\| INFO \| 1 \|/);
  assert.match(md, /\| \*\*Total\*\* \| \*\*3\*\* \|/);
  assert.match(md, /\| `skill-too-large` \| 0 \| 1 \| 0 \|/);
  assert.match(md, /\| `broken-handoff` \| 1 \| 0 \| 0 \|/);
});

test("recommendations include action and impact for non-INFO findings", () => {
  const md = renderLifecycleReport("/tmp/x", [
    finding("broken-handoff", "FAIL", "Re-link the chain."),
    finding("lifecycle-status", "INFO"),
  ]);
  assert.match(md, /\*\*\[FAIL\]\*\* `broken-handoff` \(`skills\/foo\/SKILL\.md`\): Re-link the chain\./);
  assert.match(md, /Impact: Impacts\./);
  assert.doesNotMatch(md, /\[INFO\]/);
});

test("report carries the v1 scope and v2 trends disclaimer", () => {
  const md = renderLifecycleReport("/tmp/x", []);
  assert.match(md, /v1 pure-structural \(no runtime telemetry\)/);
  assert.match(md, /Trends require v2 signals/);
});
