/**
 * claude-code/upgrade.mjs — Claude Code 版本升级。
 *
 * 管理 plugin.json 版本号、CHANGELOG 条目、manifest 字段迁移。
 */
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

async function readJson(path) {
  const text = await readFile(path, "utf8");
  return JSON.parse(text);
}

/**
 * 获取当前版本。
 * @param {string} root - 插件根目录
 * @returns {Promise<string>} 版本号
 */
export async function getVersion(root) {
  const manifest = await readJson(join(root, ".claude-plugin", "plugin.json"));
  return manifest.version || "0.0.0";
}

/**
 * 更新版本号。
 * @param {string} root - 插件根目录
 * @param {string} newVersion - 新版本号
 */
export async function setVersion(root, newVersion) {
  const manifestPath = join(root, ".claude-plugin", "plugin.json");
  const manifest = await readJson(manifestPath);
  manifest.version = newVersion;
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n", "utf8");
}

/**
 * 比较两个版本号。
 * @param {string} a
 * @param {string} b
 * @returns {-1|0|1}
 */
export function compareVersions(a, b) {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    if (pa[i] < pb[i]) return -1;
    if (pa[i] > pb[i]) return 1;
  }
  return 0;
}

/**
 * 检查是否有可用升级。
 * @param {string} current - 当前版本
 * @param {string} target - 目标版本
 * @returns {boolean}
 */
export function needsUpgrade(current, target) {
  return compareVersions(current, target) < 0;
}

/**
 * 生成 CHANGELOG 条目。
 * @param {string} version - 版本号
 * @param {string[]} changes - 变更列表
 * @returns {string} markdown 格式的条目
 */
export function generateChangelogEntry(version, changes) {
  const date = new Date().toISOString().slice(0, 10);
  const lines = changes.map((c) => `- ${c}`).join("\n");
  return `## [${version}] - ${date}\n\n${lines}\n`;
}

/**
 * 追加 CHANGELOG 条目。
 * @param {string} root - 插件根目录
 * @param {string} version - 版本号
 * @param {string[]} changes - 变更列表
 */
export async function appendChangelog(root, version, changes) {
  const changelogPath = join(root, "CHANGELOG.md");
  let existing = "";
  try {
    existing = await readFile(changelogPath, "utf8");
  } catch {
    existing = "# Changelog\n\n";
  }

  const entry = generateChangelogEntry(version, changes);
  const updated = existing.replace(/(# Changelog\n\n)/, `$1${entry}\n`);
  await writeFile(changelogPath, updated, "utf8");
}

/**
 * 执行 manifest 字段迁移（跨版本）。
 * @param {string} root - 插件根目录
 * @param {string} fromVersion - 来源版本
 * @param {string} toVersion - 目标版本
 * @returns {Promise<string[]>} 执行的迁移操作列表
 */
export async function migrateManifest(root, fromVersion, toVersion) {
  const migrations = [];

  // 示例：0.1.x → 0.2.0 迁移
  if (compareVersions(fromVersion, "0.2.0") < 0 && compareVersions(toVersion, "0.2.0") >= 0) {
    const manifestPath = join(root, ".claude-plugin", "plugin.json");
    const manifest = await readJson(manifestPath);

    // 确保 tags 字段存在
    if (!manifest.tags) {
      manifest.tags = [];
      migrations.push("Added tags field to manifest");
    }

    await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n", "utf8");
  }

  return migrations;
}

export const name = "claude-code";
