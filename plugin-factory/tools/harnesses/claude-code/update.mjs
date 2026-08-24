/**
 * claude-code/update.mjs — Claude Code 配置更新。
 *
 * 增删改 hooks.json 事件、manifest 字段、hook 脚本引用。
 */
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

async function readJson(path) {
  const text = await readFile(path, "utf8");
  return JSON.parse(text);
}

/**
 * 向 hooks.json 添加事件。
 * @param {string} root - 插件根目录
 * @param {string} event - 事件名（如 "SessionStart"）
 * @param {object[]} hookGroups - hook 组数组
 */
export async function addHookEvent(root, event, hookGroups) {
  const hooksPath = join(root, "hooks", "hooks.json");
  const hooksJson = await readJson(hooksPath);

  if (!hooksJson.hooks) hooksJson.hooks = {};
  if (hooksJson.hooks[event]) {
    throw new Error(`Event "${event}" already exists. Use updateHookEvent() to modify.`);
  }

  hooksJson.hooks[event] = hookGroups;
  await writeFile(hooksPath, JSON.stringify(hooksJson, null, 2) + "\n", "utf8");
}

/**
 * 更新 hooks.json 中的事件。
 * @param {string} root - 插件根目录
 * @param {string} event - 事件名
 * @param {object[]} hookGroups - 新的 hook 组数组
 */
export async function updateHookEvent(root, event, hookGroups) {
  const hooksPath = join(root, "hooks", "hooks.json");
  const hooksJson = await readJson(hooksPath);

  if (!hooksJson.hooks?.[event]) {
    throw new Error(`Event "${event}" not found. Use addHookEvent() to add.`);
  }

  hooksJson.hooks[event] = hookGroups;
  await writeFile(hooksPath, JSON.stringify(hooksJson, null, 2) + "\n", "utf8");
}

/**
 * 删除 hooks.json 中的事件。
 * @param {string} root - 插件根目录
 * @param {string} event - 事件名
 */
export async function removeHookEvent(root, event) {
  const hooksPath = join(root, "hooks", "hooks.json");
  const hooksJson = await readJson(hooksPath);

  if (!hooksJson.hooks?.[event]) {
    throw new Error(`Event "${event}" not found.`);
  }

  delete hooksJson.hooks[event];
  await writeFile(hooksPath, JSON.stringify(hooksJson, null, 2) + "\n", "utf8");
}

/**
 * 更新 plugin.json manifest 字段。
 * @param {string} root - 插件根目录
 * @param {object} updates - 要更新的字段 { version, description, ... }
 */
export async function updateManifest(root, updates) {
  const manifestPath = join(root, ".claude-plugin", "plugin.json");
  const manifest = await readJson(manifestPath);

  Object.assign(manifest, updates);
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n", "utf8");
}

/**
 * 批量更新 hooks.json 中的命令路径。
 * 用于迁移相对路径到 ${CLAUDE_PLUGIN_ROOT}。
 * @param {string} root - 插件根目录
 * @returns {Promise<{updated: number, details: string[]}>}
 */
export async function migrateHookPaths(root) {
  const hooksPath = join(root, "hooks", "hooks.json");
  const hooksJson = await readJson(hooksPath);
  const details = [];
  let updated = 0;

  for (const [event, groups] of Object.entries(hooksJson.hooks || {})) {
    if (!Array.isArray(groups)) continue;
    for (const group of groups) {
      if (!group.hooks) continue;
      for (const hook of group.hooks) {
        if (hook.command && /^(?:bash\s+"?)?(?:hooks|skills|tools|scripts)\//.test(hook.command)) {
          const old = hook.command;
          hook.command = hook.command
            .replace(/^(bash\s+"?)(hooks|skills|tools|scripts)\//, `$1\${CLAUDE_PLUGIN_ROOT}/$2/`)
            .replace(/^(hooks|skills|tools|scripts)\//, `\${CLAUDE_PLUGIN_ROOT}/$1/`);
          details.push(`${event}: "${old}" → "${hook.command}"`);
          updated++;
        }
      }
    }
  }

  if (updated > 0) {
    await writeFile(hooksPath, JSON.stringify(hooksJson, null, 2) + "\n", "utf8");
  }

  return { updated, details };
}

export const name = "claude-code";
