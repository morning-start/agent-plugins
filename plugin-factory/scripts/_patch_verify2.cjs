const fs = require('fs');
let c = fs.readFileSync('scripts/verify.mjs', 'utf8');

const insert = '\n  // --- pre-commit-hook: verify hooks/pre-commit.sh exists when hooks/ directory is present.\n' +
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

// Insert after the closing brace of structureChecks (line 276: "}") and before the Layer 2 comment
const marker = '\n}\n\n/* ------------------------------------------------------------------ */\n/* Layer 2';
const result = c.replace(marker, '\n}' + insert + '\n\n/* ------------------------------------------------------------------ */\n/* Layer 2');

if (result === c) {
  console.error('Marker not found');
  process.exit(1);
}
fs.writeFileSync('scripts/verify.mjs', result);
console.log('Patched successfully');
