/**
 * MoonBit Skills — Shared Post-Tool Verification Logic
 *
 * Used by both OMP post-hook and Pi extension to verify MoonBit source
 * files after write/edit operations. Extracted to avoid logic drift.
 *
 * Design principle (from skills/verify/SKILL.md):
 *   "NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE"
 *   — acceptable warnings, never acceptable errors.
 */

import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { existsSync } from "node:fs";

// MoonBit source file extensions
const MOONBIT_EXTS = new Set([".mbt", ".mbti"]);

// Commands that modify files — includes variants across platforms
// (Claude Code: Write/Edit, Pi/OMP: write/edit, others: write_file/edit_file/etc.)
const WRITE_TOOLS = new Set([
  "write", "edit",
  "write_file", "edit_file",
  "str_replace_editor", "create_file",
  "Write", "Edit",  // Claude Code uses capitalized names
]);

export interface VerificationResult {
  errors: string[];
  warnings: string[];
}

export function isWriteTool(toolName: string): boolean {
  return WRITE_TOOLS.has(toolName);
}

export function isMoonBitFile(path: string): boolean {
  const dot = path.lastIndexOf(".");
  if (dot === -1) return false;
  return MOONBIT_EXTS.has(path.slice(dot));
}

export function findMoonProjectRoot(filePath: string): string | null {
  let dir = dirname(filePath);
  for (let i = 0; i < 20; i++) {
    if (existsSync(resolve(dir, "moon.mod")) || existsSync(resolve(dir, "moon.mod.json"))) {
      return dir;
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

export async function runVerification(projectRoot: string): Promise<VerificationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Format check (non-blocking warning — auto-fixable)
  const fmtResult = await runCommand("moon", ["fmt", "--check"], projectRoot);
  if (fmtResult.code !== 0) {
    warnings.push("Format check failed — run `moon fmt` to auto-fix");
  }

  // 2. Type check (blocking error — must be zero errors)
  const checkResult = await runCommand(
    "moon",
    ["check", "--target", "native", "--warn-list", "+73"],
    projectRoot,
  );
  if (checkResult.code !== 0) {
    const output = checkResult.stderr || checkResult.stdout;
    for (const line of output.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // MoonBit diagnostics: Error vs Warning
      if (/error/i.test(trimmed) && !/warning/i.test(trimmed)) {
        errors.push(trimmed);
      } else if (/warning/i.test(trimmed)) {
        warnings.push(trimmed);
      } else if (/^E\d{4}/.test(trimmed)) {
        // Diagnostic codes like E0073
        errors.push(trimmed);
      }
    }

    // If no specific lines parsed, report the whole output as error
    if (errors.length === 0 && warnings.length === 0) {
      errors.push("moon check failed — see output below");
      errors.push(output.split("\n").slice(0, 10).join("\n"));
    }
  }

  return { errors, warnings };
}

export function formatVerificationSuffix(results: VerificationResult): {
  text: string;
  isError: boolean;
} {
  if (results.errors.length > 0) {
    const errorText = results.errors.map((e) => `❌ ${e}`).join("\n");
    const warningText =
      results.warnings.length > 0
        ? results.warnings.map((w) => `⚠️  ${w}`).join("\n")
        : "";
    return {
      text: [
        "\n--- MoonBit Verification ---",
        errorText,
        warningText,
        "Fix all errors above before presenting to the user.",
      ]
        .filter(Boolean)
        .join("\n"),
      isError: true,
    };
  }

  if (results.warnings.length > 0) {
    const warningText = results.warnings.map((w) => `⚠️  ${w}`).join("\n");
    return {
      text: `\n--- MoonBit Verification ---\n✅ No errors\n${warningText}`,
      isError: false,
    };
  }

  return {
    text: "\n✅ MoonBit verification passed (fmt + check)",
    isError: false,
  };
}

function runCommand(
  cmd: string,
  args: string[],
  cwd: string,
): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const proc = spawn(cmd, args, {
      cwd,
      shell: true,
      timeout: 30000,
    });
    let stdout = "";
    let stderr = "";
    proc.stdout?.on("data", (data: Buffer) => {
      stdout += data.toString();
    });
    proc.stderr?.on("data", (data: Buffer) => {
      stderr += data.toString();
    });
    proc.on("close", (code: number | null) => {
      resolve({ code: code ?? 1, stdout, stderr });
    });
    proc.on("error", () => {
      resolve({ code: 127, stdout: "", stderr: "moon command not found" });
    });
  });
}
