// tests/version/version.test.mjs
// Contract tests for the SemVer engine (tools/version/version.mjs).
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseSemVer, checkVersions, bumpVersions } from "../../tools/version/version.mjs";

async function withTemp(fn) {
  const dir = await mkdtemp(join(tmpdir(), "pf-version-"));
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
