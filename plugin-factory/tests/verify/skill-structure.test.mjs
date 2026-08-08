// tests/verify/skill-structure.test.mjs
// T-C5: skill-structure check tests
import { test } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { runChecks } from "../../scripts/verify.mjs";

const here = fileURLToPath(new URL(".", import.meta.url));
const FIXTURES = join(here, "..", "fixtures");

test("valid fixture has no skill-structure findings", async () => {
  const { findings } = await runChecks(join(FIXTURES, "verify-valid"), { layers: ["structure"] });
  const skillStructures = findings.filter((f) => f.signal === "skill-structure");
  assert.equal(skillStructures.length, 0, `Expected no skill-structure findings, got: ${JSON.stringify(skillStructures)}`);
});

test("skill-structure finds skills missing Iron Law / Red Flags / 自检清单", async () => {
  const { mkdir, writeFile } = await import("node:fs/promises");
  const tmp = join(FIXTURES, "tmp-skill-structure");
  await mkdir(join(tmp, "skills", "foo"), { recursive: true });
  await writeFile(join(tmp, "skills", "foo", "SKILL.md"), [
    "---",
    "name: foo",
    "description: Use when foo.",
    "---",
    "",
    "# foo",
    "",
    "## Overview",
    "",
    "No Iron Law, no Red Flags, no self-check.",
  ].join("\n"));
  try {
    const { findings } = await runChecks(tmp, { layers: ["structure"] });
    const ss = findings.filter((f) => f.signal === "skill-structure");
    assert.ok(ss.length > 0, "Expected skill-structure findings");
    assert.equal(ss[0].severity, "WARN");
    assert.ok(ss[0].action.includes("Iron Law"), "Should mention Iron Law");
    assert.ok(ss[0].action.includes("Red Flags"), "Should mention Red Flags");
    assert.ok(ss[0].action.includes("自检清单"), "Should mention 自检清单");
  } finally {
    const { rm } = await import("node:fs/promises");
    await rm(tmp, { recursive: true, force: true });
  }
});

test("pf-learn is exempt from skill-structure check", async () => {
  const { findings } = await runChecks(process.cwd(), { layers: ["structure"] });
  const pfLearn = findings.find((f) => f.signal === "skill-structure" && f.file.includes("pf-learn"));
  assert.equal(pfLearn, undefined, "pf-learn should be exempt from skill-structure check");
});

test("skill-structure finding has learnable: true", async () => {
  const { mkdir, writeFile } = await import("node:fs/promises");
  const tmp = join(FIXTURES, "tmp-skill-structure-learnable");
  await mkdir(join(tmp, "skills", "bar"), { recursive: true });
  await writeFile(join(tmp, "skills", "bar", "SKILL.md"), [
    "---",
    "name: bar",
    "description: Use when bar.",
    "---",
    "",
    "# bar",
  ].join("\n"));
  try {
    const { findings } = await runChecks(tmp, { layers: ["structure"] });
    const ss = findings.filter((f) => f.signal === "skill-structure");
    assert.ok(ss.length > 0);
    assert.equal(ss[0].learnable, true, "skill-structure should be learnable");
  } finally {
    const { rm } = await import("node:fs/promises");
    await rm(tmp, { recursive: true, force: true });
  }
});
