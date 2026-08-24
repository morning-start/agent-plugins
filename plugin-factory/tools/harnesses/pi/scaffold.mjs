/**
 * pi/scaffold.mjs — pi / oh-my-pi scaffold helpers.
 */

export function getInstallSection(name, harness = "pi") {
  if (harness === "oh-my-pi") {
    return `### oh-my-pi (omp)\n\nInstall from a git repository:\n\n\`\`\`sh\nomp plugin install git:github.com/<owner>/${name}\n\`\`\``;
  }
  return `### pi\n\nInstall from a git repository:\n\n\`\`\`sh\npi install git:github.com/<owner>/${name}\n\`\`\``;
}

export function getQuickStartSection(prefix, harness = "pi") {
  if (harness === "oh-my-pi") {
    return `### oh-my-pi (omp)\n\nSkills and commands are merged into the discovery surfaces on install.\nVerify: \`omp -p '/extensions'\` lists every loaded skill/command/hook/tool.`;
  }
  return `### pi\n\nSkills are discovered automatically on install. Force-invoke one with\n\`/skill:<skill-name>\`; slash commands via \`/skill:${prefix}-<command>\`.\n\nVerify: run \`/reload\` then ask the agent to use the skill.`;
}

export function getUninstallSection(name, harness = "pi") {
  if (harness === "oh-my-pi") {
    return `### oh-my-pi (omp)\n\n\`\`\`sh\nomp remove ${name}\n\`\`\``;
  }
  return `### pi\n\n\`\`\`sh\npi remove ${name}\n\`\`\``;
}

export function getInstallSh(name, harness = "pi") {
  if (harness === "oh-my-pi") {
    return `echo "  oh-my-pi:    omp plugin install git:github.com/<owner>/${name}"`;
  }
  return `echo "  pi:          pi install git:github.com/<owner>/${name}"`;
}

export function getInstallPs(name, harness = "pi") {
  if (harness === "oh-my-pi") {
    return `Write-Host "  oh-my-pi:    omp plugin install git:github.com/<owner>/${name}"`;
  }
  return `Write-Host "  pi:          pi install git:github.com/<owner>/${name}"`;
}

export function getPackageFields(prefix, harness = "pi") {
  const ext = `.pi/extensions/${prefix}-bootstrap.ts`;
  if (harness === "oh-my-pi") {
    return [
      `  "pi": { "extensions": ["${ext}"], "skills": ["skills"] },`,
      `  "omp": { "extensions": ["${ext}"], "skills": ["skills"] },`,
    ];
  }
  return [`  "pi": { "extensions": ["${ext}"], "skills": ["skills"] },`];
}

export const templateDir = "pi";
export const name = "pi";
