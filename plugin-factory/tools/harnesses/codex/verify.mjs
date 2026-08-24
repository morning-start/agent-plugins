/**
 * codex/verify.mjs — Codex / ChatGPT harness validator.
 *
 * Validates .codex-plugin/manifest and hooks structure.
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

async function validateManifest(root, findings) {
  const manifestPath = join(root, ".codex-plugin", "plugin.json");
  if (!await exists(manifestPath)) {
    findings.push(makeFinding(
      "missing-codex-manifest", ".codex-plugin/plugin.json", "FAIL",
      "Create .codex-plugin/plugin.json.", "Codex cannot discover this plugin without a manifest.",
    ));
    return null;
  }

  try {
    return await readJson(manifestPath);
  } catch (err) {
    findings.push(makeFinding(
      "invalid-codex-manifest", ".codex-plugin/plugin.json", "FAIL",
      "Fix JSON syntax in .codex-plugin/plugin.json.", `Parse error: ${err.message}`,
    ));
    return null;
  }
}

async function validateHooks(root, findings, manifest) {
  if (!manifest || !manifest.hooks) return;

  const hooksDir = join(root, ".codex-plugin", "hooks");
  if (!await exists(hooksDir)) {
    findings.push(makeFinding(
      "missing-codex-hooks", ".codex-plugin/hooks", "WARN",
      "Create .codex-plugin/hooks/ directory.", "Codex hooks cannot load without the hooks directory.",
    ));
    return;
  }

  try {
    const files = await readdir(hooksDir);
    for (const f of files) {
      if (!f.endsWith(".js") && !f.endsWith(".mjs")) continue;
      const content = await readFile(join(hooksDir, f), "utf8");
      if (!content.includes("export") && !content.includes("module.exports")) {
        findings.push(makeFinding(
          "invalid-hook-export", `.codex-plugin/hooks/${f}`, "WARN",
          "Add a named export or default export for the hook function.",
          "Codex cannot load the hook without an export.",
        ));
      }
    }
  } catch { /* skip */ }
}

async function validateSkills(root, findings, manifest) {
  if (manifest?.skills && !await exists(join(root, "skills"))) {
    findings.push(makeFinding(
      "missing-skills-dir", "skills", "FAIL",
      "Create skills/ directory.", "Plugin declares skills but skills/ is missing.",
    ));
  }
}

/**
 * Run all Codex harness validations.
 * @param {string} root - Plugin root directory
 * @returns {Promise<Array>} findings
 */
export async function validate(root) {
  const findings = [];
  const manifest = await validateManifest(root, findings);
  await validateHooks(root, findings, manifest);
  await validateSkills(root, findings, manifest);
  return findings;
}

export const name = "codex";
