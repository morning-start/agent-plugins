#!/usr/bin/env node
/**
 * validate-harness.mjs — harness 校验路由。
 *
 * 分发到各 harness 的 verify.mjs。
 *
 * 用法：
 *   node tools/validate-harness.mjs --root <dir> [--harness claude-code|opencode|pi|codex|all] [--format table|json]
 *
 * 退出码：1 表示存在 FAIL，否则 0。
 */
import { readFile, stat } from "node:fs/promises";
import { join, resolve } from "node:path";
import { getValidator, listHarnesses } from "./harnesses/index.mjs";

const SEVERITY = { FAIL: 3, WARN: 2, INFO: 1 };

async function readJson(path) {
  const text = await readFile(path, "utf8");
  return JSON.parse(text);
}

async function exists(path) {
  try { await stat(path); return true; } catch { return false; }
}

function sortFindings(findings) {
  return [...findings].sort((a, b) => (SEVERITY[b.severity] || 0) - (SEVERITY[a.severity] || 0));
}

function renderTable(findings) {
  const rows = sortFindings(findings).map(
    (f) => `${f.severity}\t${f.signal}\t${f.file || "-"}\t${f.action}`,
  );
  return ["SEVERITY\tSIGNAL\tFILE\tACTION", ...rows].join("\n");
}

function renderJson(findings) {
  return JSON.stringify(sortFindings(findings), null, 2);
}

/** 检测目录中存在哪些 harness。 */
async function detectHarnesses(root) {
  const harnesses = [];
  if (await exists(join(root, ".claude-plugin", "plugin.json"))) harnesses.push("claude-code");
  if (await exists(join(root, ".opencode", "opencode.json"))) harnesses.push("opencode");
  try {
    const pkg = await readJson(join(root, "package.json"));
    if (pkg.pi) harnesses.push("pi");
    if (pkg.omp) harnesses.push("oh-my-pi");
  } catch { /* no package.json */ }
  if (await exists(join(root, ".codex-plugin", "plugin.json"))) harnesses.push("codex");
  return harnesses;
}

/**
 * 校验插件的 harness 适配。
 * @param {string} root - 插件根目录
 * @param {string} [harness="all"] - 目标 harness（"all" 为自动检测）
 * @returns {Promise<Array>} findings
 */
export async function validateHarness(root, harness = "all") {
  const findings = [];

  if (harness === "all") {
    const detected = await detectHarnesses(root);
    if (detected.length === 0) {
      findings.push({
        signal: "no-harness-detected", file: ".", severity: "WARN",
        action: "未检测到 harness manifest。创建 .claude-plugin/、.opencode/ 或 package.json。",
        impact: "插件无法被任何 harness 加载。",
      });
      return findings;
    }

    for (const h of detected) {
      const validator = getValidator(h);
      if (validator) findings.push(...await validator.validate(root, h));
    }
  } else {
    const validator = getValidator(harness);
    if (!validator) {
      findings.push({
        signal: "unknown-harness", file: ".", severity: "FAIL",
        action: `未知 harness: ${harness}。支持: ${listHarnesses().join(", ")}`,
        impact: "无法校验未知 harness。",
      });
      return findings;
    }
    findings.push(...await validator.validate(root, harness));
  }

  return findings;
}

function usage() {
  console.error([
    "用法: node tools/validate-harness.mjs [选项]",
    "",
    "选项:",
    "  --root <dir>        插件根目录（默认: 当前目录）",
    "  --harness <name>    目标 harness（默认: all）",
    "                      支持: claude-code, opencode, pi, oh-my-pi, codex, all",
    "  --format <fmt>      输出格式: table（默认）或 json",
    "  -h, --help          显示帮助",
    "",
    "退出码: 1 表示存在 FAIL，否则 0。",
  ].join("\n"));
}

function parseArgs(argv) {
  const args = { root: process.cwd(), harness: "all", format: "table" };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    switch (a) {
      case "--root": args.root = argv[++i]; break;
      case "--harness": args.harness = argv[++i]; break;
      case "--format": args.format = argv[++i]; break;
      case "-h": case "--help": usage(); process.exit(0); break;
      default:
        if (a.startsWith("--")) { console.error(`validate-harness: 未知选项: ${a}`); usage(); process.exit(2); }
    }
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const absRoot = resolve(args.root);

  if (!await exists(absRoot)) {
    console.error(`错误: 根目录不存在: ${absRoot}`);
    process.exit(1);
  }

  const findings = await validateHarness(absRoot, args.harness);
  console.log(args.format === "json" ? renderJson(findings) : renderTable(findings));
  process.exit(findings.some((f) => f.severity === "FAIL") ? 1 : 0);
}

main().catch((err) => { console.error("校验错误:", err.message); process.exit(1); });
