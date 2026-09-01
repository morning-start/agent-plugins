// tests/workspace-init.test.mjs
// Regression suite for .agent-workplace initialization.
//
// Guards four failure modes that used to make init a purely manual, unreliable
// step (see skills/fst-workplace/SKILL.md §1):
//   1. template directories that vanish because git does not track empty dirs
//   2. .ps1 files with non-ASCII text but no UTF-8 BOM -> GBK mojibake on
//      Windows PowerShell 5.1
//   3. non-idempotent init (duplicate .gitignore entries, clobbered files)
//   4. a `current` pointer that silently degrades into a real directory
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, readFile, writeFile, rm, stat, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const run = promisify(execFile);
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SH = join(ROOT, "scripts", "fst-workplace-init.sh");
const PS1 = join(ROOT, "scripts", "fst-workplace-init.ps1");

// Directories fst-workplace §1 / §3 requires right after initialization.
const REQUIRED_DIRS = ["iterations", "shared", "scratch", "state"];
const REQUIRED_FILES = ["README.md", "state/checkpoint.json", "state/document-status.json", "state/artifacts.json"];

async function exists(p) {
  try { await stat(p); return true; } catch { return false; }
}

async function makeProject(files = { "package.json": '{"name":"demo"}\n' }) {
  const dir = await mkdtemp(join(tmpdir(), "fst-ws-"));
  for (const [name, body] of Object.entries(files)) {
    await writeFile(join(dir, name), body, "utf8");
  }
  return dir;
}

async function gitIgnoreEntries(dir) {
  const raw = await readFile(join(dir, ".gitignore"), "utf8");
  return raw.split(/\r?\n/).filter((l) => l.trim() === ".agent-workplace/").length;
}

async function which(cmd, args) {
  try { await run(cmd, args, { shell: false }); return true; } catch { return false; }
}

// On Windows, `bash` may resolve to WSL, which cannot see the Windows temp dir
// that mkdtemp returns. Probe for a bash that shares our filesystem.
const hasBash = process.platform !== "win32"
  ? true
  : await (async () => {
      if (!(await which("bash", ["--version"]))) return false;
      try {
        const probe = tmpdir().replace(/\\/g, "/");
        const { stdout } = await run("bash", ["-c", `cd "${probe}" && pwd`], { shell: false });
        return stdout.trim().length > 0;
      } catch { return false; }
    })();

async function runSh(args) {
  const { stdout } = await run("bash", [SH.replace(/\\/g, "/"), ...args], { shell: false });
  return stdout.trim();
}

// NB: `-File` does not bind [switch] parameters reliably, so pass the script
// path positionally the same way hooks/*.ps1 are invoked.
async function runPs1(args) {
  const { stdout } = await run(
    "powershell",
    ["-NoProfile", "-ExecutionPolicy", "Bypass", PS1, ...args],
    { shell: false, maxBuffer: 8 * 1024 * 1024 },
  );
  return stdout.trim();
}

// --- 1. template completeness ---------------------------------------------

test("workspace template ships every directory fst-workplace requires", async () => {
  const tpl = join(ROOT, "templates", "agent-workplace");
  for (const d of REQUIRED_DIRS) {
    assert.ok(await exists(join(tpl, d)), `templates/agent-workplace/${d} must exist in git`);
  }
  for (const f of REQUIRED_FILES) {
    assert.ok(await exists(join(tpl, f)), `templates/agent-workplace/${f} must exist`);
  }
  // Iteration sub-stages are referenced by every fst-* skill's placement table.
  const it = join(ROOT, "templates", "iteration");
  for (const d of ["investigation", "requirements", "design", "development", "release", "meta"]) {
    assert.ok(await exists(join(it, d)), `templates/iteration/${d} must exist`);
  }
});

// --- 2. PowerShell encoding ------------------------------------------------

