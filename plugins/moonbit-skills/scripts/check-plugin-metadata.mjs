#!/usr/bin/env node
/*
 * Check that plugin metadata across all platforms stays in sync.
 *
 * Platform field whitelist (official schema only — non-official fields cause
 * inconsistent behavior across platforms and must not be added):
 *
 * | Platform              | Allowed fields                                                |
 * |-----------------------|---------------------------------------------------------------|
 * | OMP (root plugin.json + package.json)| name, version, description, author{name}, homepage, repository, license, omp.extensions |
 * | Claude Code           | name, version, description, author{name}, homepage, repository, license, hooks |
 * | Codex CLI             | name, version, description, author{name,url}, homepage, repository, license |
 * | Cursor                | name, version, description, author{name}, repository, license |
 * | Kimi Code             | name, version, description, author{name,url}, repository, license, sessionStart, hooks |
 * | OpenCode             | plugin, instructions                                          |
 *
 * Non-official fields removed in this revision:
 * - `skills` (Codex/Cursor/Kimi Code): platforms discover skills/ automatically
 * - `interface` (Kimi Code): displayName/shortDescription are non-official
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// All platform plugin descriptors that use plugin.json format
// OMP uses root plugin.json for shared metadata and package.json for runtime extensions
const PLUGIN_JSONS = [
  path.join(ROOT, "plugin.json"), // OMP shared metadata
  path.join(ROOT, ".claude-plugin", "plugin.json"),
  path.join(ROOT, ".codex-plugin", "plugin.json"),
  path.join(ROOT, ".cursor-plugin", "plugin.json"),
  path.join(ROOT, ".kimi-plugin", "plugin.json"),
];

// OpenCode uses opencode.json
const OPENCODE_DESCRIPTOR = path.join(ROOT, ".opencode", "opencode.json");

// Pi uses package.json
const PI_DESCRIPTOR = path.join(ROOT, "package.json");

// Pi extension file
const PI_EXTENSION = path.join(ROOT, ".pi", "extensions", "moonbit-skills.ts");

// OMP TypeScript hooks
const OMP_PRE_HOOK = path.join(ROOT, "hooks", "pre", "session-start.ts");
const OMP_POST_HOOK = path.join(ROOT, "hooks", "post", "verify-moonbit.ts");

// OMP commands directory
const OMP_COMMANDS_DIR = path.join(ROOT, "commands");

// Shared verification modules
const SHARED_VERIFY_TS = path.join(ROOT, "hooks", "shared", "verify-moonbit.ts");
const SHARED_VERIFY_SH = path.join(ROOT, "hooks", "post-tool-verify.sh");

// Platform-specific post-tool hook configs
const CODEX_HOOKS = path.join(ROOT, ".codex-plugin", "hooks.json");
const CURSOR_HOOKS = path.join(ROOT, ".cursor-plugin", "hooks.json");
const OPENCODE_PLUGIN = path.join(ROOT, ".opencode", "plugins", "moonbit-verify.ts");

// Fields that must be identical across all plugin.json descriptors
const SYNC_FIELDS = ["name", "version", "description"];

// Fields that must be identical across plugin.json descriptors
// Note: "skills" field is non-official and has been removed from all platforms.
// Platforms discover skills/ directory automatically (OMP) or via sessionStart hook (Kimi Code).
const PLUGIN_ONLY_SYNC_FIELDS = ["repository", "license"];

const readJson = (p) => JSON.parse(fs.readFileSync(p, "utf-8"));
const readText = (p) => fs.readFileSync(p, "utf-8");
const exists = (p) => fs.existsSync(p);
const rel = (p) => path.relative(ROOT, p).split(path.sep).join("/");

/** Python-like sorted() on values by their string form. */
function sortedKeyStr(values) {
  return [...values].sort((a, b) => {
    const sa = a === null || a === undefined ? "None" : String(a);
    const sb = b === null || b === undefined ? "None" : String(b);
    return sa < sb ? -1 : sa > sb ? 1 : 0;
  });
}

/** Python repr-style single-quoted list for failure messages. */
function pyList(values) {
  const items = sortedKeyStr(values).map((v) => {
    if (v === null || v === undefined) return "None";
    return `'${v}'`;
  });
  return `[${items.join(", ")}]`;
}

/**
 * Load all descriptors, returning { pluginJsons, opencode, pi }.
 * pluginJsons: [{ path, data }]
 */
