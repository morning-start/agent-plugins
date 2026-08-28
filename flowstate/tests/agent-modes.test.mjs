import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const MODE_FILES = { loop: 'goal.md', spec: 'spec.md', graph: 'graph.md', todo: 'todo.md' };
const EXPECTED = { loop: { strategy: 'loop', default: 'false', state: 'state/goal.md' }, spec: { strategy: 'spec', default: 'true', state: 'state/checkpoint.json' }, graph: { strategy: 'graph', default: 'false', state: 'state/checkpoint.json' }, todo: { strategy: 'todo', default: 'false', state: 'state/checkpoint.json' } };

function frontmatter(text, file) { const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/); assert.ok(match, file + ' must start with YAML frontmatter'); return match[1]; }
function field(text, name, file) { const match = text.match(new RegExp('^' + name + ': (.+)$', 'm')); assert.ok(match, file + ' missing ' + name); return match[1].trim(); }

test('agent modes expose a stable machine-readable registry', async () => {
  const index = await readFile(join(ROOT, 'references', 'agent-modes', 'README.md'), 'utf8');
  const defaults = [];
  for (const [mode, filename] of Object.entries(MODE_FILES)) {
    const file = 'references/agent-modes/' + filename;
    const text = await readFile(join(ROOT, file), 'utf8');
    const fm = frontmatter(text, file);
    assert.equal(field(fm, 'name', file), mode);
    assert.equal(field(fm, 'strategy', file), EXPECTED[mode].strategy);
    assert.equal(field(fm, 'role', file), 'execution-mode');
    assert.equal(field(fm, 'layer', file), 'agent-modes');
    assert.equal(field(fm, 'default', file), EXPECTED[mode].default);
    assert.equal(field(fm, 'state', file), EXPECTED[mode].state);
    for (const required of ['input', 'boundary', 'acceptance', 'verification', 'evidence', 'exit', 'escalation']) assert.ok(field(fm, required, file), file + ' missing ' + required);
    assert.match(field(fm, 'tests', file), /agent-modes/);
    if (field(fm, 'default', file) === 'true') defaults.push(mode);
    assert.ok(index.includes(mode), 'registry missing ' + mode);
    assert.ok(text.includes('README.md'));
    assert.ok(text.includes('## 验证'));
    assert.ok(text.includes('## 与其他模式的关系'));
  }
  assert.deepEqual(defaults, ['spec']);
});

test('mode registry keeps lifecycle routing separate from execution strategy', async () => {
  const index = await readFile(join(ROOT, 'references', 'agent-modes', 'README.md'), 'utf8');
  assert.match(index, /先判定生命周期，再判定操作模式/);
  assert.match(index, /Todo 不能绕过 fst-change/);
  assert.match(index, /模式切换不改变 N1~N9 的所有权/);
  assert.match(index, /Graph.*Spec.*Loop/);
});