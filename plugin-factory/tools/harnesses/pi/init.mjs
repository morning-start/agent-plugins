/**
 * pi/init.mjs — pi / oh-my-pi 初始化。
 */
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";

const TEMPLATES_ROOT = join(import.meta.dirname, "..", "..", "..", "templates", "harnesses", "pi");

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
 * 初始化 pi harness 目录结构。
 * @param {string} target - 目标插件根目录
 * @param {object} values - 模板替换值
 * @returns {Promise<string[]>} 生成的文件列表
 */
export async function init(target, values) {
  const files = [];

  await mkdir(join(target, ".pi", "extensions"), { recursive: true });

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
 * 生成 package.json 中的 pi/omp 字段。
 * @param {string} prefix - 插件前缀
 * @param {string} harness - "pi" 或 "oh-my-pi"
 * @returns {object} { pi: {...} } 或 { pi: {...}, omp: {...} }
 */
export function generatePackageFields(prefix, harness = "pi") {
  const ext = `.pi/extensions/${prefix}-bootstrap.ts`;
  const result = { pi: { extensions: [ext], skills: ["skills"] } };
  if (harness === "oh-my-pi") {
    result.omp = { extensions: [ext], skills: ["skills"] };
  }
  return result;
}

export const name = "pi";
