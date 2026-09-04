#!/usr/bin/env node
/*
 * Deterministic repository quality check entry point for the MoonBit Skills repository.
 *
 * This script is the SINGLE entry point for all repository-level deterministic checks.
 * It is used both locally and in CI (see .github/workflows/ci.yml).
 *
 * Checks:
 *  1. JSON syntax validation (all .json files)
 *  2. Plugin metadata validation (via scripts/check-plugin-metadata.mjs)
 *  3. Bash shell syntax check (bash -n on all .sh files)
 *  4. JavaScript syntax check (node --check on all .js/.mjs files under scripts/)
 *  5. Repository consistency checks (via scripts/check-pipeline-consistency.mjs)
 *  6. Git diff --check (whitespace/merge conflict markers)
 *  7. Working tree check
 *
 * Usage:
 *   node scripts/run-repo-checks.mjs [--verbose] [--allow-working-tree]
 *   node scripts/run-repo-checks.mjs --skip-shell  (for Windows without bash)
 */

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const SCRIPTS_DIR = path.join(REPO_ROOT, "scripts");

const rel = (p) => path.relative(REPO_ROOT, p).split(path.sep).join("/");

/** Recursively find files by extension, skipping .git / node_modules / __pycache__. */
function rglob(dir, predicate) {
  const out = [];
  let entries = [];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (entry.name === ".git" || entry.name === "node_modules" || entry.name === "__pycache__") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...rglob(full, predicate));
    } else if (predicate(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

class CheckResult {
  constructor(name, passed, details = []) {
    this.name = name;
    this.passed = passed;
    this.details = details;
  }

  toString() {
    const status = this.passed ? "PASS" : "FAIL";
    return `[${status}] ${this.name}`;
  }

  toDict() {
    return { name: this.name, passed: this.passed, details: this.details };
  }
}

function checkJsonSyntax() {
  const errors = [];
  let count = 0;
  for (const jsonFile of rglob(REPO_ROOT, (n) => n.endsWith(".json"))) {
    count += 1;
    try {
      JSON.parse(fs.readFileSync(jsonFile, "utf-8"));
    } catch (e) {
      errors.push(`${rel(jsonFile)}: ${e.message}`);
    }
  }
  const passed = errors.length === 0;
  const details = [`Checked ${count} JSON files`];
  if (errors.length) details.push(...errors);
  return new CheckResult("JSON syntax validation", passed, details);
}

function checkPluginMetadata() {
  const metaScript = path.join(SCRIPTS_DIR, "check-plugin-metadata.mjs");
  if (!fs.existsSync(metaScript)) {
    return new CheckResult("Plugin metadata", false, ["check-plugin-metadata.mjs not found"]);
  }
  try {
    const result = spawnSync(process.execPath, [metaScript], {
      encoding: "utf-8",
      timeout: 30000,
      maxBuffer: 10 * 1024 * 1024,
    });
    const passed = result.status === 0;
    const details = [];
    if (result.stdout && result.stdout.trim()) details.push(result.stdout.trim());
    if (result.stderr && result.stderr.trim()) details.push(result.stderr.trim());
    return new CheckResult("Plugin metadata validation", passed, details);
  } catch (e) {
    return new CheckResult("Plugin metadata validation", false, [String(e.message || e)]);
  }
}

function checkBashSyntax() {
  const errors = [];
  let count = 0;
  for (const shFile of rglob(REPO_ROOT, (n) => n.endsWith(".sh"))) {
    count += 1;
    try {
      // Pass a repo-relative POSIX path (not an absolute Windows path): Git Bash
      // treats a backslash like `\c` as an escape, so `E:\...\foo.sh` resolves to
      // the wrong file. Running with cwd=REPO_ROOT lets bash resolve `hooks/foo.sh`.
      const result = spawnSync("bash", ["-n", rel(shFile)], {
        encoding: "utf-8",
        timeout: 10000,
        maxBuffer: 10 * 1024 * 1024,
        cwd: REPO_ROOT,
      });
      if (result.status !== 0) {
        errors.push(`${rel(shFile)}: ${(result.stderr || "").trim()}`);
      }
    } catch (e) {
      if (e && e.code === "ENOENT") {
        return new CheckResult("Bash syntax", false, ["bash not found on this system"]);
      }
      errors.push(`${rel(shFile)}: timed out`);
    }
  }
  const passed = errors.length === 0;
  const details = [`Checked ${count} shell scripts`];
  if (errors.length) details.push(...errors);
  return new CheckResult("Bash shell syntax", passed, details);
}

function checkJsSyntax() {
  const errors = [];
  let count = 0;
  const jsFiles = rglob(SCRIPTS_DIR, (n) => n.endsWith(".mjs") || n.endsWith(".js"));
  for (const jsFile of jsFiles) {
    count += 1;
    try {
      const result = spawnSync(process.execPath, ["--check", jsFile], {
        encoding: "utf-8",
        timeout: 10000,
        maxBuffer: 10 * 1024 * 1024,
      });
      if (result.status !== 0) {
        errors.push(`${rel(jsFile)}: ${(result.stderr || "").trim()}`);
      }
    } catch (e) {
      errors.push(`${rel(jsFile)}: timed out`);
    }
  }
  const passed = errors.length === 0;
  const details = [`Checked ${count} JavaScript files`];
  if (errors.length) details.push(...errors);
  return new CheckResult("JavaScript syntax", passed, details);
}

function checkRepoConsistency() {
  const checkScript = path.join(SCRIPTS_DIR, "check-pipeline-consistency.mjs");
  if (!fs.existsSync(checkScript)) {
    return new CheckResult("Repository consistency", false, ["check-pipeline-consistency.mjs not found"]);
  }
  try {
    const result = spawnSync(process.execPath, [checkScript], {
      encoding: "utf-8",
      timeout: 60000,
      maxBuffer: 10 * 1024 * 1024,
    });
    const passed = result.status === 0;
    const details = [];
    if (result.stdout && result.stdout.trim()) {
      const lines = result.stdout.trim().split("\n");
      details.push(lines[lines.length - 1]); // Last line: PASS/FAIL
    }
    if (result.stderr && result.stderr.trim()) {
      details.push(...result.stderr.trim().split("\n"));
    }
    return new CheckResult("Repository consistency checks", passed, details);
  } catch (e) {
    return new CheckResult("Repository consistency checks", false, [String(e.message || e)]);
  }
}

function checkGitDiffCheck() {
  try {
    const result = spawnSync("git", ["diff", "--check"], {
      encoding: "utf-8",
      timeout: 10000,
      cwd: REPO_ROOT,
      maxBuffer: 10 * 1024 * 1024,
    });
    const passed = result.status === 0;
    const details = [];
    if (result.stdout && result.stdout.trim()) details.push(result.stdout.trim());
    if (result.stderr && result.stderr.trim()) details.push(result.stderr.trim());
    return new CheckResult("Git diff --check (whitespace/conflicts)", passed, details);
  } catch (e) {
    if (e && e.code === "ENOENT") {
      return new CheckResult("Git diff --check", false, ["git not found"]);
    }
    return new CheckResult("Git diff --check", false, ["Timed out"]);
  }
}

function checkWorkingTree(allowChanges = false) {
  try {
    const result = spawnSync("git", ["status", "--porcelain"], {
      encoding: "utf-8",
      timeout: 10000,
      cwd: REPO_ROOT,
      maxBuffer: 10 * 1024 * 1024,
    });
    if (result.status !== 0) {
      return new CheckResult("Working tree check", false, ["git status failed"]);
    }

    const output = (result.stdout || "").trim();
    if (!output) {
      return new CheckResult("Working tree clean", true, ["No unexpected changes"]);
    }
    if (allowChanges) {
      return new CheckResult("Working tree check", true, ["Working tree changes allowed by --allow-working-tree"]);
    }

    // Filter out allowed artifacts
    const lines = output.split("\n").filter((line) => line.trim());
    // Known allowable: .mbti files, generated docs
    const allowedPatterns = ["pkg.generated.mbti", "moon.mod", "moon.pkg"];
    const known = [];
    const unexpected = [];
    for (const line of lines) {
      const p = line.slice(3).trim();
      if (allowedPatterns.some((pat) => p.includes(pat))) {
        known.push(p);
      } else {
        unexpected.push(line);
      }
    }

    if (unexpected.length) {
      return new CheckResult("Working tree clean", false, [
        `Unexpected changes: ${unexpected.length}`,
        ...unexpected.slice(0, 10),
      ]);
    }
    return new CheckResult("Working tree clean", true, [`Only known artifacts: ${JSON.stringify(known)}`]);
  } catch (e) {
    return new CheckResult("Working tree check", false, [String(e.message || e)]);
  }
}

function parseArgs(argv) {
  const args = {
    verbose: false,
    skipShell: false,
    allowWorkingTree: false,
    format: "text",
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    switch (a) {
      case "--verbose":
      case "-v":
        args.verbose = true;
        break;
      case "--skip-shell":
        args.skipShell = true;
        break;
      case "--allow-working-tree":
        args.allowWorkingTree = true;
        break;
      case "--format":
        args.format = argv[++i] || "text";
        break;
      default:
        if (a.startsWith("--format=")) args.format = a.slice("--format=".length);
    }
  }
  return args;
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  const checks = [
    { name: "JSON syntax", fn: checkJsonSyntax },
    { name: "Plugin metadata", fn: checkPluginMetadata },
    { name: "JS syntax", fn: checkJsSyntax },
    { name: "Repository consistency", fn: checkRepoConsistency },
    { name: "Git whitespace", fn: checkGitDiffCheck },
    { name: "Working tree", fn: () => checkWorkingTree(args.allowWorkingTree) },
  ];

  if (!args.skipShell) {
    checks.splice(2, 0, { name: "Bash syntax", fn: checkBashSyntax });
  }

  const results = [];
  let failed = false;

  for (const { name, fn } of checks) {
    const result = fn();
    results.push(result.toDict());
    if (!result.passed) failed = true;
    if (args.format === "text") {
      console.log(result.toString());
      if (args.verbose && result.details.length) {
        for (const d of result.details) console.log(`    ${d}`);
      }
    }
  }

  if (args.format === "json") {
    console.log(JSON.stringify({ failed, checks: results }, null, 2));
  }

  if (args.format === "text") {
    console.log(`\n${"=".repeat(40)}`);
    const passedCount = results.filter((r) => r.passed).length;
    const totalCount = results.length;
    console.log(`Results: ${passedCount}/${totalCount} passed`);
    console.log(failed ? "OVERALL: FAILED" : "OVERALL: PASSED");
  }

  process.exitCode = failed ? 1 : 0;
}

main();
