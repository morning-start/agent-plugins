// tests/release/package-plugin.test.mjs
// PKG contract tests for the zip packager (scripts/package-plugin.mjs):
// verification gate, archive round-trip, excluded directories.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildZip, parseZipEntries, crc32, packagePlugin, collectPackageFiles } from "../../tools/release/package-plugin.mjs";

async function withTemp(fn) {
  const dir = await mkdtemp(join(tmpdir(), "pf-pkg-"));
  try {
    return await fn(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

/** Minimal valid plugin tree that passes structure + harness checks. */
async function makeValidPlugin(dir) {
  await mkdir(join(dir, ".claude-plugin"), { recursive: true });
  await mkdir(join(dir, "skills", "hello"), { recursive: true });
  await writeFile(
    join(dir, "package.json"),
    JSON.stringify({ name: "demo-plugin", version: "0.1.0", private: true }, null, 2),
    "utf8",
  );
  await writeFile(
    join(dir, ".claude-plugin", "plugin.json"),
    JSON.stringify({ name: "demo-plugin", version: "0.1.0", description: "demo" }, null, 2),
    "utf8",
  );
  await writeFile(
    join(dir, "skills", "hello", "SKILL.md"),
    `---\nname: hello\ndescription: Use when greeting\n---\nbody`,
    "utf8",
  );
  await mkdir(join(dir, "node_modules", "fake"), { recursive: true });
  await writeFile(join(dir, "node_modules", "fake", "x.js"), "ignored", "utf8");
  await mkdir(join(dir, ".agent-workplace"), { recursive: true });
  await writeFile(join(dir, ".agent-workplace", "draft.md"), "private", "utf8");
}

test("crc32 matches a known vector", () => {
  assert.equal(crc32(Buffer.from("123456789")), 0xcbf43926);
});

test("zip round-trips entries with UTF-8 names and deflate content", () => {
  const entries = [
    { path: "README.md", data: "hello world\n" },
    { path: "skills/中文技能/SKILL.md", data: "---\nname: x\n---\nbody" },
  ];
  const zip = buildZip(entries);
  const parsed = parseZipEntries(zip);
  assert.equal(parsed.length, 2);
  assert.equal(parsed[0].name, "README.md");
  assert.equal(parsed[0].data.toString("utf8"), "hello world\n");
  assert.equal(parsed[1].name, "skills/中文技能/SKILL.md");
  assert.equal(parsed[1].data.toString("utf8"), "---\nname: x\n---\nbody");
});

test("collectPackageFiles skips node_modules and .agent-workplace", async () => {
  await withTemp(async (dir) => {
    await makeValidPlugin(dir);
    const files = await collectPackageFiles(dir);
    const names = files.map((f) => f.path);
    assert.ok(names.includes("package.json"));
    assert.ok(names.includes("skills/hello/SKILL.md"));
    assert.ok(!names.some((n) => n.includes("node_modules")));
    assert.ok(!names.some((n) => n.includes(".agent-workplace")));
  });
});

test("packagePlugin passes the gate and writes <name>-v<version>.zip", async () => {
  await withTemp(async (dir) => {
    await makeValidPlugin(dir);
    const result = await packagePlugin(dir);
    assert.equal(result.ok, true, JSON.stringify(result.findings));
    assert.equal(result.name, "demo-plugin");
    assert.equal(result.version, "0.1.0");
    assert.ok(result.zipPath.endsWith("demo-plugin-v0.1.0.zip"));
    const zip = await readFile(result.zipPath);
    const parsed = parseZipEntries(zip);
    const names = parsed.map((p) => p.name);
    assert.ok(names.includes("package.json"));
    assert.ok(names.includes("skills/hello/SKILL.md"));
    assert.ok(!names.includes("node_modules/fake/x.js"));
  });
});

test("packagePlugin refuses to package when verification fails", async () => {
  await withTemp(async (dir) => {
    // No .claude-plugin manifest but package.json claims nothing — structure
    // layer flags nothing; force a FAIL via a malformed manifest.
    await mkdir(join(dir, ".claude-plugin"), { recursive: true });
    await writeFile(
      join(dir, ".claude-plugin", "plugin.json"),
      '{ "name": "broken", "version": ', // invalid JSON
      "utf8",
    );
    await writeFile(join(dir, "package.json"), JSON.stringify({ name: "broken", version: "0.1.0" }, null, 2), "utf8");
    const result = await packagePlugin(dir);
    assert.equal(result.ok, false);
    assert.equal(result.zipPath, null);
    assert.ok(result.findings.length > 0);
  });
});