test("every .ps1 containing non-ASCII text carries a UTF-8 BOM", async () => {
  const targets = ["hooks", "scripts"];
  const offenders = [];
  for (const dir of targets) {
    let entries = [];
    try { entries = await readdir(join(ROOT, dir)); } catch { continue; }
    for (const name of entries) {
      if (!name.endsWith(".ps1")) continue;
      const buf = await readFile(join(ROOT, dir, name));
      const hasBom = buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf;
      const nonAscii = buf.some((b) => b > 127);
      if (nonAscii && !hasBom) offenders.push(join(dir, name));
    }
  }
  assert.deepEqual(
    offenders,
    [],
    "Windows PowerShell 5.1 decodes BOM-less .ps1 as ANSI (GBK on zh-CN), " +
    "so these files would be parsed as mojibake",
  );
});

// --- 3..7. initializer behaviour -------------------------------------------

// bash uses GNU-style flags, PowerShell uses single-dash flags.
const RUNNERS = [
  {
    label: "bash", run: runSh, rootFlag: "--root", jsonFlag: "--json", forceFlag: "--force",
    skip: hasBash ? false : "bash not available",
  },
  {
    label: "powershell", run: runPs1, rootFlag: "-Root", jsonFlag: "-Json", forceFlag: "-Force",
    skip: false,
  },
];

