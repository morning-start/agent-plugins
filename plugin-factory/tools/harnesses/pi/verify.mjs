/**
 * pi/verify.mjs — pi / oh-my-pi harness validator.
 *
 * Validates package.json pi/omp sections, declared extensions, and skills.
 */
import { readFile, stat } from "node:fs/promises";
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

async function validatePackageJson(root, findings, harness) {
  const pkgPath = join(root, "package.json");
  if (!await exists(pkgPath)) {
    findings.push(makeFinding(
      "missing-package-json", "package.json", "FAIL",
      "Create package.json for pi/oh-my-pi plugin.", `${harness} requires package.json.`,
    ));
    return null;
  }

  try {
    return await readJson(pkgPath);
  } catch {
    findings.push(makeFinding(
      "invalid-package-json", "package.json", "FAIL",
      "Fix JSON syntax in package.json.", "Cannot parse package.json.",
    ));
    return null;
  }
}

async function validatePiSection(root, findings, harness) {
  const key = harness === "oh-my-pi" ? "omp" : "pi";
  const pkg = await validatePackageJson(root, findings, harness);
  if (!pkg) return;

  const section = pkg[key];
  if (!section) {
    findings.push(makeFinding(
      "missing-pi-section", `package.json.${key}`, "FAIL",
      `Add the "${key}" field to package.json.`,
      `${harness} cannot discover this plugin without ${key} metadata.`,
    ));
    return;
  }

  if (Array.isArray(section.skills)) {
    for (const skillPath of section.skills) {
      if (!await exists(join(root, skillPath))) {
        findings.push(makeFinding(
          "missing-pi-skill", `package.json.${key}.skills -> ${skillPath}`, "FAIL",
          `Create ${skillPath}.`, `${harness} declares skill but it is missing.`,
        ));
      }
    }
  }

  if (Array.isArray(section.extensions)) {
    for (const extPath of section.extensions) {
      if (!await exists(join(root, extPath))) {
        findings.push(makeFinding(
          "missing-pi-extension", `package.json.${key}.extensions -> ${extPath}`, "FAIL",
          `Create ${extPath}.`, `${harness} declares extension but it is missing.`,
        ));
      }
    }
  }
}

/**
 * Run all pi harness validations.
 * @param {string} root - Plugin root directory
 * @param {string} [harness="pi"] - "pi" or "oh-my-pi"
 * @returns {Promise<Array>} findings
 */
export async function validate(root, harness = "pi") {
  const findings = [];
  await validatePiSection(root, findings, harness);
  return findings;
}

export async function validateOmp(root) {
  return validate(root, "oh-my-pi");
}

export const name = "pi";
export const aliases = ["oh-my-pi"];
