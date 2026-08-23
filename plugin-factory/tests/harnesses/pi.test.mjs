// tests/harnesses/pi.test.mjs
// Per-harness verification for the pi adapter: scaffold a plugin with ONLY
// this harness, assert its root-level structure (bootstrap extension +
// package.json `pi` field) and quick-install scripts, then run the generated
// plugin's own verifier.
//
// Invoke separately:
//   node --test tests/harnesses/pi.test.mjs
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

const HARNESS = "pi";
const BOOTSTRAP = ".pi/extensions/gr-bootstrap.ts";

test("pi: scaffold produces structure + quick-install scripts and passes its own verifier", async () => {
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

    // Structure — bootstrap extension implements the pi API and carries the
    // idempotence marker; package.json `pi` field points at it.
    const boot = await readFile(join(target, BOOTSTRAP), "utf8");
    assert.match(boot, /PLUGIN_FACTORY_BOOTSTRAP/, "bootstrap must carry the marker constant");
    assert.match(boot, /pi\.on\("session_start"/, "bootstrap must register pi lifecycle hooks");
    const pkg = JSON.parse(await readFile(join(target, "package.json"), "utf8"));
    assert.ok(Array.isArray(pkg.pi?.extensions), "package.json must declare pi.extensions");
    assert.ok(pkg.pi.extensions.includes(BOOTSTRAP), "package.json pi.extensions must reference the bootstrap");
    assert.equal(pkg.omp, undefined, "pi-only plugin must not declare the omp field");

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
