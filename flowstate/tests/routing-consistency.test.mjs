// tests/routing-consistency.test.mjs
// Guards the routing table (场景 → 技能 → 节点) as a single source of truth.
// The canonical table lives in skills/using-flowstate/SKILL.md; README.md and
// the bootstrap notify line must not drift from it.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const ROUTE_TABLE = [
  { scenario: "新项目启动", skill: "fst-init", nodes: "N1 立项 / N2 冻结 / N3 设计" },
  { scenario: "任何新需求/改动", skill: "fst-change", nodes: "N5 变更 / N9 紧急" },
  { scenario: "迭代完成", skill: "fst-review", nodes: "N6 测试 / N7 灰度" },
  { scenario: "迭代开始", skill: "fst-iterate", nodes: "N4 开发 / N8 持续迭代" },
  { scenario: "工作区", skill: "fst-workplace", nodes: "横切" },
];

test("entry skill routing table lists every skill with its nodes", async () => {
  const entry = await readFile(join(ROOT, "skills", "using-flowstate", "SKILL.md"), "utf8");
  for (const { scenario, skill, nodes } of ROUTE_TABLE) {
    assert.ok(entry.includes(skill), `entry table missing ${skill}`);
    assert.ok(entry.includes(nodes), `entry table missing node mapping for ${skill}: ${nodes}`);
  }
});

test("README skill table lists every routed skill", async () => {
  const readme = await readFile(join(ROOT, "README.md"), "utf8");
  for (const { skill } of ROUTE_TABLE) {
    assert.ok(readme.includes(`\`${skill}\``), `README missing ${skill}`);
  }
});

test("every /fst-* command maps to an existing SKILL.md", async () => {
  const { readdir } = await import("node:fs/promises");
  const commands = (await readdir(join(ROOT, "commands"))).filter((f) => f.endsWith(".md"));
  assert.ok(commands.length > 0, "no commands found");
  for (const cmd of commands) {
    const skillName = cmd.replace(/\.md$/, "");
    const skillPath = join(ROOT, "skills", skillName, "SKILL.md");
    const text = await readFile(join(ROOT, "commands", cmd), "utf8");
    assert.ok(
      text.includes(`skills/${skillName}/SKILL.md`),
      `${cmd} does not reference its SKILL.md`,
    );
    await assert.doesNotReject(() => readFile(skillPath, "utf8"), `${skillPath} missing`);
  }
});

test("bootstrap notify line lists all routed skills", async () => {
  const bootstrap = await readFile(join(ROOT, ".pi", "extensions", "fst-bootstrap.ts"), "utf8");
  for (const { skill } of ROUTE_TABLE) {
    if (skill === "fst-workplace") continue; // notify line lists lifecycle routes only
    assert.ok(bootstrap.includes(skill), `pi bootstrap notify missing ${skill}`);
  }
});
