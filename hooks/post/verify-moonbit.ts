/**
 * MoonBit Skills — OMP Post-Tool Verification Hook
 *
 * After write/edit modifies a .mbt file, automatically runs lightweight
 * MoonBit verification (fmt --check + check) and appends the result to
 * the tool output. Errors are surfaced so the model can fix them before
 * presenting to the user. Warnings are reported but non-blocking.
 *
 * Shared verification logic is in hooks/shared/verify-moonbit.ts.
 *
 * NOTE: The import path `@oh-my-pi/pi-coding-agent/extensibility/hooks` is
 * speculative — OMP's TypeScript hook API is not yet publicly documented.
 * When OMP publishes official docs, verify and update the import path
 * and event name (tool_result).
 */

import type { HookAPI } from "@oh-my-pi/pi-coding-agent/extensibility/hooks";
import {
  isWriteTool,
  isMoonBitFile,
  findMoonProjectRoot,
  runVerification,
  formatVerificationSuffix,
} from "../shared/verify-moonbit.ts";

export default function (pi: HookAPI) {
  pi.on("tool_result", async (event) => {
    // Only check after write/edit operations
    if (!isWriteTool(event.toolName) || event.isError) return;

    // Extract file path from tool input
    const input = event.input as Record<string, unknown>;
    const filePath = String(input.file_path ?? input.path ?? "");
    if (!filePath) return;

    // Only verify MoonBit source files
    if (!isMoonBitFile(filePath)) return;

    // Only run if this is inside a MoonBit project
    const projectRoot = findMoonProjectRoot(filePath);
    if (!projectRoot) return;

    // Run lightweight verification
    const results = await runVerification(projectRoot);
    const { text, isError } = formatVerificationSuffix(results);

    // Append verification result to tool output
    const content = event.content.map((c) => {
      if (c.type === "text" && typeof c.text === "string") {
        return { ...c, text: c.text + text };
      }
      return c;
    });
    return { content, isError };
  });
}
