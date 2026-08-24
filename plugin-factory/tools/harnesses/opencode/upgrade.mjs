/**
 * opencode/upgrade.mjs — opencode 版本升级。
 */
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

async function readJson(path) {
  const text = await readFile(path, "utf8");
  return JSON.parse(text);
}

export async function getVersion(root) {
  const pkg = await readJson(join(root, "package.json"));
  return pkg.version || "0.0.0";
}

export async function setVersion(root, newVersion) {
  const pkgPath = join(root, "package.json");
  const pkg = await readJson(pkgPath);
  pkg.version = newVersion;
  await writeFile(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf8");
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

export const name = "opencode";
