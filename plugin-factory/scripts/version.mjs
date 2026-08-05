#!/usr/bin/env node
/**
 * version.mjs — cross-platform version core.
 *
 * Strict SemVer parsing plus read/write of declared version fields (driven by
 * `.version-bump.json`). Bash and PowerShell wrappers (bump-version.sh /
 * bump-version.ps1) delegate here — no duplicate parsing logic in shell.
 *
 * CLI:
 *   node scripts/version.mjs check
 *   node scripts/version.mjs audit
 *   node scripts/version.mjs bump <X.Y.Z>
 *
 * Exit code: 1 on drift / missing / invalid input, otherwise 0.
 */
import { readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const SEMVER_RE = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;

/** Strict SemVer validation; throws with a clear message on invalid input. */
export function parseSemVer(v) {
  if (typeof v !== "string" || v.trim() === "") {
    throw new Error(`invalid SemVer: ${JSON.stringify(v)} (empty)`);
  }
  const m = SEMVER_RE.exec(v.trim());
  if (!m) {
    throw new Error(`invalid SemVer: ${JSON.stringify(v)} (expected X.Y.Z or X.Y.Z-prerelease)`);
  }
  return { major: Number(m[1]), minor: Number(m[2]), patch: Number(m[3]), prerelease: m[4] || null };
}

/** Read `.version-bump.json` declarations. */
export async function readConfig(root) {
  const path = join(root, ".version-bump.json");
  const raw = await readFile(path, "utf8");
  const cfg = JSON.parse(raw);
  if (!Array.isArray(cfg.files) || cfg.files.length === 0) {
    throw new Error(`version: .version-bump.json has no "files" array (${path})`);
  }
  return cfg;
}

/** Read a dotted field path (".version" → obj.version; ".pi.skills" → nested). */
function readField(obj, field) {
  const parts = field.replace(/^\./, "").split(".");
  let cur = obj;
  for (const p of parts) {
    if (cur === null || cur === undefined || typeof cur !== "object" || !(p in cur)) {
      return undefined;
    }
    cur = cur[p];
  }
  return cur;
}

/** Write a dotted field path preserving other content. */
function writeField(obj, field, value) {
  const parts = field.replace(/^\./, "").split(".");
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    if (typeof cur[p] !== "object" || cur[p] === null) cur[p] = {};
    cur = cur[p];
  }
  cur[parts[parts.length - 1]] = value;
  return obj;
}

/** All declared { path, field } entries with absolute paths. */
export async function declaredEntries(root) {
  const cfg = await readConfig(root);
  return cfg.files.map((f) => ({ path: join(root, f.path), rel: f.path, field: f.field }));
}

/**
 * Check all declared version fields are present and identical.
 * @returns {Promise<{ok: boolean, version: string|null, errors: string[]}>}
 */
export async function checkVersions(root) {
  const entries = await declaredEntries(root);
  const errors = [];
  const versions = [];
  for (const e of entries) {
    let raw;
    try {
      raw = await readFile(e.path, "utf8");
    } catch (err) {
      errors.push(`MISSING ${e.rel} (${e.field}) — ${err.code || err.message}`);
      continue;
    }
    let json;
    try {
      json = JSON.parse(raw);
    } catch (err) {
      errors.push(`BAD JSON ${e.rel} — ${err.message}`);
      continue;
    }
    const v = readField(json, e.field);
    if (v === undefined || v === null || String(v).trim() === "") {
      errors.push(`MISSING FIELD ${e.rel} (${e.field})`);
      continue;
    }
    try {
      parseSemVer(String(v));
    } catch (err) {
      errors.push(`INVALID ${e.rel} (${e.field}) — ${err.message}`);
      continue;
    }
    versions.push(String(v));
  }
  const uniq = new Set(versions);
  if (uniq.size > 1) {
    errors.push(`DRIFT — declared versions differ: ${[...uniq].join(" vs ")}`);
  }
  return { ok: errors.length === 0, version: uniq.size === 1 ? [...uniq][0] : null, errors };
}

