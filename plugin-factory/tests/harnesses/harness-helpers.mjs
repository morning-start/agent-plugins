// tests/harnesses/harness-helpers.mjs
// Shared helpers for the per-harness verification tests.
//
// Each test file under tests/harnesses/ verifies ONE harness end-to-end:
// scaffold a plugin with that harness alone, assert the harness's root-level
// artifacts and its quick-install scripts (install.sh / install.ps1), then run
// the generated plugin's own verifier. Keeping the helpers here (not a
// *.test.mjs file) means each harness test stays a single, separately
// invocable script while sharing the boilerplate.
import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { scaffoldPlugin } from "../../tools/scaffold/scaffold.mjs";

export const REPO_ROOT = fileURLToPath(new URL("../..", import.meta.url));
export const NODE = process.execPath;

/** Scaffold input defaults shared by every harness test. */
export const BASE = {
  name: "git-release",
  prefix: "gr",
  description: "Release workflow helper",
  userLang: "zh-CN",
};

/** Root-level artifacts a plugin must carry for the given harness. */
export const ROOT_ARTIFACTS = {
  "claude-code": [
    ".claude-plugin/plugin.json",
    "hooks/hooks.json",
    "hooks/session-start.sh",
    "hooks/session-start.ps1",
    "hooks/post-tool-verify.sh",
    "hooks/post-tool-verify.ps1",
  ],
  pi: [".pi/extensions/gr-bootstrap.ts"],
  opencode: [".opencode/opencode.json", ".opencode/plugins/gr-bootstrap.ts", ".opencode/INSTALL.md"],
  "oh-my-pi": [".pi/extensions/gr-bootstrap.ts", "OMP-NOTES.md"],
  codex: [".codex-plugin/plugin.json"],
};

/** Root-level paths that must NOT exist when only this harness is requested. */
export const FORBIDDEN_ROOT_PATHS = {
  "claude-code": [".pi", ".opencode", ".codex-plugin", "OMP-NOTES.md"],
  pi: [".claude-plugin", ".opencode", ".codex-plugin", "OMP-NOTES.md"],
  opencode: [".claude-plugin", ".pi", ".codex-plugin", "OMP-NOTES.md"],
  "oh-my-pi": [".claude-plugin", ".opencode", ".codex-plugin"],
  codex: [".claude-plugin", ".pi", ".opencode", "OMP-NOTES.md"],
};

/** Distinctive install line each harness advertises in install.sh / install.ps1. */
export const INSTALL_LINE = {
  "claude-code": "Claude Code: claude --plugin-dir",
  pi: "pi:          pi install git:github.com/<owner>/git-release",
  opencode: "opencode:    see .opencode/INSTALL.md",
  "oh-my-pi": "oh-my-pi:    omp plugin install git:github.com/<owner>/git-release",
  codex: "codex:       copy to ~/.agents/plugins/",
};

/** README install-section header per harness. */
export const INSTALL_SECTION = {
  "claude-code": "### Claude Code",
  pi: "### pi",
  opencode: "### opencode",
  "oh-my-pi": "### oh-my-pi (omp)",
  codex: "### Codex / ChatGPT",
};

export async function exists(p) {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

/** Temp dir with cleanup; Windows-safe (spawned node may hold handles briefly). */
export async function withTemp(fn) {
  const dir = await mkdtemp(join(tmpdir(), "pf-harness-"));
  try {
    return await fn(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

/** Spawn a command synchronously and return { status, stdout, stderr }. */
export function run(cmd, args, cwd) {
  return spawnSync(cmd, args, { cwd, encoding: "utf8", shell: false, env: process.env });
}

/** Scaffold a plugin with exactly one harness into `target`. */
export function scaffoldSingle(target, harness) {
  return scaffoldPlugin({ ...BASE, target, harnesses: [harness] });
}

/** Run the generated plugin's own verifier (all layers). */
export function runGeneratedVerify(target) {
  return run(NODE, ["scripts/verify.mjs", "--root", ".", "--format", "table"], target);
}

/**
 * Assert install.sh / install.ps1 advertise exactly the requested harness:
 * the harness's line must be present, and every other harness's line absent.
 */
export async function assertInstallScripts(target, harness) {
  const expected = INSTALL_LINE[harness];
  for (const rel of ["install.sh", "install.ps1"]) {
    const text = await readFile(join(target, rel), "utf8");
    if (!text.includes(expected)) {
      throw new Error(`${rel} must advertise ${harness}: missing "${expected}"`);
    }
    for (const [h, line] of Object.entries(INSTALL_LINE)) {
      if (h !== harness && text.includes(line)) {
        throw new Error(`${rel} must not advertise ${h} in a ${harness}-only scaffold`);
      }
    }
  }
}
