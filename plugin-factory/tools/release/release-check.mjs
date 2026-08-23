#!/usr/bin/env node
/**
 * release-check.mjs — release-preparation gate.
 *
 * Runs, in order: version check → version audit → executable verifier →
 * CHANGELOG entry for the current version → advertised-harness artifact check
 * → clean worktree check. Publication (tagging/pushing) is NOT part of this
 * step — it never creates tags or pushes remotes.
 *
 * CLI:
 *   node scripts/release-check.mjs --root <dir> [--json]
 *
 * Exit code: 1 when any release-blocking finding exists, otherwise 0.
 */
import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { checkVersions, auditVersions } from "../version/version.mjs";
import { runChecks } from "../verify/verify.mjs";

const HARNESS_MANIFESTS = [
  ".claude-plugin/plugin.json",
  ".opencode/opencode.json",
  "package.json",
];

/** Check the CHANGELOG mentions the current version. */
async function changelogCheck(root, version, findings) {
  let text = "";
  try {
    text = await readFile(join(root, "CHANGELOG.md"), "utf8");
  } catch {
    findings.push({
      signal: "missing-changelog-entry",
      file: "CHANGELOG.md",
      severity: "FAIL",
      action: "Create CHANGELOG.md with an entry for the current version.",
      impact: "Release history is not evidence-backed.",
    });
    return;
  }
  if (!text.includes(`[${version}]`) && !text.includes(`## ${version}`)) {
    findings.push({
      signal: "missing-changelog-entry",
      file: "CHANGELOG.md",
      severity: "FAIL",
      action: `Add a CHANGELOG entry for version ${version}.`,
      impact: "The release has no changelog evidence.",
    });
  }
}

/** Check every advertised harness has its manifest present. */
async function harnessArtifactCheck(root, findings) {
  const { collectHarnesses } = await import("../verify/verify.mjs");
  const harnesses = await collectHarnesses(root);
  for (const h of harnesses) {
    const rel =
      h === "claude-code" ? ".claude-plugin/plugin.json" : h === "opencode" ? ".opencode/opencode.json" : "package.json";
    try {
      await stat(join(root, rel));
    } catch {
      findings.push({
        signal: "missing-harness-artifact",
        file: rel,
        severity: "FAIL",
        action: `Create ${rel}.`,
        impact: `Advertised harness "${h}" is missing its manifest (${rel}).`,
      });
    }
  }
}

/** Check the git worktree is clean (untracked/tracked changes block release). */
async function worktreeCheck(root, findings) {
  const { spawnSync } = await import("node:child_process");
  const git = spawnSync("git", ["status", "--porcelain"], { cwd: root, encoding: "utf8" });
  if (git.status !== 0 || !git.stdout || git.stdout.trim() === "") return;
  findings.push({
    signal: "dirty-worktree",
    file: ".",
    severity: "FAIL",
    action: "Commit or stash all changes before release (do not delete user changes).",
    impact: "A dirty worktree makes the release non-reproducible.",
  });
}

/**
 * Run the full release-preparation gate.
 * @param {string} root
 * @returns {Promise<{ok: boolean, version: string|null, findings: object[]}>}
 */
export async function runReleaseChecks(root) {
  const findings = [];

  // 1. Version check
  const vc = await checkVersions(root);
  if (!vc.ok) {
    findings.push({
      signal: "version-drift",
      file: ".version-bump.json",
      severity: "FAIL",
      action: "Align all declared versions to a single value.",
      impact: vc.errors.join("; "),
    });
  }
  const version = vc.version;

  // 2. Version audit (undeclared references)
  const va = await auditVersions(root);
  if (!va.ok && va.undeclared.length > 0) {
    findings.push({
      signal: "version-drift",
      file: va.undeclared[0],
      severity: "FAIL",
      action: "Declare or remove undeclared version references.",
      impact: `Undeclared references: ${va.undeclared.join(", ")}.`,
    });
  }

  // 3. Executable verifier (structure + harness)
  const verify = await runChecks(root, { layers: ["structure", "harness"] });
  const fails = verify.findings.filter((f) => f.severity === "FAIL");
  if (fails.length > 0) {
    findings.push({
      signal: "verification-failed",
      file: fails[0].file || ".",
      severity: "FAIL",
      action: "Fix all FAIL findings from `npm run verify` before release.",
      impact: `${fails.length} FAIL finding(s) from the verifier.`,
    });
  }

  // 4. CHANGELOG entry for the current version
  if (version) await changelogCheck(root, version, findings);

  // 5. Advertised-harness artifact check
  await harnessArtifactCheck(root, findings);

  // 6. Clean worktree
  await worktreeCheck(root, findings);

  return { ok: findings.length === 0, version, findings };
}

async function main() {
  const args = process.argv.slice(2);
  let root = process.cwd();
  let json = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--root") root = args[++i];
    else if (args[i] === "--json") json = true;
  }
  const result = await runReleaseChecks(root);
  if (json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(`release-check: ${result.ok ? "PASS" : "FAIL"} (version ${result.version ?? "n/a"})`);
    for (const f of result.findings) {
      console.log(`  ${f.severity}\t${f.signal}\t${f.file}\t${f.action}`);
    }
    if (result.ok) console.log("All release-preparation checks passed.");
  }
  process.exit(result.ok ? 0 : 1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
