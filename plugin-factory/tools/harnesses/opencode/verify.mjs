/**
 * opencode/verify.mjs — opencode harness validator.
 *
 * Validates opencode plugin structure, config, and plugin files.
 */
import { readFile, readdir, stat } from "node:fs/promises";
import { join } from "node:path";

function makeFinding(signal, file, severity, action, impact) {
  return { signal, file, severity, action, impact };
}

async function readJson(path) {
  const text = await readFile(path, "utf8");
  return JSON.parse(text);
}

async function exists(path) {
  try { await stat(path); return true; } catch { return false; }
}

async function validateConfig(root, findings) {
  const configPath = join(root, ".opencode", "opencode.json");
  if (!await exists(configPath)) {
    findings.push(makeFinding(
      "missing-opencode-config", ".opencode/opencode.json", "FAIL",
      "Create .opencode/opencode.json.", "opencode cannot discover this plugin without config.",
    ));
    return;
  }

  try {
    await readJson(configPath);
  } catch (err) {
    findings.push(makeFinding(
      "invalid-opencode-json", ".opencode/opencode.json", "FAIL",
      "Fix JSON syntax in .opencode/opencode.json.", `Parse error: ${err.message}`,
    ));
  }
}

async function validatePlugins(root, findings) {
  const pluginsDir = join(root, ".opencode", "plugins");
  if (!await exists(pluginsDir)) {
    findings.push(makeFinding(
      "missing-opencode-plugins", ".opencode/plugins", "WARN",
      "Create .opencode/plugins/ directory.", "opencode cannot discover plugins.",
    ));
    return;
  }

  try {
    const files = await readdir(pluginsDir);
    for (const f of files) {
      if (!f.endsWith(".ts") && !f.endsWith(".js")) continue;
      const content = await readFile(join(pluginsDir, f), "utf8");

      if (!content.includes("export") && !content.includes("module.exports")) {
        findings.push(makeFinding(
          "invalid-plugin-export", `.opencode/plugins/${f}`, "WARN",
          "Add a named export or default export for the plugin function.",
          "opencode cannot load the plugin without an export.",
        ));
      }

      if (f.endsWith(".ts") && !content.includes("Plugin")) {
        findings.push(makeFinding(
          "missing-plugin-type", `.opencode/plugins/${f}`, "WARN",
          'Import Plugin type from "@opencode-ai/plugin".',
          "TypeScript plugin should use the Plugin type for type safety.",
        ));
      }
    }
  } catch { /* skip */ }
}

async function validateSkills(root, findings) {
  if (!await exists(join(root, "skills"))) {
    findings.push(makeFinding(
      "missing-skills-dir", "skills", "FAIL",
      "Create skills/ (registered by bootstrap plugin's config hook).",
      "opencode cannot discover any skill.",
    ));
  }
}

/**
 * Run all opencode harness validations.
 * @param {string} root - Plugin root directory
 * @returns {Promise<Array>} findings
 */
export async function validate(root) {
  const findings = [];
  await validateConfig(root, findings);
  await validatePlugins(root, findings);
  await validateSkills(root, findings);
  return findings;
}

export const name = "opencode";
