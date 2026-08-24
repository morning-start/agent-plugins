/**
 * codex/upgrade.mjs — Codex 版本升级。
 */
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

async function readJson(path) {
  const text = await readFile(path, "utf8");
  return JSON.parse(text);
}

export async function getVersion(root) {
  const manifest = await readJson(join(root, ".codex-plugin", "plugin.json"));
  return manifest.version || "0.0.0";
}

export async function setVersion(root, newVersion) {
  const manifestPath = join(root, ".codex-plugin", "plugin.json");
  const manifest = await readJson(manifestPath);
  manifest.version = newVersion;
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n", "utf8");
}

export function compareVersions(a, b) {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    if (pa[i] < pb[i]) return -1;
    if (pa[i] > pb[i]) return 1;
  }
  return 0;
}

export function needsUpgrade(current, target) {
  return compareVersions(current, target) < 0;
}

export const name = "codex";
