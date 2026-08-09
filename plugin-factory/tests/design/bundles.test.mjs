// tests/design/bundles.test.mjs
// BND-1 contract tests for Stage-1 deterministic bundle recommendation
// (scripts/recommend-bundles.mjs).
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  recommendBundles,
  skillsFromRoot,
  bagForSkill,
  DEFAULT_THRESHOLD,
  DEFAULT_MIN_BUNDLE,
  renderBundleMarkdown,
} from "../../scripts/recommend-bundles.mjs";

async function withTemp(fn) {
  const dir = await mkdtemp(join(tmpdir(), "pf-bundles-"));
  try {
    return await fn(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

const GIT_A = { name: "git-commit", description: "Use when creating git commits with conventional messages" };
const GIT_B = { name: "git-branch", description: "Use when managing git branches and worktrees" };
const REVIEW_A = { name: "code-review", description: "Use when reviewing code changes for bugs and style" };
const REVIEW_B = { name: "review-merge-request", description: "Use when reviewing a merge request before merge" };
const WEATHER = { name: "weather-report", description: "Use when fetching the weather forecast for a city" };
const COMMIT_STYLE = { name: "commit-style", description: "Use when checking commit message style" };

test("related skills cluster into a bundle above the threshold", () => {
  const result = recommendBundles([GIT_A, GIT_B, WEATHER], { threshold: DEFAULT_THRESHOLD });
  assert.equal(result.bundles.length, 1);
  assert.deepEqual(result.bundles[0].members, ["git-branch", "git-commit"]);
  assert.equal(result.singletons.length, 1);
  assert.equal(result.singletons[0].name, "weather-report");
});

test("related-but-under-threshold skills stay singleton with a closest-neighbor reason", () => {
  const result = recommendBundles([GIT_A, COMMIT_STYLE], { threshold: DEFAULT_THRESHOLD });
  assert.equal(result.bundles.length, 0);
  assert.equal(result.singletons.length, 2);
  for (const s of result.singletons) {
    assert.ok(s.closest, "singleton should record its closest neighbor");
    assert.ok(s.closestSimilarity < DEFAULT_THRESHOLD, "closest similarity is below the threshold");
    assert.ok(s.reason.includes("below threshold"), "reason explains the singleton");
  }
});

test("a raised threshold splits a weak bundle into singletons", () => {
  const result = recommendBundles([GIT_A, GIT_B, REVIEW_A, REVIEW_B], { threshold: 0.9 });
  assert.equal(result.bundles.length, 0);
  assert.equal(result.singletons.length, 4);
});

test("name tokens are weighted 2x: name match alone can cross the threshold", () => {
  const bag = bagForSkill("git-commit", "Use when doing something unrelated");
  const git = bag.filter((w) => w === "git");
  assert.ok(git.length >= 2, "name token should appear at least twice");
});

test("minBundle controls the cluster membership cutoff", () => {
  const result = recommendBundles([GIT_A, GIT_B], { threshold: DEFAULT_THRESHOLD, minBundle: 3 });
  assert.equal(result.bundles.length, 0);
  assert.equal(result.singletons.length, 2);
});

test("skillsFromRoot reads names and descriptions from a skills/ tree", async () => {
  await withTemp(async (dir) => {
    await mkdir(join(dir, "skills", "git-commit"), { recursive: true });
    await mkdir(join(dir, "skills", "weather-report"), { recursive: true });
    await writeFile(
      join(dir, "skills", "git-commit", "SKILL.md"),
      `---\nname: git-commit\ndescription: Use when creating git commits\n---\nbody`,
      "utf8",
    );
    await writeFile(
      join(dir, "skills", "weather-report", "SKILL.md"),
      `---\nname: weather-report\ndescription: Use when fetching weather\n---\nbody`,
      "utf8",
    );
    const skills = await skillsFromRoot(dir);
    assert.equal(skills.length, 2);
    assert.deepEqual(skills.map((s) => s.name).sort(), ["git-commit", "weather-report"]);
  });
});

test("renderBundleMarkdown produces the threshold table and sections", () => {
  const result = recommendBundles([GIT_A, GIT_B, WEATHER]);
  const md = renderBundleMarkdown(result);
  assert.match(md, /# Bundle Recommendation Report/);
  assert.match(md, /High confidence, safe to bundle/);
  assert.match(md, /Candidate bundles/);
  assert.match(md, /git-branch, git-commit/);
  assert.match(md, /Singletons/);
  assert.match(md, /weather-report/);
});