function collectDescriptors() {
  const result = [];
  for (const p of PLUGIN_JSONS) {
    if (exists(p)) {
      result.push({ path: p, data: readJson(p) });
    } else {
      console.log(`⚠  Missing: ${p}`);
    }
  }

  let opencode = null;
  if (exists(OPENCODE_DESCRIPTOR)) {
    opencode = readJson(OPENCODE_DESCRIPTOR);
  } else {
    console.log(`⚠  Missing: ${OPENCODE_DESCRIPTOR}`);
  }

  let pi = null;
  if (exists(PI_DESCRIPTOR)) {
    pi = readJson(PI_DESCRIPTOR);
  } else {
    console.log(`⚠  Missing: ${PI_DESCRIPTOR}`);
  }

  return { pluginJsons: result, opencode, pi };
}

/** Check SYNC_FIELDS are identical across all plugin.json descriptors. */
function checkSyncFields(descriptors) {
  const failures = [];
  for (const field of SYNC_FIELDS) {
    const values = new Set(descriptors.map(({ data }) => data[field]));
    if (values.size !== 1) {
      failures.push(`${field}: ${pyList([...values])}`);
    }
  }
  return failures;
}

/** Check PLUGIN_ONLY_SYNC_FIELDS are identical across plugin.json descriptors. */
function checkPluginOnlyFields(descriptors) {
  const failures = [];
  for (const field of PLUGIN_ONLY_SYNC_FIELDS) {
    const values = new Set(descriptors.map(({ data }) => data[field]));
    if (values.size !== 1) {
      failures.push(`${field}: ${pyList([...values])}`);
    }
  }
  return failures;
}

/** Check author name is consistent across all plugin.json descriptors. */
function checkAuthor(descriptors) {
  const failures = [];
  const authors = new Set();
  for (const { data } of descriptors) {
    const author = data.author;
    if (author !== null && typeof author === "object" && !Array.isArray(author)) {
      authors.add(author.name);
    } else {
      authors.add(author);
    }
  }
  if (authors.size !== 1) {
    failures.push(`author: ${pyList([...authors])}`);
  }
  return failures;
}

/**
 * Check hooks field in plugin.json files that declare it.
 *
 * Claude Code auto-discovers hooks/hooks.json at the plugin root; a string
 * `hooks` field in .claude-plugin/plugin.json is INVALID schema (Claude Code
 * rejects it with "hooks: Invalid input"), so it must be omitted there.
 * Kimi Code still declares the path explicitly.
 */
function checkHooks(descriptors) {
  const failures = [];
  for (const { path: p, data } of descriptors) {
    const hooksVal = data.hooks;
    const expected = "hooks/hooks.json";
    const pname = path.basename(path.dirname(p));
    if (pname === ".claude-plugin") {
      // Claude Code auto-discovers hooks/hooks.json; omit the field.
      if (hooksVal !== undefined && hooksVal !== null) {
        failures.push(
          `${p}: hooks must be omitted (auto-discovered from ` +
            `hooks/hooks.json), got ${JSON.stringify(hooksVal)}`
        );
      }
    } else if (pname === ".kimi-plugin") {
      if (hooksVal === undefined || hooksVal === null) {
        failures.push(`${p}: hooks field missing, expected '${expected}'`);
      } else if (hooksVal !== expected) {
        failures.push(`${p}: hooks must point to '${expected}', got ${JSON.stringify(hooksVal)}`);
      }
    }
  }
  return failures;
}

/** Check Kimi Code has sessionStart.skill configured. */
function checkKimiSessionStart(descriptors) {
  const failures = [];
  for (const { path: p, data } of descriptors) {
    if (p.includes(".kimi-plugin")) {
      const ss = data.sessionStart;
      if (typeof ss !== "object" || ss === null || !ss.skill) {
        failures.push(`${p}: missing sessionStart.skill`);
      }
      break;
    }
  }
  return failures;
}

/** Check Kimi Code interface only contains official Kimi Code fields. */
function checkKimiInterface(descriptors) {
  const failures = [];
  for (const { path: p, data } of descriptors) {
    if (p.includes(".kimi-plugin")) {
      const iface = data.interface;
      if (typeof iface === "object" && iface !== null) {
        const nonOfficial = new Set(["category", "capabilities"]);
        const found = [...nonOfficial].filter((k) => k in iface).sort();
        if (found.length) {
          failures.push(`${p}: interface contains non-official fields: ${JSON.stringify(found)}`);
        }
      }
      break;
    }
  }
  return failures;
}

/** Check non-Kimi platforms don't have interface field. */
function checkInterfaceAbsence(descriptors) {
  const failures = [];
  for (const { path: p, data } of descriptors) {
    if (!p.includes(".kimi-plugin")) {
      if ("interface" in data) {
        failures.push(`${p}: interface field should not be present (not in official schema)`);
      }
    }
  }
  return failures;
}

