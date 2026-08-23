// tests/mcp/verify-server.test.mjs
// T-X-3 contract tests for the verify.mjs MCP server (mcp/verify-server.mjs).
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { executeTool } from "../../tools/verify/verify-server.mjs";

async function withTemp(fn) {
  const dir = await mkdtemp(join(tmpdir(), "pf-mcp-"));
  try {
    return await fn(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

async function writeSkill(root, name, text) {
  await mkdir(join(root, "skills", name), { recursive: true });
  await writeFile(join(root, "skills", name, "SKILL.md"), text, "utf8");
}

const VALID_SKILL = `---
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

test("verify tool returns findings and exit code for a broken project", async () => {
  await withTemp(async (dir) => {
    await writeSkill(dir, "bad_name", "no frontmatter here");
    const content = await executeTool("verify", { root: dir });
    const text = content[0].text;
    const parsed = JSON.parse(text);
    assert.equal(parsed.root, dir);
    assert.equal(parsed.exitCode, 1);
    assert.ok(parsed.findings.some((f) => f.severity === "FAIL"));
  });
});

test("verify tool passes for a clean project and honors layers", async () => {
  await withTemp(async (dir) => {
    await writeSkill(dir, "demo", VALID_SKILL);
    const content = await executeTool("verify", { root: dir, layers: ["structure"] });
    const parsed = JSON.parse(content[0].text);
    assert.equal(parsed.exitCode, 0);
  });
});

test("verify tool propagates coverage severity", async () => {
  await withTemp(async (dir) => {
    await writeSkill(dir, "demo", VALID_SKILL); // active, no test
    const content = await executeTool("verify", { root: dir, coverage: "FAIL" });
    const parsed = JSON.parse(content[0].text);
    assert.ok(parsed.findings.some((f) => f.signal === "test-coverage" && f.severity === "FAIL"));
    assert.equal(parsed.exitCode, 1);
  });
});

test("lifecycle_report tool returns a markdown report", async () => {
  await withTemp(async (dir) => {
    await writeSkill(dir, "demo", VALID_SKILL);
    const content = await executeTool("lifecycle_report", { root: dir });
    assert.match(content[0].text, /# Lifecycle Report/);
  });
});

test("missing root and unknown tool reject with clear errors", async () => {
  await assert.rejects(() => executeTool("verify", {}), /missing required argument: root/);
  await assert.rejects(() => executeTool("nope", { root: "." }), /unknown tool: nope/);
  await assert.rejects(() => executeTool("verify", { root: ".", layers: ["bogus"] }), /invalid layer: bogus/);
});
