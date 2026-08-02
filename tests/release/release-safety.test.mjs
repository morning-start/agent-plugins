// tests/release/release-safety.test.mjs
// T4 contract tests for the version engine and release gate.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseSemVer, checkVersions, bumpVersions } from "../../scripts/version.mjs";
import { runReleaseChecks } from "../../scripts/release-check.mjs";

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

test("parseSemVer accepts valid versions", () => {
  for (const v of ["0.1.0", "1.2.3", "1.2.3-beta.1"]) {
    assert.doesNotThrow(() => parseSemVer(v), `should accept ${v}`);
  }
});

test("parseSemVer rejects invalid versions", () => {
  for (const v of ["1.2", "1.2.3foo", "", "a.b.c", "1.2.3.4", "01.2.3"]) {
    assert.throws(() => parseSemVer(v), `should reject ${JSON.stringify(v)}`);
  }
});

test("checkVersions reports missing declared files", async () => {
  await withTemp(async (dir) => {
    await makeRepo(dir);
    await rm(join(dir, "package.json"));
    const result = await checkVersions(dir);
    assert.equal(result.ok, false);
    assert.ok(result.errors.some((e) => e.toLowerCase().includes("missing")));
  });
});

test("checkVersions reports drift across two manifests", async () => {
  await withTemp(async (dir) => {
    await makeRepo(dir, { claudeVersion: "0.2.0" });
    const result = await checkVersions(dir);
    assert.equal(result.ok, false);
    assert.ok(result.errors.some((e) => e.includes("drift") || e.includes("0.1.0")));
  });
});

test("checkVersions passes when synchronized", async () => {
  await withTemp(async (dir) => {
    await makeRepo(dir);
    const result = await checkVersions(dir);
    assert.equal(result.ok, true);
    assert.equal(result.version, "0.1.0");
  });
});

test("bumpVersions writes the new version to every declared file", async () => {
  await withTemp(async (dir) => {
    await makeRepo(dir);
    await bumpVersions(dir, "0.2.0");
    const pkg = JSON.parse(await readFile(join(dir, "package.json"), "utf8"));
    const claude = JSON.parse(await readFile(join(dir, ".claude-plugin", "plugin.json"), "utf8"));
    assert.equal(pkg.version, "0.2.0");
    assert.equal(claude.version, "0.2.0");
  });
});

test("bumpVersions rejects invalid semver", async () => {
  await withTemp(async (dir) => {
    await makeRepo(dir);
    await assert.rejects(() => bumpVersions(dir, "1.2"), /invalid/i);
  });
});

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
