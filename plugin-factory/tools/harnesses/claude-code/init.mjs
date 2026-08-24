/**
 * claude-code/init.mjs — Claude Code 初始化。
 *
 * 复制模板、替换字段、生成初始 hooks.json 和 manifest。
 */
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";

const TEMPLATES_ROOT = join(import.meta.dirname, "..", "..", "..", "templates", "harnesses", "claude-code");

async function exists(path) {
  try { await stat(path); return true; } catch { return false; }
}

async function collectTemplates(dir, root = dir) {
  const out = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...await collectTemplates(full, root));
    } else if (entry.name.endsWith(".tmpl")) {
      out.push({ full, rel: relative(root, full).replace(/\\/g, "/") });
    }
  }
  return out;
}

function renderTemplate(template, values) {
  return template.replace(/\{\{([A-Z_]+)\}\}/g, (match, key) =>
    Object.prototype.hasOwnProperty.call(values, key) ? String(values[key]) : match,
  );
}

/**
 * 初始化 Claude Code harness 目录结构。
 * @param {string} target - 目标插件根目录
 * @param {object} values - 模板替换值 { PLUGIN_NAME, PLUGIN_PREFIX, ... }
 * @returns {Promise<string[]>} 生成的文件列表
 */
export async function init(target, values) {
  const files = [];

  // 确保 .claude-plugin 目录存在
  await mkdir(join(target, ".claude-plugin"), { recursive: true });

  // 确保 hooks 目录存在
  await mkdir(join(target, "hooks"), { recursive: true });

  // 复制并渲染模板
  if (await exists(TEMPLATES_ROOT)) {
    for (const { full, rel } of await collectTemplates(TEMPLATES_ROOT)) {
      const outRel = rel.replace(/\.tmpl$/, "").replace(/\\\$\{PLUGIN_PREFIX\}/g, values.PLUGIN_PREFIX);
      const outPath = join(target, outRel);
      await mkdir(dirname(outPath), { recursive: true });
      let text = await readFile(full, "utf8");
      text = text.replace(/\r\n/g, "\n");
      text = renderTemplate(text, values);
      await writeFile(outPath, text, "utf8");
      files.push(outRel);
    }
  }

  return files;
}

/**
 * 生成 hooks.json 内容。
 * @param {object} options - { hookFiles: { sessionStart: { sh }, postToolUse: { sh } } }
 * @returns {object} hooks.json 结构
 */
export function generateHooksJson({ hookFiles } = {}) {
  const hooks = {};

  if (hookFiles?.sessionStart) {
    hooks.SessionStart = [
      { hooks: [{ type: "command", command: `bash "\${CLAUDE_PLUGIN_ROOT}/${hookFiles.sessionStart.sh}"`, shell: "bash" }] },
    ];
  }

  if (hookFiles?.postToolUse) {
    hooks.PostToolUse = [
      {
        matcher: "Write|Edit|MultiEdit|create_file|str_replace_editor",
        hooks: [{ type: "command", command: `bash "\${CLAUDE_PLUGIN_ROOT}/${hookFiles.postToolUse.sh}"`, shell: "bash", description: "Post-edit structural gate" }],
      },
    ];
  }

  return { hooks };
}

export const name = "claude-code";
