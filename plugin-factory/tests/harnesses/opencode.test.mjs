// tests/harnesses/opencode.test.mjs
// Per-harness verification for the opencode adapter: scaffold a plugin with
// ONLY this harness, assert its root-level structure (opencode.json + INSTALL.md
// + bootstrap with a `config` hook self-registering skills/) and quick-install
// scripts, then run the generated plugin's own verifier.
//
// Invoke separately:
//   node --test tests/harnesses/opencode.test.mjs
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

const HARNESS = "opencode";
const BOOTSTRAP = ".opencode/plugins/gr-bootstrap.ts";

test("opencode: scaffold produces structure + quick-install scripts and passes its own verifier", async () => {
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

    // Structure — skills are self-registered at runtime (superpowers-style):
    // opencode.json must NOT declare a skills key; the bootstrap's `config`
    // hook registers the root skills/ dir and carries the idempotence marker.
    const ocJson = JSON.parse(await readFile(join(target, ".opencode", "opencode.json"), "utf8"));
    assert.equal(ocJson.skills, undefined, "opencode.json must not declare a skills key (bootstrap registers it)");
    const boot = await readFile(join(target, BOOTSTRAP), "utf8");
    assert.match(boot, /config: async \(config\)/, "bootstrap must expose a config hook");
    assert.match(boot, /registerSkillsDir/, "bootstrap must register the skills dir");
    assert.match(boot, /PLUGIN_FACTORY_BOOTSTRAP/, "bootstrap must carry the marker constant");
    const installMd = await readFile(join(target, ".opencode", "INSTALL.md"), "utf8");
    assert.ok(installMd.includes("opencode"), "INSTALL.md must document the opencode install path");

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
