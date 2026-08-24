/**
 * opencode/scaffold.mjs — opencode scaffold helpers.
 */

export function getInstallSection() {
  return `### opencode\n\nCopy the plugin directory into your project — opencode picks up\n\`.opencode/plugins/\`; the bootstrap plugin registers \`skills/\` as an opencode\nskill source at runtime via its \`config\` hook (see \`.opencode/INSTALL.md\`).`;
}

export function getQuickStartSection() {
  return `### opencode\n\nPlugins load at startup from \`.opencode/plugins/\`; skills come from the single\n\`skills/\` source, self-registered by the bootstrap plugin's \`config\` hook.\nRestart opencode after adding the plugin.`;
}

export function getUninstallSection() {
  return `### opencode\n\nRemove the plugin's files from \`.opencode/plugins/\`, then restart opencode.`;
}

export function getInstallSh() {
  return 'echo "  opencode:    see .opencode/INSTALL.md in the plugin"';
}

export function getInstallPs() {
  return 'Write-Host "  opencode:    see .opencode/INSTALL.md in the plugin"';
}

export function getPackageFields() {
  return [];
}

export const templateDir = "opencode";
export const name = "opencode";