/**
 * Audit tracked files for undeclared references to the current version.
 * @returns {Promise<{ok: boolean, version: string|null, undeclared: string[]}>}
 */
export async function auditVersions(root) {
  const { ok, version, errors } = await checkVersions(root);
  if (!ok) return { ok: false, version: null, undeclared: [], errors };
  const cfg = await readConfig(root);
  const excludes = new Set(cfg.audit?.exclude ?? []);
  const declared = new Set((await declaredEntries(root)).map((e) => e.rel));
  const undeclared = [];
  // Walk tracked files (respect .gitignore via git ls-files when available).
  const { spawnSync } = await import("node:child_process");
  const git = spawnSync("git", ["ls-files"], { cwd: root, encoding: "utf8" });
  const files = git.status === 0 && git.stdout ? git.stdout.split(/\r?\n/).filter(Boolean) : await fallbackWalk(root);
  const needle = version;
  for (const rel of files) {
    if (declared.has(rel)) continue;
    if (excludes.has(rel) || [...excludes].some((x) => rel.startsWith(x + "/"))) continue;
    let text;
    try {
      text = await readFile(join(root, rel), "utf8");
    } catch {
      continue;
    }
    const lines = text.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(needle)) {
        undeclared.push(`${rel}:${i + 1}`);
        break;
      }
    }
  }
  return { ok: undeclared.length === 0, version, undeclared, errors };
}

/** Fallback directory walk when git is unavailable. */
async function fallbackWalk(root, dir = ".", acc = []) {
  const abs = join(root, dir);
  let entries;
  try {
    entries = await readdir(abs, { withFileTypes: true });
  } catch {
    return acc;
  }
  for (const e of entries) {
    if (e.name === ".git" || e.name === "node_modules") continue;
    const rel = dir === "." ? e.name : `${dir}/${e.name}`;
    if (e.isDirectory()) await fallbackWalk(root, rel, acc);
    else if (/\.(md|json|ts|mjs|js|sh|ps1|yml|yaml|toml)$/.test(e.name)) acc.push(rel);
  }
  return acc;
}

/** Bump every declared field to `newVersion` (atomic: validate before writing). */
export async function bumpVersions(root, newVersion) {
  parseSemVer(newVersion); // throws on invalid
  const entries = await declaredEntries(root);
  for (const e of entries) {
    const raw = await readFile(e.path, "utf8");
    const json = JSON.parse(raw);
    writeField(json, e.field, newVersion);
    await writeFile(e.path, JSON.stringify(json, null, 2) + "\n", "utf8");
  }
}

function usage() {
  console.log("Usage: node scripts/version.mjs check | audit | bump <X.Y.Z>");
}

async function main() {
  const [cmd, arg] = process.argv.slice(2);
  const root = process.cwd();
  try {
    if (cmd === "check") {
      const r = await checkVersions(root);
      console.log(`Version check: ${r.ok ? `OK (${r.version})` : "FAILED"}`);
      for (const e of r.errors) console.log(`  FAIL: ${e}`);
      process.exit(r.ok ? 0 : 1);
    } else if (cmd === "audit") {
      const r = await auditVersions(root);
      console.log(`Version: ${r.version ?? "(none)"}`);
      if (r.undeclared.length > 0) {
        console.log("UNDECLARED files containing the version:");
        for (const u of r.undeclared) console.log(`  ${u}`);
        process.exit(1);
      }
      console.log("No undeclared references. All clear.");
      process.exit(0);
    } else if (cmd === "bump") {
      if (!arg) {
        usage();
        process.exit(2);
      }
      parseSemVer(arg);
      await bumpVersions(root, arg);
      console.log(`Bumped declared files to ${arg}`);
      const r = await auditVersions(root);
      if (!r.ok) {
        console.log("Post-bump audit warnings:");
        for (const u of r.undeclared) console.log(`  ${u}`);
      }
      process.exit(0);
    } else {
      usage();
      process.exit(2);
    }
  } catch (err) {
    console.error(`version: ${err.message}`);
    process.exit(1);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