for (const { label, run: runInit, rootFlag, jsonFlag, forceFlag, skip } of RUNNERS) {
  test(`[${label}] initializes a fresh project`, { skip }, async () => {
    const dir = await makeProject();
    try {
      const out = JSON.parse(await runInit([rootFlag, dir, jsonFlag]));
      assert.equal(out.status, "initialized");
      assert.equal(out.current_iteration, "iteration-001");
      assert.equal(out.gitignore_entry, true);

      const wp = join(dir, ".agent-workplace");
      for (const d of REQUIRED_DIRS) {
        assert.ok(await exists(join(wp, d)), `${d} must exist after init`);
      }
      for (const f of REQUIRED_FILES) {
        assert.ok(await exists(join(wp, f)), `${f} must exist after init`);
      }
      for (const d of ["investigation", "requirements", "design", "development", "release", "meta"]) {
        assert.ok(await exists(join(wp, "iterations", "iteration-001", d)), `iteration-001/${d}`);
      }
      assert.ok(await exists(join(wp, "state", "workspace.json")), "workspace.json must be written");
      assert.ok(await exists(join(wp, "iterations", "current")), "current pointer must exist");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  test(`[${label}] is idempotent — second run changes nothing`, { skip }, async () => {
    const dir = await makeProject();
    try {
      await runInit([rootFlag, dir, jsonFlag]);
      const second = JSON.parse(await runInit([rootFlag, dir, jsonFlag]));
      assert.equal(second.status, "present", "second run must not re-initialize");
      assert.deepEqual(second.created, [], "second run must create nothing");
      assert.deepEqual(second.warnings, [], "second run must warn about nothing");
      assert.equal(await gitIgnoreEntries(dir), 1, ".gitignore entry must not be duplicated");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  test(`[${label}] preserves and extends an existing .gitignore`, { skip }, async () => {
    const dir = await makeProject({ "package.json": "{}\n", ".gitignore": "node_modules" });
    try {
      await runInit([rootFlag, dir, jsonFlag]);
      const raw = await readFile(join(dir, ".gitignore"), "utf8");
      assert.ok(raw.startsWith("node_modules"), "existing content must be preserved");
      assert.equal(await gitIgnoreEntries(dir), 1, "exactly one entry appended");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  test(`[${label}] does not duplicate the entry in a non-ASCII .gitignore`, { skip }, async () => {
    // Regression: PowerShell 5.1 reads files with the ANSI codepage unless
    // -Encoding UTF8 is passed. Decoding UTF-8 Chinese bytes as GBK swallows
    // the following \n, collapsing the file into a single line so the
    // "entry already present" check silently fails and the line is appended
    // a second time.
    const dir = await makeProject({
      "package.json": "{}\n",
      ".gitignore": "# Agent 私有工作区（全部内容不提交）\n.agent-workplace/\n",
    });
    try {
      await runInit([rootFlag, dir, jsonFlag]);
      assert.equal(await gitIgnoreEntries(dir), 1, "entry must not be duplicated");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  test(`[${label}] repairs missing template files and reports it`, { skip }, async () => {
    const dir = await makeProject();
    try {
      await runInit([rootFlag, dir, jsonFlag]);
      await rm(join(dir, ".agent-workplace", "scratch"), { recursive: true, force: true });
      await rm(join(dir, ".agent-workplace", "state", "document-status.json"), { force: true });
      const out = JSON.parse(await runInit([rootFlag, dir, jsonFlag]));
      assert.equal(out.status, "repaired", "a genuine restore must be reported as repaired");
      assert.ok(await exists(join(dir, ".agent-workplace", "scratch")));
      assert.ok(await exists(join(dir, ".agent-workplace", "state", "document-status.json")));
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  test(`[${label}] skips directories that are not project roots`, { skip }, async () => {
    const dir = await mkdtemp(join(tmpdir(), "fst-ws-empty-"));
    try {
      const out = JSON.parse(await runInit([rootFlag, dir, jsonFlag]));
      assert.equal(out.status, "skipped");
      assert.equal(out.reason, "no_project_marker");
      assert.ok(!(await exists(join(dir, ".agent-workplace"))), "must not create a workspace");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  test(`[${label}] --force initializes a directory without project markers`, { skip }, async () => {
    const dir = await mkdtemp(join(tmpdir(), "fst-ws-force-"));
    try {
      const out = JSON.parse(await runInit([rootFlag, dir, jsonFlag, forceFlag]));
      assert.equal(out.status, "initialized");
      assert.ok(await exists(join(dir, ".agent-workplace", "state", "workspace.json")));
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  test(`[${label}] records the pointer mode in state/workspace.json`, { skip }, async () => {
    const dir = await makeProject();
    try {
      await runInit([rootFlag, dir, jsonFlag]);
      const meta = JSON.parse(await readFile(join(dir, ".agent-workplace", "state", "workspace.json"), "utf8"));
      assert.equal(meta.schema, "flowstate-workspace/1");
      assert.equal(meta.current_pointer.path, "iterations/current");
      assert.equal(meta.current_pointer.target, "iterations/iteration-001");
      assert.ok(
        ["symlink", "junction", "directory", "explicit"].includes(meta.current_pointer.mode),
        `unexpected pointer mode: ${meta.current_pointer.mode}`,
      );
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
}

// --- 8. SessionStart wiring -------------------------------------------------

test("session-start injects a workspace notice", async () => {
  const dir = await makeProject();
  try {
    const parse = async (cmd, args) => {
      const { stdout } = await run(cmd, args, {
        shell: false,
        env: { ...process.env, CLAUDE_PROJECT_DIR: dir },
      });
      return JSON.parse(stdout).hookSpecificOutput.additionalContext;
    };
    if (hasBash) {
      const ctx = await parse("bash", [
        join(ROOT, "hooks", "session-start.sh").replace(/\\/g, "/"),
      ]);
      assert.ok(ctx.startsWith("FLOWSTATE_BOOTSTRAP:flowstate"), "marker preserved");
      assert.ok(/\[flowstate\] workspace:/.test(ctx), "workspace notice injected");
      assert.ok(await exists(join(dir, ".agent-workplace")), "workspace auto-created by hook");
    }
    const psCtx = await parse("powershell", [
      "-NoProfile", "-ExecutionPolicy", "Bypass", join(ROOT, "hooks", "session-start.ps1"),
    ]);
    assert.ok(psCtx.startsWith("FLOWSTATE_BOOTSTRAP:flowstate"), "ps: marker preserved");
    assert.ok(/\[flowstate\] workspace:/.test(psCtx), "ps: workspace notice injected");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
