#!/usr/bin/env node
/**
 * package-plugin.mjs — package a verified plugin into a distributable .zip.
 *
 * Zero-dependency, cross-platform (pure Node — no zip/tar binary needed).
 * Packaging is gated: the structural + harness verifier must pass (no FAIL
 * findings) before the archive is written — "looks fine, ship it" must be
 * backed by a green gate (mirrors plugin-creator's package_plugin.py).
 *
 * Excludes: node_modules, .git, .agent-workplace, dist, build artifacts.
 *
 * CLI:
 *   node scripts/package-plugin.mjs --root <dir> [--out <dir>] [--json]
 *
 * Exit code: 1 when verification fails (nothing packaged), otherwise 0.
 */
import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { deflateRawSync, inflateRawSync } from "node:zlib";
import { runChecks } from "./verify.mjs";

const EXCLUDE_DIRS = new Set(["node_modules", ".git", ".agent-workplace", "dist", "build", "out", ".pnp"]);

/* ------------------------------------------------------------------ */
/* Minimal ZIP writer (deflate, UTF-8 names) — no third-party deps.    */
/* ------------------------------------------------------------------ */

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

/** CRC-32 (IEEE) of a buffer — needed for zip entry checksums. */
export function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/**
 * Build a zip archive from entries.
 * @param {{path: string, data: string|Buffer}[]} entries
 * @returns {Buffer}
 */
