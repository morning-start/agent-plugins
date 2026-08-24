/**
 * codex/scaffold.mjs — Codex scaffold helpers.
 */

export function getInstallSection(name) {
  return `### Codex / ChatGPT\n\nInstall from a local marketplace or copy the plugin into your\n\`.agents/plugins/\` directory (see \`.codex-plugin/plugin.json\`).`;
}

export function getQuickStartSection() {
  return `### Codex / ChatGPT\n\nAfter install from the local marketplace, start a new conversation and\n@mention the plugin or let its skills auto-trigger. Verify the plugin\nappears in the Plugins directory.`;
}

export function getUninstallSection(name) {
  return `### Codex / ChatGPT\n\nRemove the plugin entry from the marketplace (or delete the copied plugin\ndirectory) and restart the app.`;
}

export function getInstallSh() {
  return 'echo "  codex:       copy to ~/.agents/plugins/ (see .codex-plugin/plugin.json)"';
}

export function getInstallPs() {
  return 'Write-Host "  codex:       copy to ~/.agents/plugins/ (see .codex-plugin/plugin.json)"';
}

export function getPackageFields() {
  return [];
}

export const templateDir = "codex";
export const name = "codex";
