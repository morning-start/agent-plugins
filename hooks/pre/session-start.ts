/**
 * MoonBit Skills — OMP Session Start Hook
 *
 * Injects the using-moonbit-skills bootstrap skill into the session context
 * at startup and after compaction, mirroring the shell session-start hook
 * behavior on Claude Code / Cursor / Kimi Code.
 *
 * OMP only discovers hooks/pre/*.ts and hooks/post/*.ts — shell scripts
 * in the parent hooks/ directory are invisible to OMP.
 *
 * OMP provides the HookAPI and lifecycle events used below.
 * The hook is kept separate from the Pi extension so OMP can discover it
 * through its native hooks/pre/*.ts capability path.
 */

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import type { HookAPI } from "@oh-my-pi/pi-coding-agent/extensibility/hooks";

const BOOTSTRAP_MARKER = "moonbit-skills:using-moonbit-skills bootstrap for omp";

const hookDir = dirname(fileURLToPath(import.meta.url));
const pluginRoot = resolve(hookDir, "../..");
const skillsDir = resolve(pluginRoot, "skills");
const bootstrapSkillPath = resolve(skillsDir, "using-moonbit-skills", "SKILL.md");

let cachedBootstrap: string | null | undefined;

export default function (pi: HookAPI) {
  // Runtime guard: tolerate older or incompatible hook runners without
  // crashing the session.
  if (!pi || typeof pi.on !== "function") {
    return;
  }

  let injectBootstrap = true;

  pi.on("session_start", () => {
    injectBootstrap = true;
  });

  pi.on("session_before_compact", () => {
    injectBootstrap = true;
  });

  pi.on("turn_end", () => {
    injectBootstrap = false;
  });

  pi.on("context", (event) => {
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
}

function getBootstrapContent(): string | null {
  if (cachedBootstrap !== undefined) return cachedBootstrap;
  try {
    const skillContent = readFileSync(bootstrapSkillPath, "utf8");
    const body = stripFrontmatter(skillContent);
    cachedBootstrap = `<EXTREMELY-IMPORTANT>
${BOOTSTRAP_MARKER}
You have MoonBit Skills loaded.
The using-moonbit-skills skill content is included below and is already loaded for this OMP session. Follow it now. Do not try to load using-moonbit-skills again.
${body}

## OMP tool mapping

OMP discovers skills from the skills/ directory natively. When a MoonBit Skills instruction says to invoke a skill, use OMP's native skill system: the model matches the task against the skill description, or invoke explicitly with /skill:<name>.

OMP's built-in coding tools are lowercase: read, write, edit, bash, plus optional grep, find, and ls. Use those for the corresponding actions: read a file, create or edit files, run shell commands, search file contents, find files by name, and list directories.

OMP does not ship a standard subagent tool. If a subagent tool is available, use it for Moonbit-skills subagent workflows. If no subagent tool is available, do the work in this session or explain the missing capability instead of inventing Task calls.

OMP does not ship a standard task-list tool. If an installed todo/task tool is available, use it. Otherwise track work in plan files or a repo-local TODO.md when task tracking is needed. Treat older TodoWrite references as this task-tracking action.
</EXTREMELY-IMPORTANT>`;
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
