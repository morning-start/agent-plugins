/**
 * codex/update.mjs — Codex 配置更新。
 */
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

async function readJson(path) {
  const text = await readFile(path, "utf8");
  return JSON.parse(text);
}

/**
 * 更新 .codex-plugin/plugin.json manifest。
 * @param {string} root - 插件根目录
 * @param {object} updates - 要更新的字段
 */
export async function updateManifest(root, updates) {
  const manifestPath = join(root, ".codex-plugin", "plugin.json");
  const manifest = await readJson(manifestPath);
  Object.assign(manifest, updates);
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n", "utf8");
}

/**
 * 添加 hook 引用。
 * @param {string} root - 插件根目录
 * @param {string} hookName - hook 名称
 * @param {object} hookConfig - hook 配置
 */
export async function addHook(root, hookName, hookConfig) {
  const manifestPath = join(root, ".codex-plugin", "plugin.json");
  const manifest = await readJson(manifestPath);

  if (!manifest.hooks) manifest.hooks = {};
  manifest.hooks[hookName] = hookConfig;
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n", "utf8");
}

/**
 * 删除 hook 引用。
 * @param {string} root - 插件根目录
 * @param {string} hookName - hook 名称
 */
export async function removeHook(root, hookName) {
  const manifestPath = join(root, ".codex-plugin", "plugin.json");
  const manifest = await readJson(manifestPath);

  if (manifest.hooks?.[hookName]) {
    delete manifest.hooks[hookName];
    await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n", "utf8");
  }
}

export const name = "codex";
