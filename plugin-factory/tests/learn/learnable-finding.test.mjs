// tests/learn/learnable-finding.test.mjs
// T-A4: learnable field tests for verify.mjs and pf-learn skill structure
import { test } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { makeFinding } from "../../tools/verify/verify.mjs";

const here = fileURLToPath(new URL(".", import.meta.url));

test("makeFinding default learnable is false (backward compat)", () => {
  const f = makeFinding("broken-handoff", "skills/a/SKILL.md", "FAIL", "Fix it", "Chain broken");
  assert.equal(f.learnable, false);
  assert.deepEqual(f, { signal: "broken-handoff", file: "skills/a/SKILL.md", severity: "FAIL", action: "Fix it", impact: "Chain broken", learnable: false });
});

test("makeFinding with explicit learnable true", () => {
  const f = makeFinding("broken-handoff", "skills/a/SKILL.md", "FAIL", "Fix it", "Chain broken", true);
  assert.equal(f.learnable, true);
});

test("makeFinding with explicit learnable false", () => {
  const f = makeFinding("broken-handoff", "skills/a/SKILL.md", "FAIL", "Fix it", "Chain broken", false);
  assert.equal(f.learnable, false);
});

test("pf-learn SKILL.md has three-section structure", async () => {
  const { readFile } = await import("node:fs/promises");
  const skillPath = join(here, "..", "..", "skills", "pf-learn", "SKILL.md");
  const content = await readFile(skillPath, "utf-8");
  assert.match(content, /## Iron Law/, "Missing Iron Law section");
  assert.match(content, /## Red Flags/, "Missing Red Flags section");
  assert.match(content, /## 自检清单/, "Missing self-check section");
});