/** Check OpenCode descriptor. */
function checkOpencode(opencode) {
  const failures = [];
  if (opencode === null || opencode === undefined) {
    return failures;
  }
  const instructions = opencode.instructions ?? [];
  if (instructions.length > 1) {
    failures.push(`opencode.json: instructions should only contain the bootstrap skill, got ${instructions.length} entries`);
  }
  if (!("plugin" in opencode)) {
    failures.push("opencode.json: missing plugin field");
  }
  return failures;
}

/** Check Pi and OMP package.json descriptors and the Pi extension file. */
function checkPi(pi) {
  const failures = [];
  if (pi === null || pi === undefined) {
    return failures;
  }
  const piConfig = pi.pi ?? {};
  if (!("skills" in piConfig)) {
    failures.push("package.json: missing pi.skills field");
  }
  if (!("extensions" in piConfig) || !piConfig.extensions) {
    failures.push("package.json: missing pi.extensions field");
  } else if (!exists(PI_EXTENSION)) {
    failures.push(`package.json: pi.extensions points to ${path.basename(PI_EXTENSION)} but file does not exist`);
  } else {
    const extContent = readText(PI_EXTENSION);
    if (!extContent.includes("session_start")) {
      failures.push(`Pi extension: session_start handler not found in ${rel(PI_EXTENSION)}`);
    }
    // Note: tool_result and shared/verify-moonbit checks are in checkPostToolHooks()
  }
  return failures;
}

/** Check OMP package metadata, TypeScript hooks, and commands. */
function checkOmp(pi) {
  const failures = [];

  if (pi === null || pi === undefined) {
    failures.push("package.json: missing OMP manifest");
  } else {
    const ompConfig = pi.omp ?? {};
    const extensions = ompConfig.extensions ?? [];
    if (!extensions.length) {
      failures.push("package.json: missing omp.extensions field");
    } else {
      for (const entry of extensions) {
        const entryPath = path.join(ROOT, entry);
        if (!exists(entryPath)) {
          failures.push(`package.json: omp.extensions entry missing: ${entry}`);
        }
      }
    }
  }

  // Pre-hook: session start bootstrap
  if (!exists(OMP_PRE_HOOK)) {
    failures.push(`OMP pre-hook missing: ${rel(OMP_PRE_HOOK)}`);
  } else if (!readText(OMP_PRE_HOOK).includes("session_start")) {
    failures.push(`OMP pre-hook: session_start handler not found in ${rel(OMP_PRE_HOOK)}`);
  }

  // Post-hook: post-tool verification
  if (!exists(OMP_POST_HOOK)) {
    failures.push(`OMP post-hook missing: ${rel(OMP_POST_HOOK)}`);
  } else {
    const postContent = readText(OMP_POST_HOOK);
    if (!postContent.includes("tool_result")) {
      failures.push(`OMP post-hook: tool_result handler not found in ${rel(OMP_POST_HOOK)}`);
    }
    if (!postContent.includes("shared/verify-moonbit")) {
      failures.push(`OMP post-hook: must import shared verification module in ${rel(OMP_POST_HOOK)}`);
    }
  }

  if (!exists(OMP_COMMANDS_DIR)) {
    failures.push(`OMP commands directory missing: ${rel(OMP_COMMANDS_DIR)}`);
  } else {
    let cmdFiles;
    try {
      cmdFiles = fs.readdirSync(OMP_COMMANDS_DIR).filter((f) => f.endsWith(".md"));
    } catch {
      cmdFiles = [];
    }
    if (!cmdFiles.length) {
      failures.push(`OMP commands directory empty: ${rel(OMP_COMMANDS_DIR)}`);
    }
  }
  return failures;
}

