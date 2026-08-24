/**
 * codex/init.mjs — Codex 初始化。
 */
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";

const TEMPLATES_ROOT = join(import.meta.dirname, "..", "..", "..", "templates", "harnesses", "codex");

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
 * 初始化 Codex harness 目录结构。
 * @param {string} target - 目标插件根目录
 * @param {object} values - 模板替换值
 * @returns {Promise<string[]>} 生成的文件列表
 */
export async function init(target, values) {
  const files = [];

  await mkdir(join(target, ".codex-plugin", "hooks"), { recursive: true });

  if (await exists(TEMPLATES_ROOT)) {
    for (const { full, rel } of await collectTemplates(TEMPLATES_ROOT)) {
      const outRel = rel.replace(/\.tmpl$/, "");
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

export const name = "codex";
