/**
 * MoonBit Skills — Pi Coding Agent Extension
 *
 * Injects the using-moonbit-skills bootstrap skill into the Pi session
 * context at startup and after compaction, mirroring the SessionStart hook
 * behavior on Claude Code / Cursor / Kimi Code.
 *
 * Also performs post-tool verification: after write/edit modifies a .mbt
 * file, runs lightweight MoonBit verification (fmt --check + check) and
 * appends the result to the tool output.
 *
 * Adapted from superpowers' Pi extension pattern.
 *
 * NOTE: The import path `@earendil-works/pi-coding-agent` is speculative —
 * Pi's TypeScript extension API is not yet publicly documented. When Pi
 * publishes official docs, verify and update the import path and event names
 * (resources_discover, session_start, session_compact, agent_end, context,
 * tool_result).
 */

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import {
  isWriteTool,
  isMoonBitFile,
  findMoonProjectRoot,
  runVerification,
  formatVerificationSuffix,
} from "../../hooks/shared/verify-moonbit.ts";

const EXTREMELY_IMPORTANT_MARKER = "<EXTREMELY_IMPORTANT>";
const BOOTSTRAP_MARKER = "moonbit-skills:using-moonbit-skills bootstrap for pi";

const extensionDir = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(extensionDir, "../..");
const skillsDir = resolve(packageRoot, "skills");
const bootstrapSkillPath = resolve(skillsDir, "using-moonbit-skills", "SKILL.md");

let cachedBootstrap: string | null | undefined;

export default function moonbitSkillsPiExtension(pi: ExtensionAPI) {
  // Runtime guard: Pi's TypeScript extension API is speculative (see file header).
  // If the API shape doesn't match, degrade to no-op instead of crashing the session.
  if (!pi || typeof pi.on !== "function") {
    console.warn("moonbit-skills: Pi extension API not available, extension disabled");
    return;
  }

  let injectBootstrap = true;

  pi.on("resources_discover", async () => ({
    skillPaths: [skillsDir],
  }));

  pi.on("session_start", async () => {
    injectBootstrap = true;
  });

  pi.on("session_compact", async () => {
    injectBootstrap = true;
  });

  pi.on("agent_end", async () => {
    injectBootstrap = false;
  });

  // Bootstrap injection on context event
  pi.on("context", async (event) => {
    if (!injectBootstrap) return;
    if (event.messages.some(messageContainsBootstrap)) return;

    const bootstrap = getBootstrapContent();
    if (!bootstrap) return;

    const bootstrapMessage = {
      role: "user" as const,
      content: [{ type: "text" as const, text: bootstrap }],
      timestamp: Date.now(),
    };

    const insertAt = firstNonCompactionSummaryIndex(event.messages);
    return {
      messages: [
        ...event.messages.slice(0, insertAt),
        bootstrapMessage,
        ...event.messages.slice(insertAt),
      ],
    };
  });

  // Post-tool verification: after write/edit on .mbt files
  pi.on("tool_result", async (event) => {
    if (!isWriteTool(event.toolName) || event.isError) return;

    const input = event.input as Record<string, unknown>;
    const filePath = String(input.file_path ?? input.path ?? "");
    if (!filePath || !isMoonBitFile(filePath)) return;

    const projectRoot = findMoonProjectRoot(filePath);
    if (!projectRoot) return;

    const results = await runVerification(projectRoot);
    const { text, isError } = formatVerificationSuffix(results);

    const content = event.content.map((c) => {
      if (c.type === "text" && typeof c.text === "string") {
        return { ...c, text: c.text + text };
      }
      return c;
    });
    return { content, isError };
  });
}

function getBootstrapContent(): string | null {
  if (cachedBootstrap !== undefined) return cachedBootstrap;
  try {
    const skillContent = readFileSync(bootstrapSkillPath, "utf8");
    const body = stripFrontmatter(skillContent);
    cachedBootstrap = `${EXTREMELY_IMPORTANT_MARKER}
${BOOTSTRAP_MARKER}
You have MoonBit Skills loaded.
The using-moonbit-skills skill content is included below and is already loaded for this Pi session. Follow it now. Do not try to load using-moonbit-skills again.
${body}
${piToolMapping()}
</EXTREMELY_IMPORTANT>`;
    return cachedBootstrap;
  } catch {
    cachedBootstrap = null;
    return null;
  }
}

function stripFrontmatter(content: string): string {
  const match = content.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);
  return (match ? match[1] : content).trim();
}

function piToolMapping(): string {
  return `## Pi tool mapping

Pi has native skills but does not expose Claude Code's \`Skill\` tool. When a MoonBit Skills instruction says to invoke a skill, use Pi's native skill system instead: load the relevant \`SKILL.md\` with \`read\` when the skill applies, or let a human invoke \`/skill:name\` explicitly.

Pi's built-in coding tools are lowercase: \`read\`, \`write\`, \`edit\`, \`bash\`, plus optional \`grep\`, \`find\`, and \`ls\`. Use those for the corresponding actions: read a file, create or edit files, run shell commands, search file contents, find files by name, and list directories.

Pi does not ship a standard subagent tool. If a subagent tool such as \`subagent\` from \`pi-subagents\` is available, use it for Moonbit-skills subagent workflows. If no subagent tool is available, do the work in this session or explain the missing capability instead of inventing \`Task\` calls.

Pi does not ship a standard task-list tool. If an installed todo/task tool is available, use it. Otherwise track work in plan files or a repo-local \`TODO.md\` when task tracking is needed. Treat older \`TodoWrite\` references as this task-tracking action.`;
}

function messageContainsBootstrap(message: unknown): boolean {
  const content = (message as { content?: unknown }).content;
  if (typeof content === "string") return content.includes(BOOTSTRAP_MARKER);
  if (!Array.isArray(content)) return false;
  return content.some((part) => {
    return (
      part &&
      typeof part === "object" &&
      (part as { type?: unknown }).type === "text" &&
      typeof (part as { text?: unknown }).text === "string" &&
      (part as { text: string }).text.includes(BOOTSTRAP_MARKER)
    );
  });
}

function firstNonCompactionSummaryIndex(messages: unknown[]): number {
  let index = 0;
  while ((messages[index] as { role?: unknown } | undefined)?.role === "compactionSummary") {
    index += 1;
  }
  return index;
}