export function buildZip(entries) {
  const chunks = [];
  const central = [];
  let offset = 0;
  const now = new Date();
  const dosTime = (((now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1)) & 0xffff) || 0;
  const dosDate = ((((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate()) & 0xffff) || 0;

  for (const e of entries) {
    const name = Buffer.from(e.path, "utf8");
    const data = Buffer.isBuffer(e.data) ? e.data : Buffer.from(e.data, "utf8");
    const crc = crc32(data);
    const compressed = deflateRawSync(data);

    // Local file header.
    const lh = Buffer.alloc(30);
    lh.writeUInt32LE(0x04034b50, 0);
    lh.writeUInt16LE(20, 4); // version needed
    lh.writeUInt16LE(0x0800, 6); // UTF-8 flag
    lh.writeUInt16LE(8, 8); // deflate
    lh.writeUInt16LE(dosTime, 10);
    lh.writeUInt16LE(dosDate, 12);
    lh.writeUInt32LE(crc, 14);
    lh.writeUInt32LE(compressed.length, 18);
    lh.writeUInt32LE(data.length, 22);
    lh.writeUInt16LE(name.length, 26);
    lh.writeUInt16LE(0, 28); // extra length
    chunks.push(lh, name, compressed);

    // Central directory record.
    const ch = Buffer.alloc(46);
    ch.writeUInt32LE(0x02014b50, 0);
    ch.writeUInt16LE(20, 4); // version made by
    ch.writeUInt16LE(20, 6); // version needed
    ch.writeUInt16LE(0x0800, 8);
    ch.writeUInt16LE(8, 10);
    ch.writeUInt16LE(dosTime, 12);
    ch.writeUInt16LE(dosDate, 14);
    ch.writeUInt32LE(crc, 16);
    ch.writeUInt32LE(compressed.length, 20);
    ch.writeUInt32LE(data.length, 24);
    ch.writeUInt16LE(name.length, 28);
    ch.writeUInt16LE(0, 30); // extra
    ch.writeUInt16LE(0, 32); // comment
    ch.writeUInt16LE(0, 34); // disk start
    ch.writeUInt16LE(0, 36); // internal attrs
    ch.writeUInt32LE(0, 38); // external attrs
    ch.writeUInt32LE(offset, 42); // local header offset
    central.push({ rec: ch, name });

    offset += lh.length + name.length + compressed.length;
  }

  const centralBufs = central.map((c) => Buffer.concat([c.rec, c.name]));
  const centralSize = centralBufs.reduce((a, b) => a + b.length, 0);
  const centralStart = offset;
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(central.length, 8);
  eocd.writeUInt16LE(central.length, 10);
  eocd.writeUInt32LE(centralSize, 12);
  eocd.writeUInt32LE(centralStart, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([...chunks, ...centralBufs, eocd]);
}

/**
 * Parse a zip archive back into entries (test helper / round-trip check).
 * @returns {{name: string, data: Buffer}[]}
 */
export function parseZipEntries(buf) {
  const eocdPos = buf.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  if (eocdPos < 0) throw new Error("no EOCD — not a zip archive");
  const count = buf.readUInt16LE(eocdPos + 10);
  const cdStart = buf.readUInt32LE(eocdPos + 16);
  const out = [];
  let pos = cdStart;
  for (let i = 0; i < count; i++) {
    if (buf.readUInt32LE(pos) !== 0x02014b50) throw new Error("bad central directory signature");
    const nameLen = buf.readUInt16LE(pos + 28);
    const compSize = buf.readUInt32LE(pos + 20);
    const localOffset = buf.readUInt32LE(pos + 42);
    const name = buf.toString("utf8", pos + 46, pos + 46 + nameLen);
    const method = buf.readUInt16LE(localOffset + 8);
    const localNameLen = buf.readUInt16LE(localOffset + 26);
    const dataStart = localOffset + 30 + localNameLen;
    const raw = buf.subarray(dataStart, dataStart + compSize);
    const data = method === 8 ? inflateRawSync(raw) : raw;
    out.push({ name, data });
    pos += 46 + nameLen;
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Packaging                                                            */
/* ------------------------------------------------------------------ */

/** Recursively list files under `root` (relative paths), skipping excluded dirs. */
export async function collectPackageFiles(root) {
  const out = [];
  async function walk(dir, rel) {
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      if (e.isDirectory()) {
        if (EXCLUDE_DIRS.has(e.name)) continue;
        await walk(join(dir, e.name), rel ? `${rel}/${e.name}` : e.name);
      } else {
        out.push({ path: rel ? `${rel}/${e.name}` : e.name, abs: join(dir, e.name) });
      }
    }
  }
  await walk(root, "");
  return out;
}

/**
 * Package a plugin: run the structural + harness verifier, and only when it
 * passes, write `<outDir>/<name>-v<version>.zip`.
 * @param {string} root
 * @param {{outDir?: string}} [opts]
 * @returns {Promise<{ok: boolean, findings: object[], zipPath: string|null, name?: string, version?: string, fileCount?: number}>}
 */
export async function packagePlugin(root, { outDir = join(root, "dist") } = {}) {
  const verify = await runChecks(root, { layers: ["structure", "harness"] });
  const fails = verify.findings.filter((f) => f.severity === "FAIL");
  if (fails.length > 0) {
    return { ok: false, findings: fails, zipPath: null };
  }

  let pkg = {};
  try {
    pkg = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
  } catch {
    /* no package.json — fall back to defaults */
  }
  const name = pkg.name ?? "plugin";
  const version = pkg.version ?? "0.0.0";
  const zipName = `${name}-v${version}.zip`;

  const files = await collectPackageFiles(root);
  const entries = [];
  for (const f of files) {
    entries.push({ path: f.path, data: await readFile(f.abs) });
  }
  await mkdir(outDir, { recursive: true });
  const zipPath = join(outDir, zipName);
  await writeFile(zipPath, buildZip(entries), "utf8");
  return { ok: true, findings: [], zipPath, name, version, fileCount: entries.length };
}

async function main() {
  const argv = process.argv.slice(2);
  let root = process.cwd();
  let outDir = null;
  let json = false;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--root") root = argv[++i];
    else if (argv[i] === "--out") outDir = argv[++i];
    else if (argv[i] === "--json") json = true;
  }
  const result = await packagePlugin(root, { outDir: outDir ?? join(root, "dist") });
  if (json) {
    console.log(JSON.stringify(result, null, 2));
  } else if (result.ok) {
    console.log(`packaged: ${result.zipPath} (${result.fileCount} files, ${result.name} v${result.version})`);
  } else {
    console.error("package: verification FAILED — nothing packaged:");
    for (const f of result.findings) console.error(`  ${f.severity}\t${f.signal}\t${f.file}\t${f.action}`);
  }
  process.exit(result.ok ? 0 : 1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
