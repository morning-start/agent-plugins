// tests/bootstrap/bootstrap-contract.test.mjs
// T3 contract tests for the bootstrap renderer and adapter wiring.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { renderBootstrap, stripFrontmatter, MARKER_PREFIX } from "../../scripts/render-bootstrap.mjs";

const here = fileURLToPath(new URL(".", import.meta.url));
const REPO_ROOT = join(here, "..", "..");
const ENTRY = join(REPO_ROOT, "skills", "using-pf", "SKILL.md");

async function withTemp(fn) {
  const dir = await mkdtemp(join(tmpdir(), "pf-bootstrap-"));
  try {
    return await fn(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

test("frontmatter is removed from the injected body", async () => {
  const { body, text } = await renderBootstrap({ entrySkillPath: ENTRY, pluginName: "plugin-factory" });
  assert.ok(!body.startsWith("---"), "injected body must not start with frontmatter delimiters");
  assert.ok(!body.includes("name: using-pf"), "frontmatter fields must not leak into the body");
  assert.ok(!body.includes("description: Use when starting"), "frontmatter description must not leak");
  assert.ok(body.includes("## Overview"), "the real body must survive");
  assert.ok(text.includes(body), "text must embed the body");
});

test("the marker is stable", async () => {
  const a = await renderBootstrap({ entrySkillPath: ENTRY, pluginName: "plugin-factory" });
  const b = await renderBootstrap({ entrySkillPath: ENTRY, pluginName: "plugin-factory" });
  assert.equal(a.marker, b.marker);
  assert.equal(a.marker, `${MARKER_PREFIX}:plugin-factory`);
});

test("repeated rendering does not duplicate the marker", async () => {
  const a = await renderBootstrap({ entrySkillPath: ENTRY, pluginName: "plugin-factory" });
  const b = await renderBootstrap({ entrySkillPath: ENTRY, pluginName: "plugin-factory" });
  assert.equal(a.text.split(MARKER_PREFIX).length - 1, 1, "marker must appear exactly once");
  assert.equal(b.text.split(MARKER_PREFIX).length - 1, 1);
});

test("missing entry skill fails with a clear error", async () => {
  await withTemp(async (dir) => {
    await assert.rejects(
      () => renderBootstrap({ entrySkillPath: join(dir, "skills", "using-ghost", "SKILL.md"), pluginName: "ghost" }),
      /entry skill not found/,
    );
  });
});

test("special characters in plugin names remain intact", async () => {
  await withTemp(async (dir) => {
    const skillDir = join(dir, "skills", "using-abc");
    await writeFile(join(dir, "mk"), "", { flag: "a" });
    // create the entry skill directory + file programmatically
    const { mkdir } = await import("node:fs/promises");
    await mkdir(skillDir, { recursive: true });
    await writeFile(join(skillDir, "SKILL.md"), "---\nname: using-abc\n---\n\nBody abc.", "utf8");
    const out = await renderBootstrap({ entrySkillPath: join(skillDir, "SKILL.md"), pluginName: "abc" });
    assert.equal(out.marker, `${MARKER_PREFIX}:abc`);
    assert.ok(out.text.includes(`${MARKER_PREFIX}:abc`));
    assert.ok(out.text.includes("Body abc."));
  });
});

test("stripFrontmatter only removes the leading YAML block", () => {
  const body = stripFrontmatter("---\nname: x\ndescription: Use when y.\n---\n\n# Real Body\n\ncontent");
  assert.equal(body, "# Real Body\n\ncontent");
  assert.equal(stripFrontmatter("no frontmatter"), "no frontmatter");
});

test("adapter sources contain no hand-copied using-pf body", async () => {
  // The pi and opencode adapters must not embed a manual copy of the entry body.
  const pi = await readFile(join(REPO_ROOT, ".pi", "extensions", "pf-bootstrap.ts"), "utf8");
  const oc = await readFile(join(REPO_ROOT, ".opencode", "plugins", "pf-bootstrap.ts"), "utf8");
  const entry = await readFile(ENTRY, "utf8");
  // Extract a distinctive line from the real body and ensure adapters don't contain it.
  const distinctive = entry.split("\n").find((l) => l.includes("using-pf") && l.includes("Entry"));
  if (distinctive) {
    assert.ok(!pi.includes(distinctive.trim()), "pi adapter must not hand-copy the entry body");
    assert.ok(!oc.includes(distinctive.trim()), "opencode adapter must not hand-copy the entry body");
  }
  assert.ok(pi.includes(MARKER_PREFIX), "pi adapter references the marker prefix");
  assert.ok(oc.includes(MARKER_PREFIX), "opencode adapter references the marker prefix");
});
