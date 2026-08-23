#!/usr/bin/env node
/**
 * lifecycle-report.mjs — markdown lifecycle report (LIF-2).
 *
 * Runs the executable lifecycle probes (`runChecks` with the orchestration
 * layer) and renders a human-readable markdown report: run header, signal
 * distribution, severity-ranked findings, and recommendations.
 *
 * CLI:
 *   node scripts/lifecycle-report.mjs [--root <dir>] [--out <file>]
 *     --out writes the report to a file (default: print to stdout).
 *
 * Exit code: 1 when any FAIL finding exists, otherwise 0.
 */
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { runChecks } from "./verify.mjs";

const SEVERITY_ORDER = ["FAIL", "WARN", "INFO"];

/** Build the markdown report body from findings. */
export function renderLifecycleReport(root, findings) {
  const lines = [];
  lines.push("# Lifecycle Report");
  lines.push("");
  lines.push(`- **Target**: \`${root}\``);
  lines.push(`- **Generated**: ${new Date().toISOString()}`);
  lines.push(`- **Mode**: v1 pure-structural (no runtime telemetry)`);
  lines.push("");

  // --- Summary ---
  const total = findings.length;
  const bySev = Object.fromEntries(SEVERITY_ORDER.map((s) => [s, findings.filter((f) => f.severity === s).length]));
  lines.push("## Summary");
  lines.push("");
  lines.push(`| Severity | Count |`);
  lines.push(`|----------|-------|`);
  for (const s of SEVERITY_ORDER) lines.push(`| ${s} | ${bySev[s]} |`);
  lines.push(`| **Total** | **${total}** |`);
  lines.push("");

  // --- Signal distribution ---
  const bySignal = new Map();
  for (const f of findings) {
    if (!bySignal.has(f.signal)) bySignal.set(f.signal, { FAIL: 0, WARN: 0, INFO: 0 });
    bySignal.get(f.signal)[f.severity]++;
  }
  lines.push("## Signal distribution");
  lines.push("");
  if (bySignal.size === 0) {
    lines.push("_No lifecycle signals fired — the plugin is structurally healthy._");
  } else {
    lines.push("| Signal | FAIL | WARN | INFO |");
    lines.push("|--------|------|------|------|");
    for (const [signal, sev] of [...bySignal.entries()].sort()) {
      lines.push(`| \`${signal}\` | ${sev.FAIL} | ${sev.WARN} | ${sev.INFO} |`);
    }
  }
  lines.push("");

  // --- Findings ---
  lines.push("## Findings");
  lines.push("");
  if (findings.length === 0) {
    lines.push("_No findings._");
  } else {
    lines.push("| Severity | Signal | File | Action |");
    lines.push("|----------|--------|------|--------|");
    for (const f of findings) {
      const file = f.file ? `\`${f.file}\`` : "—";
      lines.push(`| ${f.severity} | \`${f.signal}\` | ${file} | ${f.action} |`);
    }
  }
  lines.push("");

  // --- Recommendations ---
  lines.push("## Recommendations");
  lines.push("");
  const recs = findings.filter((f) => f.severity !== "INFO");
  if (recs.length === 0) {
    lines.push("No FAIL/WARN findings — no structural recommendations.");
  } else {
    for (const f of recs) {
      const where = f.file ? ` (\`${f.file}\`)` : "";
      lines.push(`- **[${f.severity}]** \`${f.signal}\`${where}: ${f.action}`);
      if (f.impact) lines.push(`  - Impact: ${f.impact}`);
    }
  }
  lines.push("");
  lines.push("---");
  lines.push("_Signal severity policy: see `references/lifecycle-matrix.md`._");
  lines.push("_Trends require v2 signals (trigger frequency, eval pass rate, feedback themes, install counts) — see the v2 roadmap in `references/lifecycle-matrix.md`._");
  return lines.join("\n") + "\n";
}

function parseArgs(argv) {
  const args = { root: process.cwd(), out: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--root") args.root = argv[++i];
    else if (a === "--out") args.out = argv[++i];
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  let result;
  try {
    result = await runChecks(args.root, { layers: ["orchestration"] });
  } catch (err) {
    console.error(`lifecycle-report: failed: ${err.message}`);
    process.exit(2);
  }
  const report = renderLifecycleReport(args.root, result.findings);
  if (args.out) {
    const outPath = join(process.cwd(), args.out);
    await writeFile(outPath, report, "utf8");
    console.log(`Lifecycle report written to ${outPath}`);
  } else {
    console.log(report);
  }
  process.exit(result.findings.some((f) => f.severity === "FAIL") ? 1 : 0);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
