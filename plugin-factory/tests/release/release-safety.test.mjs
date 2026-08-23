// tests/release/release-safety.test.mjs
// Contract tests for the release gate (tools/release/release-check.mjs).
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runReleaseChecks } from "../../tools/release/release-check.mjs";

async function withTemp(fn) {
  const dir = await mkdtemp(join(tmpdir(), "pf-release-"));
  try {
    return await fn(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

/** Scaffold a minimal repo with .version-bump.json + declared files. */
async function makeRepo(dir, { version = "0.1.0", claudeVersion } = {}) {
  await mkdir(join(dir, ".claude-plugin"), { recursive: true });
  await writeFile(
    join(dir, ".version-bump.json"),
    JSON.stringify(
      {
        files: [
          { path: "package.json", field: ".version" },
          { path: ".claude-plugin/plugin.json", field: ".version" },
        ],
        audit: { exclude: ["CHANGELOG.md", "docs", "scripts"] },
      },
      null,
      2,
    ),
    "utf8",
  );
  await writeFile(
    join(dir, "package.json"),
    JSON.stringify({ name: "x", version, private: true }, null, 2),
    "utf8",
  );
  await writeFile(
    join(dir, ".claude-plugin", "plugin.json"),
    JSON.stringify({ name: "x", version: claudeVersion ?? version }, null, 2),
    "utf8",
  );
}

test("release gate detects dirty worktree as release-blocking", async () => {
  await withTemp(async (dir) => {
    await makeRepo(dir);
    // Create a CHANGELOG entry so only the dirty-worktree signal fires.
    await writeFile(join(dir, "CHANGELOG.md"), "# Changelog\n\n## [0.1.0] - 2026-08-02\n", "utf8");
    await mkdir(join(dir, "skills", "using-x"), { recursive: true });
    await writeFile(
      join(dir, "skills", "using-x", "SKILL.md"),
      "---\nname: using-x\ndescription: Use when x applies.\n---\n\nBody.",
      "utf8",
    );
    // Make it a real git repo with a clean commit, then dirty the worktree.
    const { spawnSync } = await import("node:child_process");
    const git = (args) => spawnSync("git", args, { cwd: dir, encoding: "utf8" });
    git(["init", "-q"]);
    git(["add", "-A"]);
    git(["-c", "user.email=t@t", "-c", "user.name=t", "commit", "-q", "-m", "init"]);
    await writeFile(join(dir, "untracked.txt"), "dirty", "utf8");

    const result = await runReleaseChecks(dir);
    assert.equal(result.ok, false);
    assert.ok(
      result.findings.some((f) => f.signal === "dirty-worktree"),
      JSON.stringify(result.findings),
    );
  });
});
