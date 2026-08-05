// tests/scaffold/scaffold-contract.test.mjs
// T1 contract tests for the multi-harness scaffold renderer.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { scaffoldPlugin } from "../../scripts/scaffold.mjs";

/** Create a temp dir and clean it up after the test. */
async function withTemp(fn) {
  const dir = await mkdtemp(join(tmpdir(), "pf-scaffold-"));
  try {
    return await fn(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

const BASE = {
  name: "git-release",
  prefix: "gr",
  description: "Release workflow helper",
  userLang: "zh-CN",
};

const ALL_HARNESSES = ["claude-code", "pi", "opencode", "oh-my-pi"];

/** Required artifacts per harness (T1 file map). */
const HARNESS_ARTIFACTS = {
  "claude-code": [
    ".claude-plugin/plugin.json",
    "hooks/hooks.json",
    "hooks/session-start.sh",
    "hooks/session-start.ps1",
  ],
  pi: [".pi/extensions/gr-bootstrap.ts"],
  opencode: [".opencode/opencode.json", ".opencode/plugins/gr-bootstrap.ts"],
  "oh-my-pi": [".pi/extensions/gr-bootstrap.ts", "OMP-NOTES.md"],
};

async function exists(p) {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

test("all four harnesses produce their required artifacts", async () => {
  await withTemp(async (tmp) => {
    const target = join(tmp, "git-release");
    const result = await scaffoldPlugin({ ...BASE, target, harnesses: ALL_HARNESSES });

    assert.equal(result.target, target);
    assert.deepEqual(result.harnesses, ALL_HARNESSES);
    assert.ok(Array.isArray(result.files) && result.files.length > 0);
    // files are sorted and relative
    const sorted = [...result.files].sort();
    assert.deepEqual(result.files, sorted);
    assert.ok(result.files.every((f) => !f.startsWith("/") && !f.startsWith("..")));

    for (const h of ALL_HARNESSES) {
      for (const rel of HARNESS_ARTIFACTS[h]) {
        assert.ok(await exists(join(target, rel)), `${h} missing required artifact: ${rel}`);
      }
    }
    // shared artifacts are always present
    for (const rel of [
      "package.json",
      "README.md",
      "README.zh-CN.md",
      "AGENTS.md",
      "CLAUDE.md",
      "install.sh",
      "install.ps1",
      "commands/README.md",
      "skills/gr-hello/SKILL.md",
      "scripts/verify.mjs",
      "scripts/validate-structure.sh",
      "scripts/validate-structure.ps1",
      "mcp-servers/README.md",
      "mcp-servers/gr-server.mjs",
    ]) {
      assert.ok(await exists(join(target, rel)), `missing shared artifact: ${rel}`);
    }
    // opencode skill discovery copy exists
    assert.ok(await exists(join(target, ".opencode", "skills", "gr-hello", "SKILL.md")));
    // package.json references only files that exist in the tree
    const pkg = JSON.parse(await readFile(join(target, "package.json"), "utf8"));
    for (const target2 of pkg.pi?.extensions ?? []) {
      assert.ok(await exists(join(target, target2)), `pi.extensions dangling: ${target2}`);
    }
    for (const target2 of pkg.omp?.extensions ?? []) {
      assert.ok(await exists(join(target, target2)), `omp.extensions dangling: ${target2}`);
    }
  });
});

test("a Claude-only request does not produce pi, omp, or opencode files", async () => {
  await withTemp(async (tmp) => {
    const target = join(tmp, "claude-only");
    await scaffoldPlugin({ ...BASE, target, harnesses: ["claude-code"] });

    assert.ok(await exists(join(target, ".claude-plugin", "plugin.json")));
    assert.ok(!(await exists(join(target, ".pi"))), "unexpected .pi directory");
    assert.ok(!(await exists(join(target, ".opencode"))), "unexpected .opencode directory");
    assert.ok(!(await exists(join(target, "OMP-NOTES.md"))), "unexpected OMP-NOTES.md");

    const pkg = JSON.parse(await readFile(join(target, "package.json"), "utf8"));
    assert.equal(pkg.pi, undefined, "package.json must not claim pi without pi artifacts");
    assert.equal(pkg.omp, undefined, "package.json must not claim omp without omp artifacts");
  });
});

test("a name containing uppercase characters is rejected", async () => {
  await withTemp(async (tmp) => {
    const target = join(tmp, "bad-name");
    await assert.rejects(
      () => scaffoldPlugin({ ...BASE, name: "Git-Release", target, harnesses: ["claude-code"] }),
      /scaffold options invalid/,
    );
    assert.ok(!(await exists(target)), "rejected scaffold must not create the target");
  });
});

test("special characters in the description are rendered literally", async () => {
  const special = "a/b & c $d \\e 中文\nsecond line";
  await withTemp(async (tmp) => {
    const target = join(tmp, "special");
    await scaffoldPlugin({ ...BASE, description: special, target, harnesses: ALL_HARNESSES });

    const readme = await readFile(join(target, "README.md"), "utf8");
    assert.ok(readme.includes(special), "README must contain the description byte-for-byte");
    const skill = await readFile(join(target, "skills", "gr-hello", "SKILL.md"), "utf8");
    assert.ok(skill.includes("gr-hello"), "skill file rendered with prefix");
  });
});

test("an existing target directory is rejected without modifying it", async () => {
  await withTemp(async (tmp) => {
    const target = join(tmp, "existing");
    await mkdir(target, { recursive: true });
    await writeFile(join(target, "keep.txt"), "original", "utf8");

    await assert.rejects(
      () => scaffoldPlugin({ ...BASE, target, harnesses: ["claude-code"] }),
      /target already exists/,
    );
    const keep = await readFile(join(target, "keep.txt"), "utf8");
    assert.equal(keep, "original", "existing target content must be untouched");
  });
});

test("an unknown harness is rejected before writing anything", async () => {
  await withTemp(async (tmp) => {
    const target = join(tmp, "bad-harness");
    await assert.rejects(
      () => scaffoldPlugin({ ...BASE, target, harnesses: ["claude-code", "nope"] }),
      /scaffold options invalid/,
    );
    assert.ok(!(await exists(target)));
  });
});

test("generated package.json is valid JSON and deterministically rendered", async () => {
  const filesA = await withTemp(async (tmp) => {
    const result = await scaffoldPlugin({
      ...BASE,
      target: join(tmp, "a"),
      harnesses: ALL_HARNESSES,
    });
    return result.files;
  });
  const filesB = await withTemp(async (tmp) => {
    const result = await scaffoldPlugin({
      ...BASE,
      target: join(tmp, "b"),
      harnesses: ALL_HARNESSES,
    });
    return result.files;
  });
  assert.deepEqual(filesA, filesB, "scaffold output must be deterministic");
});

test("autoVerify runs the generated verifier and passes on a clean scaffold", async () => {
  await withTemp(async (tmp) => {
    const target = join(tmp, "auto-verify");
    const result = await scaffoldPlugin({
      ...BASE,
      target,
      harnesses: ["claude-code"],
      autoVerify: true,
    });
    assert.ok(result.verify, "autoVerify must attach the verify result");
    assert.equal(result.verify.ok, true, `verify should pass:\n${result.verify.stdout}`);
    assert.match(result.verify.stdout, /No findings/);
  });
});

test("autoVerify is skipped (no verify field) unless requested", async () => {
  await withTemp(async (tmp) => {
    const target = join(tmp, "no-verify");
    const result = await scaffoldPlugin({
      ...BASE,
      target,
      harnesses: ["claude-code"],
    });
    assert.equal(result.verify, undefined);
  });
});
