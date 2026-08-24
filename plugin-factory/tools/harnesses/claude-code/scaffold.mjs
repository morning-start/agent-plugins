/**
 * claude-code/scaffold.mjs — Claude Code scaffold helpers.
 *
 * Provides harness-specific template values and content generation
 * for Claude Code plugin scaffolding.
 */

/** Get install section for README. */
export function getInstallSection(name) {
  return `### Claude Code\n\nRun Claude Code with this plugin loaded:\n\n\`\`\`sh\nclaude --plugin-dir ./${name}\n\`\`\``;
}

/** Get quick-start section for README. */
export function getQuickStartSection(prefix) {
  return `### Claude Code\n\nStart a new session with the plugin loaded. Claude auto-triggers\nskills from their "Use when…" descriptions; you can also invoke commands\ndirectly (\`/${prefix}-<command>\`).\n\nVerify the install:\n\n\`\`\`sh\nclaude -p '/extensions'   # lists every loaded skill/command/hook/tool/MCP\n\`\`\``;
}

/** Get uninstall section for README. */
export function getUninstallSection(name) {
  return `### Claude Code\n\n\`\`\`sh\nclaude plugin uninstall ${name}\n\`\`\`\nOr delete the plugin directory (no uninstall step needed for skills-dir plugins).`;
}

/** Get install.sh lines. */
export function getInstallSh() {
  return 'echo "  Claude Code: claude --plugin-dir $src"';
}

/** Get install.ps1 lines. */
export function getInstallPs() {
  return 'Write-Host "  Claude Code: claude --plugin-dir $src"';
}

/** Get package.json harness fields (Claude Code doesn't add fields). */
export function getPackageFields() {
  return [];
}

/** Get template directory name. */
export const templateDir = "claude-code";

export const name = "claude-code";
