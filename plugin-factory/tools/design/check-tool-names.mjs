#!/usr/bin/env node
/**
 * check-tool-names.mjs — "skills name actions, not tools" gate (DES-3).
 *
 * Scans skill bodies for concrete agent-tool references (backticked tool names
 * or call syntax like `Read(...)`) and emits WARN findings — skill bodies must
 * say "invoke a skill", "dispatch a subagent", "read a file", never name a
 * specific harness tool. The per-harness tool mapping lives in the generated
 * `references/<harness>-tools.md`, not in skill bodies.
 *
 * CLI:
 *   node scripts/check-tool-names.mjs [--root <dir>] [--format table|json]
 *
 * Exit code: 1 when any WARN finding exists, otherwise 0.
 */
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { collectSkills } from "./verify.mjs";

/** Agent-harness tool names that must not be referenced from skill bodies. */
const AGENT_TOOLS = new Set([
  "Read", "Write", "Edit", "Bash", "Grep", "Glob", "List",
  "WebFetch", "WebSearch", "TodoWrite", "MultiEdit", "NotebookEdit",
  "Task", "Memory", "Fetch", "Search",
]);

/** Call-syntax tools: `ToolName(` — restricted to capitalized agent tools. */
const CALL_RE = /\b(Read|Write|Edit|Bash|Grep|Glob|List|WebFetch|WebSearch|TodoWrite|MultiEdit|NotebookEdit|Task|Memory)\(/g;

/**
 * Find tool-name references in a skill body.
 * @param {string} text - full SKILL.md text (frontmatter included).
 * @returns {{tool: string, line: number}[]} hits, or [] when clean.
 */
export function toolNameHits(text) {
  const hits = [];
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const m of line.matchAll(/`([A-Za-z_][A-Za-z0-9_]*)`/g)) {
      if (AGENT_TOOLS.has(m[1])) hits.push({ tool: m[1], line: i + 1 });
    }
    for (const m of line.matchAll(CALL_RE)) {
      hits.push({ tool: m[1], line: i + 1 });
    }
  }
  return hits;
}

/**
 * Check all skill bodies under `<root>/skills/` for tool-name references.
 * @param {string} root
 * @returns {Promise<{root: string, findings: object[]}>} findings use the
 *   stable shape {signal, file, severity, action, impact} with signal
 *   `tool-name-ref` and severity WARN.
 */
export async function checkToolNames(root) {
  const findings = [];
  const skills = await collectSkills(root);
  for (const s of skills) {
    if (!s.text) continue;
    const rel = `skills/${s.rel}SKILL.md`;
    for (const { tool, line } of toolNameHits(s.text)) {
      findings.push({
        signal: "tool-name-ref",
        file: `${rel}:${line}`,
        severity: "WARN",
        action: `Replace "${tool}" with an action phrase ("invoke a skill", "dispatch a subagent", "read a file").`,
        impact: "Skill bodies name actions, not harness tools; the tool mapping belongs in references/<harness>-tools.md.",
      });
    }
  }
  return { root, findings };
}

function parseArgs(argv) {
  const args = { root: process.cwd(), format: "table" };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--root") args.root = argv[++i];
    else if (a === "--format") args.format = argv[++i];
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  let result;
  try {
    result = await checkToolNames(args.root);
  } catch (err) {
    console.error(`check-tool-names: failed: ${err.message}`);
    process.exit(2);
  }
  if (args.format === "json") {
    console.log(JSON.stringify(result, null, 2));
  } else {
    if (result.findings.length === 0) {
      console.log("No tool-name references. Skills name actions, not tools.");
    } else {
      for (const f of result.findings) {
        console.log(`${f.severity}\t${f.signal}\t${f.file}\t${f.action}`);
      }
    }
  }
  process.exit(result.findings.length > 0 ? 1 : 0);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
