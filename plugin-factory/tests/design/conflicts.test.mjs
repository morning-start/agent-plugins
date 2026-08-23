// tests/design/conflicts.test.mjs
// T-DES-5 contract tests for automatic trigger-domain conflict detection
// (scripts/check-conflicts.mjs).
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  findTriggerOverlaps,
  runConflictCheck,
  skillsFromRoot,
  skillsFromManifest,
  OVERLAP_THRESHOLD,
} from "../../tools/design/check-conflicts.mjs";

async function withTemp(fn) {
  const dir = await mkdtemp(join(tmpdir(), "pf-conflicts-"));
  try {
    return await fn(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

test("identical trigger domains are flagged as exact overlap", () => {
  const overlaps = findTriggerOverlaps([
    { name: "a", triggers: "Use when the user asks to format code" },
    { name: "b", triggers: "Use when the user asks to format code" },
  ]);
  assert.equal(overlaps.length, 1);
  assert.equal(overlaps[0].exact, true);
  assert.equal(overlaps[0].similarity, 1);
});

test("near-duplicate triggers exceed the 0.85 Jaccard threshold", () => {
  const overlaps = findTriggerOverlaps([
    { name: "a", triggers: "Use when formatting source code before commit" },
    { name: "b", triggers: "Use when formatting source code before a commit" },
  ]);
  assert.ok(overlaps.length >= 1, JSON.stringify(overlaps));
  assert.ok(overlaps[0].similarity >= OVERLAP_THRESHOLD);
});

test("disjoint trigger domains produce no conflicts", () => {
  const overlaps = findTriggerOverlaps([
    { name: "a", triggers: "Use when formatting code" },
    { name: "b", triggers: "Use when auditing dependencies" },
  ]);
  assert.deepEqual(overlaps, []);
});

test("runConflictCheck maps overlaps to the stable finding shape", () => {
  const { findings } = runConflictCheck([
    { name: "a", triggers: "Use when formatting code" },
    { name: "b", triggers: "Use when formatting code" },
  ]);
  assert.equal(findings.length, 1);
  assert.equal(findings[0].signal, "trigger-conflict");
  assert.equal(findings[0].severity, "FAIL");
  assert.match(findings[0].action, /Merge a and b/);
  assert.match(findings[0].impact, /skills\/b\/SKILL\.md/);
});

test("near-overlap is WARN with a conflicts-declaration suggestion", () => {
  const { findings } = runConflictCheck([
    { name: "a", triggers: "Use when formatting source code before commit" },
    { name: "b", triggers: "Use when formatting source code before a commit" },
  ]);
  assert.equal(findings.length, 1);
  assert.equal(findings[0].severity, "WARN");
  assert.match(findings[0].action, /orchestration\.conflicts/);
});

test("skillsFromRoot reads trigger descriptions from SKILL.md files", async () => {
  await withTemp(async (dir) => {
    await mkdir(join(dir, "skills", "alpha"), { recursive: true });
    await writeFile(
      join(dir, "skills", "alpha", "SKILL.md"),
      "---\nname: alpha\ndescription: Use when formatting code.\n---\nbody",
      "utf8",
    );
    const skills = await skillsFromRoot(dir);
    assert.equal(skills.length, 1);
    assert.equal(skills[0].name, "alpha");
    assert.match(skills[0].triggers, /formatting code/);
  });
});

test("skillsFromManifest reads components.skills triggers", async () => {
  await withTemp(async (dir) => {
    const manifest = join(dir, "manifest.json");
    await writeFile(
      manifest,
      JSON.stringify({
        components: {
          skills: [
            { name: "x", triggers: "Use when x" },
            { name: "y", triggers: "Use when y" },
          ],
        },
      }),
      "utf8",
    );
    const skills = await skillsFromManifest(manifest);
    assert.equal(skills.length, 2);
    assert.equal(skills[0].name, "x");
  });
});
