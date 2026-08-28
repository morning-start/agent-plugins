import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");

const contracts = [
  {
    name: "using-fst",
    required: [
      "fst-init",
      "fst-change",
      "fst-review",
      "fst-iterate",
      "fst-workplace",
      "NO ROUTING, NO WORK",
    ],
  },
  {
    name: "fst-init",
    required: [
      "3 条核心底线",
      "known_gaps",
      "范围说明书未签署",
      "fst-iterate",
    ],
  },
  {
    name: "fst-change",
    required: [
      "记录需求原文",
      "PLAN ONLY, NEVER EXECUTE",
      "24 小时内补录",
      "fst-iterate",
    ],
  },
  {
    name: "fst-iterate",
    required: [
      "NO PLAN, NO CODE",
      "lightweight todo",
      "spec / loop / graph",
      "fst-review",
    ],
  },
  {
    name: "fst-review",
    required: [
      "变更针对性测试",
      "核心回归",
      "DoD",
      "灰度",
      "fst-iterate",
    ],
  },
  {
    name: "fst-workplace",
    required: [
      ".agent-workplace",
      "提交边界",
      "不提交 git",
      "本技能自身不驱动流程",
    ],
  },
];

test("every flowstate skill declares shared contract coverage", async () => {
  for (const contract of contracts) {
    const path = join(ROOT, "skills", contract.name, "SKILL.md");
    const text = await readFile(path, "utf8");
    assert.match(
      text,
      /tests:\s*\[tests\/skill-contracts\.test\.mjs\]/,
      `${contract.name} must declare its contract test`,
    );
  }
});

for (const contract of contracts) {
  test(`${contract.name} preserves its workflow contract`, async () => {
    const path = join(ROOT, "skills", contract.name, "SKILL.md");
    const text = await readFile(path, "utf8");
    for (const phrase of contract.required) {
      assert.ok(text.includes(phrase), `${contract.name} is missing contract phrase: ${phrase}`);
    }
  });
}
