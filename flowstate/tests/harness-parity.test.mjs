// tests/harness-parity.test.mjs
// Guards the opencode harness claim: INSTALL.md says skills are pre-copied
// under .opencode/skills/ — if that drifts, opencode users lose ALL skill
// discovery (opencode never scans the repo-root skills/ directory).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

test("every root skill is pre-copied into .opencode/skills/", async () => {
  const canonical = (await readdir(join(ROOT, "skills"))).filter((d) => !d.startsWith("."));
  const copied = await readdir(join(ROOT, ".opencode", "skills")).catch(() => []);
  for (const skill of canonical) {
    assert.ok(
      copied.includes(skill),
      `.opencode/skills/${skill} missing — opencode cannot discover it`,
    );
    // Content parity: copied SKILL.md must equal canonical SKILL.md.
    const src = await readFile(join(ROOT, "skills", skill, "SKILL.md"), "utf8");
    const dst = await readFile(join(ROOT, ".opencode", "skills", skill, "SKILL.md"), "utf8");
    assert.equal(dst, src, `.opencode/skills/${skill}/SKILL.md drifted from canonical`);
  }
});
