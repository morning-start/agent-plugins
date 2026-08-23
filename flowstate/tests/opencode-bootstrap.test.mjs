// tests/opencode-bootstrap.test.mjs
// Behavior tests: the opencode bootstrap plugin must self-register the
// canonical root skills/ directory via its config hook (superpowers-style),
// handling both v1 ({skills:{paths,urls}}) and v2 ({skills:[...]}) shapes,
// and must stay idempotent across repeated calls.
import { test } from "node:test";
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const mod = await import(
  pathToFileURL(join(ROOT, ".opencode", "plugins", "fst-bootstrap.ts")).href
);
const FstBootstrap = mod.FstBootstrap ?? mod.default;

test("plugin exports a factory", () => {
  assert.equal(typeof FstBootstrap, "function");
});

test("config hook registers skills dir (v1 object shape)", async () => {
  const plugin = await FstBootstrap({ directory: ROOT });
  assert.equal(typeof plugin.config, "function", "config hook missing");

  const config = {};
  await plugin.config(config);
  const expected = join(ROOT, "skills");
  assert.deepEqual(config.skills.paths, [expected]);
});

test("config hook appends to existing v1 paths without duplicates", async () => {
  const plugin = await FstBootstrap({ directory: ROOT });
  const expected = join(ROOT, "skills");
  const config = { skills: { paths: ["/somewhere/else"], urls: ["https://x/"] } };
  await plugin.config(config);
  assert.deepEqual(config.skills.paths, ["/somewhere/else", expected]);
  await plugin.config(config); // idempotent
  assert.deepEqual(config.skills.paths, ["/somewhere/else", expected]);
  assert.deepEqual(config.skills.urls, ["https://x/"]);
});

test("config hook registers skills dir (v2 array shape)", async () => {
  const plugin = await FstBootstrap({ directory: ROOT });
  const expected = join(ROOT, "skills");
  const config = { skills: ["./other-skills"] };
  await plugin.config(config);
  assert.deepEqual(config.skills, ["./other-skills", expected]);
  await plugin.config(config); // idempotent
  assert.deepEqual(config.skills, ["./other-skills", expected]);
});

test("config hook keeps unrelated config fields untouched", async () => {
  const plugin = await FstBootstrap({ directory: ROOT });
  const config = { name: "flowstate", model: "x/y" };
  await plugin.config(config);
  assert.equal(config.name, "flowstate");
  assert.equal(config.model, "x/y");
});

test("bootstrap injects entry skill once with marker (session.created)", async () => {
  const plugin = await FstBootstrap({ directory: ROOT });
  const output = { prompt: "hello" };
  await plugin["session.created"]({}, output);
  assert.match(output.prompt, /^FLOWSTATE_BOOTSTRAP:flowstate\n/);
  assert.match(output.prompt, /hello$/);

  // Idempotent: input already containing the marker must not be re-prepended.
  const output2 = { prompt: output.prompt };
  await plugin["session.created"]({ prompt: output2.prompt }, output2);
  const count = (output2.prompt.match(/FLOWSTATE_BOOTSTRAP:flowstate\n/g) || []).length;
  assert.equal(count, 1, "marker must appear exactly once");
});
