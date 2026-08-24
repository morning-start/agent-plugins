/**
 * pi/update.mjs — pi / oh-my-pi 配置更新。
 */
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

async function readJson(path) {
  const text = await readFile(path, "utf8");
  return JSON.parse(text);
}

/**
 * 更新 package.json 中的 pi/omp section。
 * @param {string} root - 插件根目录
 * @param {string} harness - "pi" 或 "oh-my-pi"
 * @param {object} updates - 要更新的字段
 */
export async function updateSection(root, harness, updates) {
  const key = harness === "oh-my-pi" ? "omp" : "pi";
  const pkgPath = join(root, "package.json");
  const pkg = await readJson(pkgPath);

  if (!pkg[key]) pkg[key] = {};
  Object.assign(pkg[key], updates);
  await writeFile(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf8");
}

/**
 * 添加 skill 引用。
 * @param {string} root - 插件根目录
 * @param {string} harness - "pi" 或 "oh-my-pi"
 * @param {string} skillPath - skill 路径
 */
export async function addSkill(root, harness, skillPath) {
  const key = harness === "oh-my-pi" ? "omp" : "pi";
  const pkgPath = join(root, "package.json");
  const pkg = await readJson(pkgPath);

  if (!pkg[key]) pkg[key] = {};
  if (!pkg[key].skills) pkg[key].skills = [];
  if (!pkg[key].skills.includes(skillPath)) {
    pkg[key].skills.push(skillPath);
    await writeFile(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf8");
  }
}

/**
 * 删除 skill 引用。
 * @param {string} root - 插件根目录
 * @param {string} harness - "pi" 或 "oh-my-pi"
 * @param {string} skillPath - skill 路径
 */
export async function removeSkill(root, harness, skillPath) {
  const key = harness === "oh-my-pi" ? "omp" : "pi";
  const pkgPath = join(root, "package.json");
  const pkg = await readJson(pkgPath);

  if (pkg[key]?.skills) {
    pkg[key].skills = pkg[key].skills.filter((s) => s !== skillPath);
    await writeFile(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf8");
  }
}

/**
 * 添加 extension 引用。
 * @param {string} root - 插件根目录
 * @param {string} harness - "pi" 或 "oh-my-pi"
 * @param {string} extPath - extension 路径
 */
export async function addExtension(root, harness, extPath) {
  const key = harness === "oh-my-pi" ? "omp" : "pi";
  const pkgPath = join(root, "package.json");
  const pkg = await readJson(pkgPath);

  if (!pkg[key]) pkg[key] = {};
  if (!pkg[key].extensions) pkg[key].extensions = [];
  if (!pkg[key].extensions.includes(extPath)) {
    pkg[key].extensions.push(extPath);
    await writeFile(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf8");
  }
}

export const name = "pi";
