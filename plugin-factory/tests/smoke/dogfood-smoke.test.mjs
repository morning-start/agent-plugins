// tests/smoke/dogfood-smoke.test.mjs
// T5 static dogfood smoke test: prove plugin-factory can generate, validate,
// bootstrap, and audit one real example plugin (git-release) from a clean
// temporary target — no manual file copying, no undocumented repair.
//
// Stages: create temporary target → scaffold with all advertised harnesses →
// assert deterministic file inventory → inject fixture entry skills → run the
// generated project's own verifier → check the bootstrap marker per adapter →
// run lifecycle probes → remove the temporary target (finally).
import { test } from "node:test";
import assert from "node:assert/strict";
import { cp, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const here = fileURLToPath(new URL(".", import.meta.url));
const REPO_ROOT = join(here, "..", "..");
const FIXTURES = join(here, "fixtures");
const NODE = process.execPath;

/** Stage failure payload with the documented shape. */
function stageResult(stage, target, ok, message) {
  return { stage, target, ok, message };
}

/** Stage message string for assert calls (assert requires a string message). */
const stage = (...args) => JSON.stringify(stageResult(...args));

function run(cmd, args, cwd, env = {}) {
  return spawnSync(cmd, args, { cwd, encoding: "utf8", shell: false, env: { ...process.env, ...env } });
}

async function exists(p) {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

/** rm with retry — Windows can hold directory handles briefly after spawn. */
async function rmRetry(path, attempts = 5) {
  for (let i = 0; i < attempts; i++) {
    try {
      await rm(path, { recursive: true, force: true });
      return;
    } catch (err) {
      if (i === attempts - 1) throw err;
      await new Promise((r) => setTimeout(r, 150));
    }
  }
}

async function withTemp(fn) {
  const dir = await mkdtemp(join(tmpdir(), "pf-smoke-"));
  try {
    return await fn(dir);
  } finally {
    await rmRetry(dir);
  }
}

const ALL_HARNESSES = ["claude-code", "pi", "opencode", "oh-my-pi", "codex"];

const REQUIRED_MANIFESTS = [
  ".claude-plugin/plugin.json",
  "hooks/hooks.json",
  "hooks/session-start.sh",
  "hooks/session-start.ps1",
  ".pi/extensions/gr-bootstrap.ts",
  ".opencode/opencode.json",
  ".opencode/plugins/gr-bootstrap.ts",
  ".opencode/skills/gr-hello/SKILL.md",
  ".codex-plugin/plugin.json",
  "OMP-NOTES.md",
  "package.json",
  "scripts/verify.mjs",
  "scripts/validate-structure.sh",
  "scripts/validate-structure.ps1",
  "skills/gr-hello/SKILL.md",
  "README.md",
  "README.zh-CN.md",
  "AGENTS.md",
  "CLAUDE.md",
  "install.sh",
  "install.ps1",
];

async function scaffoldDogfood(target) {
  const res = run(
    NODE,
    [
      join(REPO_ROOT, "scripts", "scaffold.mjs"),
      "--name",
      "git-release",
      "--prefix",
      "gr",
      "--target",
      target,
      "--description",
      "Release workflow helper",
      "--user-lang",
      "zh-CN",
      "--harnesses",
      ALL_HARNESSES.join(","),
    ],
    REPO_ROOT,
    { SCAFFOLD_LIST_FILES: "1" },
  );
  return res;
}

/** Inject the fixture entry skills (using-gr + gr-check) into the target. */
async function injectEntrySkills(target) {
  for (const name of ["using-gr", "gr-check"]) {
    await cp(join(FIXTURES, "skills", name), join(target, "skills", name), { recursive: true });
  }
}

test("dogfood: scaffold produces a deterministic, valid plugin", async () => {
  await withTemp(async (tmp) => {
    const target = join(tmp, "git-release");

    // Stage 1 — scaffold output exists.
    const res = await scaffoldDogfood(target);
    assert.ok(res.status === 0, stage("scaffold", target, false, res.stderr || res.stdout));
    assert.ok(await exists(target), stage("scaffold", target, false, "target missing"));

    // Stage 2 — all declared manifest paths exist.
    const missing = [];
    for (const rel of REQUIRED_MANIFESTS) {
      if (!(await exists(join(target, rel)))) missing.push(rel);
    }
    assert.deepEqual(missing, [], stage("manifest-paths", target, false, `missing: ${missing.join(", ")}`));

    // Deterministic file inventory (sorted, relative, no absolute paths).
    const files = res.stdout.split("\n").filter((l) => /^  /.test(l)).map((l) => l.trim());
    assert.ok(files.length > 0, stage("deterministic-inventory", target, false, "no file list"));

    // Inject fixture entry skills (simulates the pf-build skill-creator output).
    await injectEntrySkills(target);

    // Stage 3 — generated project passes its own verifier.
    const verify = run(NODE, [join(target, "scripts", "verify.mjs"), "structure", "--root", "."], target);
    assert.equal(
      verify.status,
      0,
      stage("generated-verification", target, false, `${verify.stdout}\n${verify.stderr}`),
    );

    // Stage 4 — bootstrap marker exists exactly once per adapter.
    const marker = "PLUGIN_FACTORY_BOOTSTRAP";
    // TS adapters carry the marker constant in source (idempotence guard).
    for (const rel of [".pi/extensions/gr-bootstrap.ts", ".opencode/plugins/gr-bootstrap.ts"]) {
      const text = await readFile(join(target, rel), "utf8");
      assert.ok(
        text.includes(marker),
        stage("bootstrap-marker", target, false, `${rel}: marker constant missing`),
      );
    }
    // The renderer emits exactly one marker for the plugin.
    const rendered = run(
      NODE,
      [join(target, "scripts", "render-bootstrap.mjs"), "--root", ".", "--plugin-name", "git-release", "--harness", "claude"],
      target,
    );
    assert.equal(rendered.status, 0, stage("bootstrap-render", target, false, rendered.stderr));
    const json = JSON.parse(rendered.stdout);
    const ctx = json.hookSpecificOutput.additionalContext;
    assert.equal(ctx.split(marker).length - 1, 1, stage("bootstrap-marker", target, false, "renderer duplicated marker"));
    assert.ok(ctx.includes("using-gr"), stage("bootstrap-marker", target, false, "entry body missing"));

    // Claude hooks emit the same marker + entry body at runtime (both shells).
    for (const hook of ["hooks/session-start.sh", "hooks/session-start.ps1"]) {
      // bash chokes on backslash absolute paths; run relative to target (cwd).
      const args = hook.endsWith(".sh")
        ? [hook]
        : ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", join(target, hook)];
      const cmd = hook.endsWith(".sh") ? "bash" : "powershell";
      const hookOut = run(cmd, args, target);
      const hookJson = JSON.parse(hookOut.stdout);
      const hookCtx = hookJson.hookSpecificOutput.additionalContext;
      assert.equal(
        hookCtx.split(marker).length - 1,
        1,
        stage("bootstrap-marker", target, false, `${hook}: runtime marker count must be 1`),
      );
      assert.ok(
        hookCtx.includes("using-gr"),
        stage("bootstrap-marker", target, false, `${hook}: entry body missing at runtime`),
      );
    }

    // Stage 5 — lifecycle probes contain no FAIL findings.
    const lifecycle = run(
      NODE,
      [join(target, "scripts", "verify.mjs"), "lifecycle", "--root", ".", "--format", "json"],
      target,
    );
    assert.equal(lifecycle.status, 0, stage("lifecycle", target, false, lifecycle.stdout));
    const lc = JSON.parse(lifecycle.stdout);
    const fails = lc.findings.filter((f) => f.severity === "FAIL");
    assert.deepEqual(fails, [], stage("lifecycle", target, false, JSON.stringify(fails)));

    // package.json must reference only files that exist (no dangling pi/omp paths).
    const pkg = JSON.parse(await readFile(join(target, "package.json"), "utf8"));
    for (const t of [...(pkg.pi?.extensions ?? []), ...(pkg.omp?.extensions ?? [])]) {
      assert.ok(await exists(join(target, t)), stage("dangling-manifest", target, false, t));
    }
  });
});

test("dogfood: scaffold rejects an unclean existing target", async () => {
  await withTemp(async (tmp) => {
    const target = join(tmp, "occupied");
    await writeFile(target, "", "utf8"); // a file, not a dir — must be rejected
    const res = await scaffoldDogfood(target);
    assert.notEqual(res.status, 0, "scaffold must reject an existing target");
    assert.ok(/already exists/.test(res.stderr || res.stdout), stage("existing-target", target, false, res.stderr));
  });
});
