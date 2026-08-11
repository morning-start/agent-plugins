#!/usr/bin/env node
/**
 * check-conflicts.mjs — automatic trigger-domain conflict detection (DES-5).
 *
 * Replaces the manual `orchestration.conflicts` declarations in pf-design with
 * a deterministic Jaccard-similarity check over skill trigger domains, reusing
 * the same probe logic as verify.mjs (`keywordBag` / `jaccard` / `collectSkills`
 * / `parseFrontmatter`). Overlapping trigger domains are reported with their
 * similarity score so the designer can merge the skills or declare the
 * exception explicitly.
 *
 * Input: either a plugin root (`--root`, scans skill trigger descriptions under
 * `skills/`) or a JSON component manifest (`--manifest`, reads
 * `components.skills[].triggers`).
 *
 * CLI:
 *   node scripts/check-conflicts.mjs --root <dir> [--format table|json]
 *   node scripts/check-conflicts.mjs --manifest <manifest.json> [--format table|json]
 *
 * Exit code: 1 when any FAIL (exact) finding exists, otherwise 0 (WARN exits 0).
 */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { collectSkills, keywordBag, jaccard } from "./verify.mjs";

/** Overlap threshold matching verify.mjs's trigger-overlap probe. */
export const OVERLAP_THRESHOLD = 0.85;

/**
 * Compare every pair of trigger domains and report overlaps.
 * @param {{name: string, triggers: string}[]} skills - {name, triggers} pairs.
 * @returns {{a: string, b: string, similarity: number, exact: boolean}[]}
 */
export function findTriggerOverlaps(skills) {
  const overlaps = [];
  for (let i = 0; i < skills.length; i++) {
    for (let j = i + 1; j < skills.length; j++) {
      const ta = String(skills[i].triggers ?? "");
      const tb = String(skills[j].triggers ?? "");
      const sim = jaccard(keywordBag(ta), keywordBag(tb));
      const exact = ta.trim().toLowerCase() === tb.trim().toLowerCase();
      if (exact || sim >= OVERLAP_THRESHOLD) {
        overlaps.push({
          a: skills[i].name,
          b: skills[j].name,
          similarity: Math.round(sim * 1000) / 1000,
          exact,
        });
      }
    }
  }
  return overlaps;
}

/** Read trigger domains from a plugin root (SKILL.md descriptions under skills/). */
export async function skillsFromRoot(root) {
  const collected = await collectSkills(root);
  const out = [];
  for (const s of collected) {
    if (!s.text || !s.fm) continue;
    out.push({ name: s.dirName, triggers: s.fm.description ?? "" });
  }
  return out;
}

/** Read trigger domains from a JSON component manifest. */
export async function skillsFromManifest(manifestPath) {
  const raw = await readFile(manifestPath, "utf8");
  const manifest = JSON.parse(raw);
  const listed = manifest?.components?.skills ?? [];
  if (!Array.isArray(listed)) return [];
  return listed.map((s) => ({
    name: s.name ?? "?",
    triggers: s.triggers ?? s.capability ?? "",
  }));
}

/**
 * Run conflict detection over trigger domains.
 * @param {{name: string, triggers: string}[]} skills
 * @returns {{root: string, findings: object[]}} findings use the stable
 *   {signal, file, severity, action, impact} shape with signal `trigger-conflict`.
 */
export function runConflictCheck(skills) {
  const findings = [];
  for (const o of findTriggerOverlaps(skills)) {
    findings.push({
      signal: "trigger-conflict",
      file: `skills/${o.a}/SKILL.md`,
      severity: o.exact ? "FAIL" : "WARN",
      action: o.exact
        ? `Merge ${o.a} and ${o.b} — identical trigger domains.`
        : `Merge ${o.a} and ${o.b}, or declare the exception in orchestration.conflicts (Jaccard ${o.similarity} >= ${OVERLAP_THRESHOLD}).`,
      impact: `Trigger domain overlaps with skills/${o.b}/SKILL.md.`,
    });
  }
  return { findings };
}

function parseArgs(argv) {
  const args = { root: null, manifest: null, format: "table" };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--root") args.root = argv[++i];
    else if (a === "--manifest") args.manifest = argv[++i];
    else if (a === "--format") args.format = argv[++i];
  }
  return args;
}

function usage() {
  console.error(
    [
      "Usage:",
      "  node scripts/check-conflicts.mjs --root <dir> [--format table|json]",
      "  node scripts/check-conflicts.mjs --manifest <manifest.json> [--format table|json]",
    ].join("\n"),
  );
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.root && !args.manifest) {
    usage();
    process.exit(2);
  }
  let skills;
  let label;
  try {
    if (args.manifest) {
      skills = await skillsFromManifest(args.manifest);
      label = `manifest:${join(".", args.manifest)}`;
    } else {
      skills = await skillsFromRoot(args.root);
      label = args.root;
    }
  } catch (err) {
    console.error(`check-conflicts: failed: ${err.message}`);
    process.exit(2);
  }
  const { findings } = runConflictCheck(skills);
  if (args.format === "json") {
    console.log(JSON.stringify({ root: label, findings }, null, 2));
  } else {
    if (findings.length === 0) {
      console.log("No trigger-domain conflicts. Orchestration is clean.");
    } else {
      console.log("SEVERITY\tSIGNAL\tFILE\tACTION");
      for (const f of findings) console.log(`${f.severity}\t${f.signal}\t${f.file}\t${f.action}`);
    }
  }
  process.exit(findings.some((f) => f.severity === "FAIL") ? 1 : 0);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
