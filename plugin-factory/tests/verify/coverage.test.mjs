// tests/verify/coverage.test.mjs
// T-VFY-2 contract tests for the configurable test-coverage probe
// (--coverage=WARN|FAIL in scripts/verify.mjs).
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runChecks } from "../../tools/verify/verify.mjs";

async function withTemp(fn) {
  const dir = await mkdtemp(join(tmpdir(), "pf-coverage-"));
  try {
    return await fn(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

/** Minimal active skill without a test. */
const ACTIVE_NO_TEST = `---
name: demo
description: Use when x.
metadata:
  lifecycle:
    status: active
    version: 0.1.0
---
# demo
Do the thing.
`;

const ACTIVE_WITH_DIR_TEST = `---
name: demo
description: Use when x.
metadata:
  lifecycle:
    status: active
    version: 0.1.0
---
# demo
Do the thing.
`;

const DEPRECATED_NO_TEST = `---
name: old
description: Use when y.
metadata:
  lifecycle:
    status: deprecated
    version: 0.1.0
---
# old
Legacy.
`;

async function skill(root, name, text) {
  await mkdir(join(root, "skills", name), { recursive: true });
  await writeFile(join(root, "skills", name, "SKILL.md"), text, "utf8");
}

const bySignal = (findings) => Object.fromEntries(findings.map((f) => [f.signal, f]));

test("coverage probe is opt-in: no findings without --coverage", async () => {
  await withTemp(async (dir) => {
    await skill(dir, "demo", ACTIVE_NO_TEST);
    const { findings } = await runChecks(dir, { layers: ["structure"] });
    assert.equal(bySignal(findings)["test-coverage"], undefined, JSON.stringify(findings));
  });
});

test("--coverage=WARN reports active uncovered skills as WARN", async () => {
  await withTemp(async (dir) => {
    await skill(dir, "demo", ACTIVE_NO_TEST);
    const { findings } = await runChecks(dir, { layers: ["structure"], coverage: "WARN" });
    const f = bySignal(findings)["test-coverage"];
    assert.ok(f, JSON.stringify(findings));
    assert.equal(f.severity, "WARN");
    assert.equal(f.file, "skills/demo/SKILL.md");
  });
});

test("--coverage=FAIL escalates the same finding to FAIL (blocking)", async () => {
  await withTemp(async (dir) => {
    await skill(dir, "demo", ACTIVE_NO_TEST);
    const { findings } = await runChecks(dir, { layers: ["structure"], coverage: "FAIL" });
    const f = bySignal(findings)["test-coverage"];
    assert.ok(f, JSON.stringify(findings));
    assert.equal(f.severity, "FAIL");
    assert.match(f.action, /tests\/demo\//);
  });
});

test("a tests/<name>/ dir with files satisfies coverage", async () => {
  await withTemp(async (dir) => {
    await skill(dir, "demo", ACTIVE_WITH_DIR_TEST);
    await mkdir(join(dir, "tests", "demo"), { recursive: true });
    await writeFile(join(dir, "tests", "demo", "demo.test.mjs"), "// stub", "utf8");
    const { findings } = await runChecks(dir, { layers: ["structure"], coverage: "FAIL" });
    assert.equal(bySignal(findings)["test-coverage"], undefined, JSON.stringify(findings));
  });
});

test("deprecated skills are exempt from coverage", async () => {
  await withTemp(async (dir) => {
    await skill(dir, "old", DEPRECATED_NO_TEST);
    const { findings } = await runChecks(dir, { layers: ["structure"], coverage: "FAIL" });
    assert.equal(bySignal(findings)["test-coverage"], undefined, JSON.stringify(findings));
  });
});

test("metadata.tests frontmatter list satisfies coverage", async () => {
  await withTemp(async (dir) => {
    const text = ACTIVE_NO_TEST.replace(
      "  lifecycle:",
      "  tests: [tests/demo.test.mjs]\n  lifecycle:",
    );
    await skill(dir, "demo", text);
    const { findings } = await runChecks(dir, { layers: ["structure"], coverage: "FAIL" });
    assert.equal(bySignal(findings)["test-coverage"], undefined, JSON.stringify(findings));
  });
});
