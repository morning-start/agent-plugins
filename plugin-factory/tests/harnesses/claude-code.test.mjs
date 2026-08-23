// tests/harnesses/claude-code.test.mjs
// Per-harness verification for the claude-code adapter: scaffold a plugin with
// ONLY this harness, assert its root-level structure and quick-install scripts
// (install.sh / install.ps1), then run the generated plugin's own verifier.
//
// Invoke separately:
//   node --test tests/harnesses/claude-code.test.mjs
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

const HARNESS = "claude-code";

test("claude-code: scaffold produces structure + quick-install scripts and passes its own verifier", async () => {
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

    // Quick install — hooks.json only uses official Claude Code events
    // (regression guard: an unknown event rejects the whole file at load).
    const hooksJson = JSON.parse(await readFile(join(target, "hooks", "hooks.json"), "utf8"));
    const events = Object.keys(hooksJson.hooks);
    for (const ev of events) {
      assert.notEqual(ev, "PreCommit", "PreCommit is not a Claude Code hook event");
      assert.notEqual(ev, "PreCompletion", "PreCompletion is not a Claude Code hook event");
    }

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
