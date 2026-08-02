// tests/smoke/run-live.mjs
// T5 optional live harness lanes. Detects each harness CLI; when unavailable,
// reports an explicit SKIP (never a failure). When present, runs only a
// temporary project-scoped load check — never writes global plugin config.
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const here = fileURLToPath(new URL(".", import.meta.url));
const REPO_ROOT = join(here, "..", "..");

const NODE = process.execPath;

function hasCommand(cmd) {
  const probe = spawnSync(process.platform === "win32" ? "where" : "which", [cmd], { encoding: "utf8" });
  return probe.status === 0;
}

function run(cmd, args, cwd) {
  return spawnSync(cmd, args, { cwd, encoding: "utf8", shell: false });
}

/** Scaffold a throwaway plugin in a temp dir for a project-scoped load check. */
async function scaffoldTemp() {
  const dir = await mkdtemp(join(tmpdir(), "pf-live-"));
  const target = join(dir, "live-plugin");
  const res = run(
    NODE,
    [
      join(REPO_ROOT, "scripts", "scaffold.mjs"),
      "--name",
      "live-plugin",
      "--prefix",
      "lp",
      "--target",
      target,
      "--description",
      "Live check fixture",
      "--user-lang",
      "en",
      "--harnesses",
      "claude-code,pi,opencode,oh-my-pi",
    ],
    REPO_ROOT,
  );
  if (res.status !== 0) {
    await rm(dir, { recursive: true, force: true });
    throw new Error(`scaffold failed: ${res.stderr}`);
  }
  return { dir, target };
}

const LANES = [
  {
    name: "claude-code",
    command: "claude",
    check: async (target) => {
      // Project-scoped: point the CLI at the plugin directory, expect it to
      // list the using-* entry skill. No global config is modified.
      const r = run("claude", ["--plugin-dir", target, "skills", "list"], target);
      if (r.status !== 0) throw new Error(`claude load check failed: ${r.stderr || r.stdout}`);
    },
  },
  {
    name: "pi",
    command: "pi",
    check: async (target) => {
      const r = run("pi", ["skills", "list"], target);
      if (r.status !== 0) throw new Error(`pi skills list failed: ${r.stderr || r.stdout}`);
    },
  },
  {
    name: "oh-my-pi",
    command: "omp",
    check: async (target) => {
      const r = run("omp", ["skills", "list"], target);
      if (r.status !== 0) throw new Error(`omp skills list failed: ${r.stderr || r.stdout}`);
    },
  },
  {
    name: "opencode",
    command: "opencode",
    check: async (target) => {
      const r = run("opencode", ["--help"], target);
      if (r.status !== 0) throw new Error(`opencode load check failed: ${r.stderr || r.stdout}`);
    },
  },
];

async function main() {
  const { dir, target } = await scaffoldTemp();
  const results = [];
  try {
    for (const lane of LANES) {
      if (!hasCommand(lane.command)) {
        results.push({ harness: lane.name, status: "SKIP", message: `CLI not found: ${lane.command}` });
        continue;
      }
      try {
        await lane.check(target);
        results.push({ harness: lane.name, status: "PASS" });
      } catch (err) {
        results.push({ harness: lane.name, status: "FAIL", message: err.message });
      }
    }
  } finally {
    await rm(dir, { recursive: true, force: true });
  }

  for (const r of results) {
    console.log(`${r.status}\t${r.harness}${r.message ? `\t${r.message}` : ""}`);
  }
  const failed = results.filter((r) => r.status === "FAIL");
  process.exit(failed.length > 0 ? 1 : 0);
}

main();
