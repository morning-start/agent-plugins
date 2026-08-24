/**
 * opencode/update.mjs — opencode 配置更新。
 */
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

async function readJson(path) {
  const text = await readFile(path, "utf8");
  return JSON.parse(text);
}

/**
 * 更新 opencode.json 配置。
 * @param {string} root - 插件根目录
 * @param {object} updates - 要更新的字段
 */
export async function updateConfig(root, updates) {
  const configPath = join(root, ".opencode", "opencode.json");
  const config = await readJson(configPath);
  Object.assign(config, updates);
  await writeFile(configPath, JSON.stringify(config, null, 2) + "\n", "utf8");
}

/**
 * 添加 plugin 引用。
 * @param {string} root - 插件根目录
 * @param {string} plugin - plugin 路径或包名
 */
export async function addPlugin(root, plugin) {
  const configPath = join(root, ".opencode", "opencode.json");
  const config = await readJson(configPath);
  if (!config.plugin) config.plugin = [];
  if (!config.plugin.includes(plugin)) {
    config.plugin.push(plugin);
    await writeFile(configPath, JSON.stringify(config, null, 2) + "\n", "utf8");
  }
}

/**
 * 删除 plugin 引用。
 * @param {string} root - 插件根目录
 * @param {string} plugin - plugin 路径或包名
 */
export async function removePlugin(root, plugin) {
  const configPath = join(root, ".opencode", "opencode.json");
  const config = await readJson(configPath);
  if (config.plugin) {
    config.plugin = config.plugin.filter((p) => p !== plugin);
    await writeFile(configPath, JSON.stringify(config, null, 2) + "\n", "utf8");
  }
}

export const name = "opencode";
