const fs = require('fs');
let c = fs.readFileSync('scripts/verify.mjs', 'utf8');

const insert = [
  '  // --- pre-commit-hook: verify hooks/pre-commit.sh exists when hooks/ directory is present.',
  '  let hooksDir = null;',
  '  try {',
  '    hooksDir = await readdir(join(root, "hooks"));',
  '  } catch {',
  '    /* no hooks directory */',
  '  }',
  '  if (hooksDir && hooksDir.length > 0) {',
  '    const hasPreCommit = hooksDir.some((f) => /^pre-commit\\.(sh|ps1)$/.test(f));',
  '    if (!hasPreCommit) {',
  '      findings.push(',
  '        makeFinding("missing-pre-commit-hook", "hooks/", "WARN", "Add hooks/pre-commit.sh (and .ps1) for structural gate + secrets scan.", "No pre-commit hook found — commits bypass structural validation.", true),',
  '      );',
  '    }',
  '  }',
  '',
].join('\n');

// Insert after line 276 (the closing `}` of structureChecks) and before line 278 (blank) + 279 (/* Layer 2)
const lines = c.split('\n');
// Find "/* Layer 2" line
let insertAt = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('/* Layer 2 — harness contract')) {
    insertAt = i;
    break;
  }
}
if (insertAt < 0) {
  console.error('Layer 2 marker not found');
  process.exit(1);
}

// Insert before the blank line + comment
const newLines = [...lines.slice(0, insertAt), insert, ...lines.slice(insertAt)];
fs.writeFileSync('scripts/verify.mjs', newLines.join('\n'));
console.log('Patched at line', insertAt);
