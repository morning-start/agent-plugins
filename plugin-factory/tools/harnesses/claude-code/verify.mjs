/**
 * claude-code/verify.mjs — Claude Code harness validator.
 *
 * Validates hooks.json command paths, event names, shell types,
 * artifact completeness, and plugin manifest structure.
 */
import { readFile, readdir, stat } from "node:fs/promises";
import { join, relative } from "node:path";

/** Claude Code hook event whitelist (29 events from 2026-08-09 guide). */
const CLAUDE_HOOK_EVENTS = new Set([
  "SessionStart", "SessionEnd", "Setup", "UserPromptSubmit", "UserPromptExpansion",
  "PreToolUse", "PermissionRequest", "PermissionDenied", "PostToolUse",
  "PostToolUseFailure", "PostToolBatch", "Notification", "MessageDisplay",
  "SubagentStart", "SubagentStop", "TaskCreated", "TaskCompleted", "Stop",
  "StopFailure", "TeammateIdle", "InstructionsLoaded", "ConfigChange",
  "CwdChanged", "DirectoryAdded", "FileChanged", "WorktreeCreate",
  "WorktreeRemove", "PreCompact", "PostCompact", "Elicitation", "ElicitationResult",
]);

const VALID_SHELLS = new Set(["bash", "powershell"]);

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

/** Validate hooks.json command paths use ${CLAUDE_PLUGIN_ROOT}. */
async function validateHookCommands(root, findings) {
  const hooksJsonPath = join(root, "hooks", "hooks.json");
  if (!await exists(hooksJsonPath)) return;

  let hooksJson;
  try {
    hooksJson = await readJson(hooksJsonPath);
  } catch (err) {
    findings.push(makeFinding(
      "invalid-hooks-json", "hooks/hooks.json", "FAIL",
      "Fix JSON syntax in hooks/hooks.json.", `Parse error: ${err.message}`,
    ));
    return;
  }

  if (!hooksJson.hooks || typeof hooksJson.hooks !== "object") {
    findings.push(makeFinding(
      "missing-hooks-key", "hooks/hooks.json", "FAIL",
      'Add a "hooks" object to hooks.json.', "No hook events defined.",
    ));
    return;
  }

  for (const [event, hookGroups] of Object.entries(hooksJson.hooks)) {
    if (!CLAUDE_HOOK_EVENTS.has(event)) {
      findings.push(makeFinding(
        "invalid-hook-event", "hooks/hooks.json", "FAIL",
        `Use a valid Claude Code hook event (found "${event}").`,
        `Unknown event "${event}" never fires.`,
      ));
    }

    if (!Array.isArray(hookGroups)) continue;

    for (const group of hookGroups) {
      if (!group.hooks || !Array.isArray(group.hooks)) continue;

      for (const hook of group.hooks) {
        if (hook.shell && !VALID_SHELLS.has(hook.shell)) {
          findings.push(makeFinding(
            "invalid-shell-type", "hooks/hooks.json", "WARN",
            `Use "bash" or "powershell" for shell (found "${hook.shell}").`,
            "Unknown shell type may not execute on all platforms.",
          ));
        }

        if (hook.command) {
          const cmd = hook.command;
          // Bare relative path check
          const bareMatch = cmd.match(/^(?:bash\s+"?)?((?:hooks|skills|tools|scripts|templates)\/[^\s"]+)/);
          if (bareMatch) {
            findings.push(makeFinding(
              "bare-relative-path", "hooks/hooks.json", "FAIL",
              `Use \${CLAUDE_PLUGIN_ROOT} for plugin-relative paths (found "${bareMatch[1]}").`,
              `Claude Code runs hooks with cwd = project root, not plugin root.`,
            ));
          }

          // Script existence check
          const scriptPath = cmd.replace(/^bash\s+"?/, "").replace(/^& '?/, "").replace(/"?\s*$/, "").replace(/^'/, "").replace(/'$/, "");
          const resolvedPath = scriptPath.replace(/\$\{CLAUDE_PLUGIN_ROOT\}/g, root);
          if (resolvedPath !== scriptPath && !resolvedPath.includes("$")) {
            if (!await exists(resolvedPath)) {
              findings.push(makeFinding(
                "hook-script-not-found", "hooks/hooks.json", "FAIL",
                `Create ${scriptPath.replace(/\$\{CLAUDE_PLUGIN_ROOT\}/, ".")}.`,
                `Referenced script does not exist.`,
              ));
            }
          }
        }
      }
    }
  }
}

/** Validate hook scripts exist. */
async function validateHookScripts(root, findings) {
  const hooksDir = join(root, "hooks");
  let hookFiles = [];
  try { hookFiles = await readdir(hooksDir); } catch { return; }

  for (const f of hookFiles) {
    if (!f.endsWith(".sh") || f === "hooks.json") continue;
    // Check shebang line
    try {
      const content = await readFile(join(hooksDir, f), "utf8");
      if (!content.startsWith("#!/")) {
        findings.push(makeFinding(
          "missing-shebang", `hooks/${f}`, "WARN",
          `Add shebang line (#!/usr/bin/env bash) to ${f}.`,
          "Script may not execute correctly on all systems.",
        ));
      }
    } catch {
      /* skip */
    }
  }
}

/** Validate plugin manifest structure. */
async function validateManifest(root, findings) {
  const manifestPath = join(root, ".claude-plugin", "plugin.json");
  if (!await exists(manifestPath)) return;

  let manifest;
  try { manifest = await readJson(manifestPath); } catch { return; }

  if (manifest.skills && !await exists(join(root, "skills"))) {
    findings.push(makeFinding(
      "missing-skills-dir", "skills", "FAIL",
      "Create skills/ directory.", "Plugin declares skills but skills/ is missing.",
    ));
  }

  if (Array.isArray(manifest.commands) && manifest.commands.length > 0 && !await exists(join(root, "commands"))) {
    findings.push(makeFinding(
      "missing-commands-dir", "commands", "FAIL",
      "Create commands/ directory.", "Plugin declares commands but commands/ is missing.",
    ));
  }
}

/**
 * Run all Claude Code harness validations.
 * @param {string} root - Plugin root directory
 * @returns {Promise<Array>} findings
 */
export async function validate(root) {
  const findings = [];
  await validateManifest(root, findings);
  await validateHookCommands(root, findings);
  await validateHookScripts(root, findings);
  return findings;
}

export const name = "claude-code";
