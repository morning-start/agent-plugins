const fs = require('fs');
let c = fs.readFileSync('scripts/verify.mjs', 'utf8');

const insert = '\n  // --- skill-structure: active skills must have Iron Law / Red Flags / 自检清单.\n' +
  '  for (const s of skills) {\n' +
  '    if (!s.text || s.dirName === "pf-learn") continue;\n' +
  '    const rel = `skills/${s.rel}SKILL.md`;\n' +
  '    const hasIronLaw = /##\\s+Iron\\s+Law/i.test(s.text);\n' +
  '    const hasRedFlags = /##\\s+Red\\s+Flags/i.test(s.text);\n' +
  '    const hasSelfCheck = /##\\s+自检清单|##\\s+Self-check/i.test(s.text);\n' +
  '    const missing = [];\n' +
  '    if (!hasIronLaw) missing.push("Iron Law");\n' +
  '    if (!hasRedFlags) missing.push("Red Flags");\n' +
  '    if (!hasSelfCheck) missing.push("自检清单");\n' +
  '    if (missing.length > 0) {\n' +
  '      findings.push(\n' +
  '        makeFinding("skill-structure", rel, "WARN", `Add missing sections: ${missing.join(", ")}.`, "Skill is missing the three-section standard (Iron Law / Red Flags / 自检清单).", true),\n' +
  '      );\n' +
  '    }\n' +
  '  }\n' +
  '\n' +
  '  // --- pre-commit-hook: verify hooks/pre-commit.sh exists when hooks/ directory is present.\n' +
  '  let hooksDir = null;\n' +
  '  try {\n' +
  '    hooksDir = await readdir(join(root, "hooks"));\n' +
  '  } catch {\n' +
  '    /* no hooks directory */\n' +
  '  }\n' +
  '  if (hooksDir && hooksDir.length > 0) {\n' +
  '    const hasPreCommit = hooksDir.some((f) => /^pre-commit\\.(sh|ps1)$/.test(f));\n' +
  '    if (!hasPreCommit) {\n' +
  '      findings.push(\n' +
  '        makeFinding("missing-pre-commit-hook", "hooks/", "WARN", "Add hooks/pre-commit.sh (and .ps1) for structural gate + secrets scan.", "No pre-commit hook found — commits bypass structural validation.", true),\n' +
  '      );\n' +
  '    }\n' +
  '  }\n';

const marker = '/* ------------------------------------------------------------------ */\n/* Layer 2 — harness contract                                         */';
const idx = c.indexOf(marker);
if (idx < 0) {
  console.error('Marker not found');
  process.exit(1);
}
c = c.substring(0, idx) + insert + '\n' + marker + c.substring(idx);
fs.writeFileSync('scripts/verify.mjs', c);
console.log('Patched successfully, lines:', c.split('\n').length);
