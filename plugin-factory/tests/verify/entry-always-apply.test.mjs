/**
 * Phase E — Entry Skill alwaysApply
 *
 * Verifies that using-pf SKILL.md frontmatter contains
 * alwaysApply: true in the metadata block.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pfRoot = join(__dirname, '../..');
const skillPath = join(pfRoot, 'skills/using-pf/SKILL.md');
const skillsDir = join(pfRoot, 'skills');

describe('entry-always-apply', () => {
  it('using-pf SKILL.md has alwaysApply: true in metadata', () => {
    const content = readFileSync(skillPath, 'utf-8');
    // alwaysApply must appear inside the YAML frontmatter block
    const frontmatterEnd = content.indexOf('---', 3); // second ---
    const frontmatter = content.slice(0, frontmatterEnd);
    assert.ok(
      /alwaysApply:\s*true/m.test(frontmatter),
      'using-pf SKILL.md must declare alwaysApply: true'
    );
  });

  it('alwaysApply is in metadata, not top-level', () => {
    const content = readFileSync(skillPath, 'utf-8');
    const lines = content.split('\n');
    // Find frontmatter block
    const endIdx = lines.findIndex((l, i) => i > 0 && l.trim() === '---');
    const fmLines = lines.slice(0, endIdx + 1);
    const fm = fmLines.join('\n');

    // Must be under metadata:
    assert.ok(
      /metadata:.*alwaysApply:\s*true/s.test(fm),
      'alwaysApply must be nested under metadata'
    );
  });

  it('other skills do not have alwaysApply by default', () => {
    const entries = readdirSync(skillsDir, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name);

    for (const entry of entries) {
      const skillMd = join(skillsDir, entry, 'SKILL.md');
      try {
        const content = readFileSync(skillMd, 'utf-8');
        const frontmatterEnd = content.indexOf('---', 3);
        if (frontmatterEnd < 0) continue;
        const frontmatter = content.slice(0, frontmatterEnd);
        // Only using-pf should have alwaysApply
        if (entry !== 'using-pf') {
          assert.ok(
            !/alwaysApply:\s*true/m.test(frontmatter),
            `skill ${entry} should not have alwaysApply`
          );
        }
      } catch {
        // no SKILL.md — skip
      }
    }
  });
});
