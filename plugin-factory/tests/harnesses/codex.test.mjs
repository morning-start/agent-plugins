// tests/harnesses/codex.test.mjs
// Per-harness verification for the codex adapter: scaffold a plugin with ONLY
// this harness, assert its root-level structure (.codex-plugin/plugin.json)
// and quick-install scripts, then run the generated plugin's own verifier.
//
// Invoke separately:
//   node --test tests/harnesses/codex.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { readFile } from "node:fs/promises";
import {
  withTemp,
  exists,
  scaffoldSingle,
  runGeneratedVerify,
  assertInstallScripts,
  ROOT_ARTIFACTS,
  FORBIDDEN_ROOT_PATHS,
  INSTALL_SECTION,
} from "./harness-helpers.mjs";

const HARNESS = "codex";

test("codex: scaffold produces structure + quick-install scripts and passes its own verifier", async () => {
  await withTemp(async (tmp) => {
    const target = join(tmp, "git-release");
    await scaffoldSingle(target, HARNESS);

    // Structure — required artifacts present, other harnesses' absent.
    for (const rel of ROOT_ARTIFACTS[HARNESS]) {
      assert.ok(await exists(join(target, rel)), `missing ${rel}`);
    }
    for (const rel of FORBIDDEN_ROOT_PATHS[HARNESS]) {
      assert.ok(!(await exists(join(target, rel))), `unexpected ${rel}`);
    }

    // Structure — the codex manifest is valid JSON with identity fields.
    const manifest = JSON.parse(await readFile(join(target, ".codex-plugin", "plugin.json"), "utf8"));
    assert.equal(manifest.name, "git-release");
    assert.ok(manifest.version, "plugin.json must declare a version");

    // Quick install — install.sh / install.ps1 advertise exactly this harness.
    await assertInstallScripts(target, HARNESS);
    const readme = await readFile(join(target, "README.md"), "utf8");
    assert.ok(readme.includes(INSTALL_SECTION[HARNESS]), `README missing install section ${INSTALL_SECTION[HARNESS]}`);

    // The generated plugin passes its own verifier (all layers).
    const v = runGeneratedVerify(target);
    assert.equal(v.status, 0, `${v.stdout}\n${v.stderr}`);
    assert.ok(!/FAIL/.test(v.stdout), v.stdout);
  });
});
