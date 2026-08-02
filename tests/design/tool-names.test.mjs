// tests/design/tool-names.test.mjs
// T-DES-3 contract tests for the "skills name actions, not tools" gate
// (scripts/check-tool-names.mjs).
import { test } from "node:test";
import assert from "node:assert/strict";
import { toolNameHits, checkToolNames } from "../../scripts/check-tool-names.mjs";

test("backticked agent tool names are detected", () => {
  const text = "# s\n\nUse `Read` to load the file.\n";
  const hits = toolNameHits(text);
  assert.equal(hits.length, 1);
  assert.equal(hits[0].tool, "Read");
  assert.equal(hits[0].line, 3);
});

test("call-syntax tool names are detected", () => {
  const text = "# s\n\nCall Read(open_file) to proceed.\n";
  const hits = toolNameHits(text);
  assert.ok(hits.some((h) => h.tool === "Read"), "Read( should be flagged");
});

test("action phrases are not flagged", () => {
  const text = "# s\n\nInvoke a skill, dispatch a subagent, or read a file.\n";
  assert.deepEqual(toolNameHits(text), []);
});

test("frontmatter tool names are not flagged", () => {
  const text = "---\nname: foo\ndescription: Use when the Read tool is involved.\n---\n\nbody\n";
  assert.deepEqual(toolNameHits(text), []);
});

test("snake_case code identifiers are not flagged", () => {
  const text = "# s\n\nnode scripts/verify.mjs structure --root <dir>\n";
  assert.deepEqual(toolNameHits(text), []);
});

test("checkToolNames reports WARN findings with stable shape", async () => {
  const { mkdtemp, writeFile } = await import("node:fs/promises");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const dir = await mkdtemp(join(tmpdir(), "tool-names-"));
  const skillDir = join(dir, "skills", "demo");
  await import("node:fs/promises").then(({ mkdir }) => mkdir(skillDir, { recursive: true }));
  await writeFile(
    join(skillDir, "SKILL.md"),
    "---\nname: demo\ndescription: Use when x.\n---\n\nUse `WebFetch` to pull the page.\n",
    "utf8",
  );
  const { findings } = await checkToolNames(dir);
  assert.equal(findings.length, 1);
  assert.equal(findings[0].signal, "tool-name-ref");
  assert.equal(findings[0].severity, "WARN");
  assert.match(findings[0].file, /skills\/demo\/SKILL\.md:\d+/);
  assert.match(findings[0].action, /WebFetch/);
});

test("checkToolNames is clean on action-phrase-only skills", async () => {
  const { mkdtemp, writeFile, mkdir } = await import("node:fs/promises");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const dir = await mkdtemp(join(tmpdir(), "tool-names-clean-"));
  const skillDir = join(dir, "skills", "demo");
  await mkdir(skillDir, { recursive: true });
  await writeFile(
    join(skillDir, "SKILL.md"),
    "---\nname: demo\ndescription: Use when x.\n---\n\nInvoke a skill to proceed; read the handoff file.\n",
    "utf8",
  );
  const { findings } = await checkToolNames(dir);
  assert.deepEqual(findings, []);
});
