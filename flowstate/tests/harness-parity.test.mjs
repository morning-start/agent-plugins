// tests/harness-parity.test.mjs
// Guards the opencode harness claim: the bootstrap plugin self-registers the
// canonical root skills/ directory via its config hook (superpowers-style).
// No .opencode/skills/ copy, no declarative "skills" key in opencode.json.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdir, readFile, stat } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

test("bootstrap plugin exposes a config hook registering root skills/", async () => {
  const mod = await import(pathToFileURL(join(ROOT, ".opencode", "plugins", "fst-bootstrap.ts")).href);
  const FstBootstrap = mod.FstBootstrap ?? mod.default;
  const plugin = await FstBootstrap({ directory: ROOT });
  assert.equal(typeof plugin.config, "function", "config hook missing from fst-bootstrap.ts");

  const expected = join(ROOT, "skills");
  const v1 = {};
  await plugin.config(v1);
  assert.deepEqual(v1.skills.paths, [expected], "v1 shape registration failed");

  const v2 = { skills: [] };
  await plugin.config(v2);
  assert.deepEqual(v2.skills, [expected], "v2 shape registration failed");
});

test("opencode.json does not declare a duplicate skills key", async () => {
  const config = JSON.parse(await readFile(join(ROOT, ".opencode", "opencode.json"), "utf8"));
  assert.equal(config.skills, undefined, "remove \"skills\" from opencode.json — bootstrap registers it at runtime");
});

test("canonical skills/ exists and every skill has SKILL.md", async () => {
  const canonical = (await readdir(join(ROOT, "skills"))).filter((d) => !d.startsWith("."));
  assert.ok(canonical.length > 0, "skills/ must not be empty");
  for (const skill of canonical) {
    await stat(join(ROOT, "skills", skill, "SKILL.md")); // throws if missing
  }
});

test("no duplicated skill tree under .opencode/skills/", async () => {
  const copied = await readdir(join(ROOT, ".opencode", "skills")).catch(() => null);
  assert.equal(copied, null, ".opencode/skills/ reappeared — delete it; root skills/ is the single source");
});