/** Check post-tool verification hooks are configured on all platforms. */
function checkPostToolHooks() {
  const failures = [];

  // Shared modules must exist
  if (!exists(SHARED_VERIFY_TS)) {
    failures.push(`Shared TS verify module missing: ${rel(SHARED_VERIFY_TS)}`);
  }
  if (!exists(SHARED_VERIFY_SH)) {
    failures.push(`Shared shell verify script missing: ${rel(SHARED_VERIFY_SH)}`);
  }

  // Claude Code + Kimi Code: hooks.json must have PostToolUse event
  const hooksJsonPath = path.join(ROOT, "hooks", "hooks.json");
  if (exists(hooksJsonPath)) {
    const hooksData = readJson(hooksJsonPath);
    const hooks = hooksData.hooks ?? {};
    if (!("PostToolUse" in hooks)) {
      failures.push("hooks/hooks.json: missing PostToolUse event (Claude Code + Kimi Code)");
    } else {
      // Verify it references post-tool-verify.sh
      const postHooks = hooks.PostToolUse ?? [];
      let foundVerify = false;
      for (const entry of postHooks) {
        for (const h of entry.hooks ?? []) {
          const cmd = h.command ?? "";
          if (cmd.includes("post-tool-verify")) {
            foundVerify = true;
            break;
          }
        }
        if (foundVerify) break;
      }
      if (!foundVerify) {
        failures.push("hooks/hooks.json: PostToolUse does not reference post-tool-verify.sh");
      }
    }
  } else {
    failures.push("hooks/hooks.json: file missing");
  }

  // Codex CLI: .codex-plugin/hooks.json must have PostToolUse
  if (exists(CODEX_HOOKS)) {
    const codexData = readJson(CODEX_HOOKS);
    const codexHooks = codexData.hooks ?? {};
    if (!("PostToolUse" in codexHooks)) {
      failures.push(`${rel(CODEX_HOOKS)}: missing PostToolUse event`);
    }
  } else {
    failures.push(`${rel(CODEX_HOOKS)}: file missing`);
  }

  // Cursor: .cursor-plugin/hooks.json must have afterFileEdit
  if (exists(CURSOR_HOOKS)) {
    const cursorData = readJson(CURSOR_HOOKS);
    const cursorHooks = cursorData.hooks ?? {};
    if (!("afterFileEdit" in cursorHooks)) {
      failures.push(`${rel(CURSOR_HOOKS)}: missing afterFileEdit event`);
    }
  } else {
    failures.push(`${rel(CURSOR_HOOKS)}: file missing`);
  }

  // OpenCode: .opencode/plugins/moonbit-verify.ts must exist with tool.execute.after
  if (exists(OPENCODE_PLUGIN)) {
    const pluginContent = readText(OPENCODE_PLUGIN);
    if (!pluginContent.includes("tool.execute.after")) {
      failures.push(`${rel(OPENCODE_PLUGIN)}: missing tool.execute.after handler`);
    }
    if (!pluginContent.includes("shared/verify-moonbit")) {
      failures.push(`${rel(OPENCODE_PLUGIN)}: must import shared verification module`);
    }
  } else {
    failures.push(`${rel(OPENCODE_PLUGIN)}: file missing`);
  }

  // Pi: extension must have tool_result handler
  if (exists(PI_EXTENSION)) {
    const extContent = readText(PI_EXTENSION);
    if (!extContent.includes("tool_result")) {
      failures.push(`${rel(PI_EXTENSION)}: missing tool_result handler`);
    }
    if (!extContent.includes("shared/verify-moonbit")) {
      failures.push(`${rel(PI_EXTENSION)}: must import shared verification module`);
    }
  } else {
    failures.push(`${rel(PI_EXTENSION)}: file missing`);
  }

  return failures;
}

function main() {
  const { pluginJsons, opencode, pi } = collectDescriptors();
  if (!pluginJsons.length) {
    console.log("No plugin descriptors found");
    return 0;
  }

  const failures = [];
  failures.push(...checkSyncFields(pluginJsons));
  failures.push(...checkPluginOnlyFields(pluginJsons));
  failures.push(...checkAuthor(pluginJsons));
  failures.push(...checkHooks(pluginJsons));
  failures.push(...checkKimiSessionStart(pluginJsons));
  failures.push(...checkKimiInterface(pluginJsons));
  failures.push(...checkInterfaceAbsence(pluginJsons));
  failures.push(...checkOpencode(opencode));
  failures.push(...checkPi(pi));
  failures.push(...checkOmp(pi));
  failures.push(...checkPostToolHooks());

  if (failures.length) {
    const total = pluginJsons.length + (opencode ? 1 : 0) + (pi ? 1 : 0);
    console.log(`Plugin metadata mismatch (${total} descriptors checked):`);
    for (const f of failures) {
      console.log(`- ${f}`);
    }
    return 1;
  }

  const platforms = pluginJsons
    .map(({ path: p }) => {
      const parentRel = rel(path.dirname(p));
      return parentRel === "" ? "." : parentRel;
    })
    .join(", ");
  const extras = [];
  if (opencode) extras.push("opencode.json");
  if (pi) extras.push("package.json");
  console.log(`✅ Plugin metadata consistent across all platforms`);
  console.log(`   ${pluginJsons.length} plugin.json, ${extras.length} extra descriptors`);
  console.log(`   ${SYNC_FIELDS.length + PLUGIN_ONLY_SYNC_FIELDS.length} sync fields`);
  console.log(`   Platforms: ${platforms} + ${extras.join(", ")}`);
  return 0;
}

process.exitCode = main();
