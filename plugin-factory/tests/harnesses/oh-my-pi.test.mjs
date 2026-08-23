// tests/harnesses/oh-my-pi.test.mjs
// Per-harness verification for the oh-my-pi (omp) adapter: scaffold a plugin
// with ONLY this harness, assert its root-level structure (OMP-NOTES.md + the
// pi-compatible bootstrap extension declared by both `pi` and `omp` package.json
// fields) and quick-install scripts, then run the generated plugin's own
// verifier.
//
// Invoke separately:
//   node --test tests/harnesses/oh-my-pi.test.mjs
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

const HARNESS = "oh-my-pi";
const BOOTSTRAP = ".pi/extensions/gr-bootstrap.ts";

test("oh-my-pi: scaffold produces structure + quick-install scripts and passes its own verifier", async () => {
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

    // Structure — omp reuses the pi extension API: package.json carries both
    // `pi` and `omp` fields, and the bootstrap extension exists at root
    // (regression guard: an omp-only scaffold used to declare a dangling
    // extension path that failed the generated plugin's own verifier).
    const boot = await readFile(join(target, BOOTSTRAP), "utf8");
    assert.match(boot, /PLUGIN_FACTORY_BOOTSTRAP/, "bootstrap must carry the marker constant");
    const pkg = JSON.parse(await readFile(join(target, "package.json"), "utf8"));
    for (const key of ["pi", "omp"]) {
      assert.ok(Array.isArray(pkg[key]?.extensions), `package.json must declare ${key}.extensions`);
      assert.ok(pkg[key].extensions.includes(BOOTSTRAP), `package.json ${key}.extensions must reference the bootstrap`);
    }
    const notes = await readFile(join(target, "OMP-NOTES.md"), "utf8");
    assert.ok(notes.includes("omp plugin install"), "OMP-NOTES.md must document the omp install command");

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
