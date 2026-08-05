/**
 * MoonBit Skills — OpenCode Plugin
 *
 * Post-tool verification: after write/edit modifies a .mbt file, runs
 * lightweight MoonBit verification (fmt --check + check) and appends
 * the result to the tool output.
 *
 * Shared verification logic is in hooks/shared/verify-moonbit.ts.
 *
 * OpenCode plugin format: export a function that receives a context
 * object and returns a hooks object mapping event names to handlers.
 */

import {
  isWriteTool,
  isMoonBitFile,
  findMoonProjectRoot,
  runVerification,
  formatVerificationSuffix,
} from "../../hooks/shared/verify-moonbit.ts";

export default function (_ctx: unknown) {
  return {
    "tool.execute.after": async (input: { tool?: string; args?: Record<string, unknown> }, output: { content?: unknown; isError?: boolean }) => {
      // Only check after write/edit operations
      if (!input?.tool || !isWriteTool(input.tool)) return;

      // Extract file path from tool input
      const filePath = String(input.args?.file_path ?? input.args?.path ?? "");
      if (!filePath || !isMoonBitFile(filePath)) return;

      // Only run if this is inside a MoonBit project
      const projectRoot = findMoonProjectRoot(filePath);
      if (!projectRoot) return;

      // Run lightweight verification
      const results = await runVerification(projectRoot);
      const { text, isError } = formatVerificationSuffix(results);

      // Append verification result to tool output
      const content = output.content;
      if (typeof content === "string") {
        output.content = content + text;
      } else if (Array.isArray(content)) {
        const lastPart = content[content.length - 1];
        if (lastPart && typeof lastPart === "object" && typeof (lastPart as { text?: string }).text === "string") {
          (lastPart as { text: string }).text += text;
        }
      }
      if (isError) {
        output.isError = true;
      }
    },
  };
}
