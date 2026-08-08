#!/usr/bin/env node
/**
 * verify.mjs — cross-platform structural, harness, and lifecycle audit engine.
 *
 * Single source of truth for pf-verify and pf-analyze. The same engine runs
 * against the plugin-factory root, any generated plugin directory, and
 * (copied) inside generated projects. Bash and PowerShell wrappers only pass
 * arguments through — there is no duplicate parsing logic in shell.
 *
 * Layers:
 *   structure      — Agent Skills standard, commands, multi-shell hooks, JSON
 *   harness        — complete artifact set for each advertised harness
 *   orchestration  — lifecycle probes (split/merge/port/retire signals)
 *
 * Finding shape: { signal, file, severity: FAIL|WARN|INFO, action, impact }
 * Exit code: 1 when any FAIL finding exists, otherwise 0 (warnings exit 0).
 * The engine never executes skill content and never installs dependencies.
 *
 * Usage:
 *   node scripts/verify.mjs [structure|harness|lifecycle] --root <dir> [--format table|json] [--coverage=WARN|FAIL]
 */
import { readFile, readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const NAME_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const SEVERITY_RANK = { FAIL: 3, WARN: 2, INFO: 1 };
const MAX_SKILL_LINES = 300;
const MAX_HEADING_DEPTH = 3;
const MAX_SKILL_NESTING = 2;
const STOPWORDS = new Set(["a", "an", "the", "for", "of", "to", "in", "on", "with", "and", "or", "when", "use", "is", "be"]);

/** Standard skill-skeleton headings every skill is expected to share. These are
 *  structure, not duplicated guidance — repeated-guidance must ignore them. */
const SKELETON_HEADINGS = new Set([
  "overview",
  "when to use",
  "prerequisites",
  "workflow",
  "outputs",
  "acceptance",
  "status",
  "rules",
  "common mistakes",
]);

/** Parse the YAML frontmatter block of a markdown skill/command file. */
export function parseFrontmatter(text) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
  if (!m) return null;
  const fields = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
    if (kv) fields[kv[1]] = kv[2].trim();
  }
  return fields;
}

/** Read and parse a JSON file; returns null when absent, throws on bad JSON. */
export async function readJson(path) {
  const text = await readFile(path, "utf8");
  return JSON.parse(text);
}

/**
 * Collect skill directories under `<root>/skills/`, recording nesting depth
 * (depth 1 = skills/<name>/SKILL.md). Missing SKILL.md files are reported by
 * the structure layer.
 */
export async function collectSkills(root) {
  const out = [];
  const base = join(root, "skills");
  async function walk(dir, depth, prefix) {
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        const skillFile = join(full, "SKILL.md");
        let text = null;
        try {
          text = await readFile(skillFile, "utf8");
        } catch {
          /* missing SKILL.md handled by structure checks */
        }
        if (text !== null || (await isLikelySkillDir(full))) {
          out.push({ dirName: entry.name, rel: `${prefix}${entry.name}/`, path: skillFile, depth, text });
        }
        await walk(full, depth + 1, `${prefix}${entry.name}/`);
      }
    }
  }
  await walk(base, 1, "");
  return out;
}

/** A directory is a skill dir when it contains SKILL.md or non-skill subfiles. */
async function isLikelySkillDir(dir) {
  try {
    const entries = await readdir(dir);
    return entries.some((e) => e.endsWith(".md") || e.endsWith(".txt"));
  } catch {
    return false;
  }
}

/** Determine which harnesses the plugin advertises (by existing manifests). */
export async function collectHarnesses(root) {
  const harnesses = [];
  const pkg = join(root, "package.json");
  try {
    const json = await readJson(pkg);
    if (json.pi) harnesses.push("pi");
    if (json.omp) harnesses.push("oh-my-pi");
  } catch {
    /* no package.json */
  }
  try {
    await stat(join(root, ".claude-plugin", "plugin.json"));
    harnesses.push("claude-code");
  } catch {
    /* not advertised */
  }
  try {
    await stat(join(root, ".opencode", "opencode.json"));
    harnesses.push("opencode");
  } catch {
    /* not advertised */
  }
  try {
    await stat(join(root, ".codex-plugin", "hooks.json"));
    harnesses.push("codex");
  } catch {
    /* not advertised */
  }
  return harnesses;
}

/** Create one finding with the stable shape. */
export function makeFinding(signal, file, severity, action, impact, learnable = false) {
  return { signal, file, severity, action, impact, learnable };
}

/** Render findings as a severity-ranked table. */
export function renderTable(findings) {
  const rows = sortFindings(findings).map(
    (f) => `${f.severity}\t${f.signal}\t${f.file || "-"}\t${f.action}`,
  );
  return ["SEVERITY\tSIGNAL\tFILE\tACTION", ...rows].join("\n");
}

function sortFindings(findings) {
  return [...findings].sort((a, b) => (SEVERITY_RANK[b.severity] || 0) - (SEVERITY_RANK[a.severity] || 0));
}

/* ------------------------------------------------------------------ */
/* Layer 1 — structure                                                 */
/* ------------------------------------------------------------------ */

async function structureChecks(root, findings) {
  const skills = await collectSkills(root);

  for (const s of skills) {
    const rel = `skills/${s.rel}SKILL.md`;
    if (!s.text) {
      findings.push(
        makeFinding("missing-skill-file", rel, "FAIL", `Create ${rel}.`, "The skill cannot be discovered."),
      );
      continue;
    }
    const fm = parseFrontmatter(s.text);
    if (!fm) {
      findings.push(
        makeFinding("missing-frontmatter", rel, "FAIL", "Add YAML frontmatter delimited by --- markers.", "Skill metadata is unreadable."),
      );
      continue;
    }
    const name = fm.name || "";
    if (name !== s.dirName) {
      findings.push(
        makeFinding("name-mismatch", rel, "FAIL", `Set frontmatter name to "${s.dirName}".`, "The skill name does not match its directory."),
      );
    }
    if (!NAME_RE.test(name)) {
      findings.push(
        makeFinding("invalid-name", rel, "FAIL", "Use lowercase letters, digits, and hyphens.", "The name violates the agent-skills naming standard."),
      );
    }
    const desc = fm.description || "";
    if (!desc.startsWith("Use when")) {
      findings.push(
        makeFinding("description-trigger", rel, "FAIL", 'Start description with "Use when…".', "The model cannot decide when to trigger the skill."),
      );
    }
    if (desc.length > 1024) {
      findings.push(
        makeFinding("description-too-long", rel, "FAIL", "Keep description under 1024 characters.", "The description exceeds the standard limit."),
      );
    }
  }

  // Commands must carry a frontmatter description.
  let commands = [];
  try {
    commands = await readdir(join(root, "commands"));
  } catch {
    /* no commands directory */
  }
  for (const f of commands) {
    if (!f.endsWith(".md")) continue;
    const rel = `commands/${f}`;
    const text = await readFile(join(root, "commands", f), "utf8");
    const fm = parseFrontmatter(text);
    if (!fm || !fm.description) {
      findings.push(
        makeFinding("missing-command-description", rel, "FAIL", "Add a frontmatter description.", "The slash command cannot be registered."),
      );
    }
  }

  // Hooks need bash + a secondary shell (PowerShell or Nushell).
  let hooks = [];
  try {
    hooks = await readdir(join(root, "hooks"));
  } catch {
    /* no hooks directory */
  }
  for (const f of hooks) {
    if (!f.endsWith(".sh")) continue;
    const base = f.replace(/\.sh$/, "");
    const ps1 = join(root, "hooks", `${base}.ps1`);
    const nu = join(root, "hooks", `${base}.nu`);
    const hasPs1 = await stat(ps1).then(() => true, () => false);
    const hasNu = await stat(nu).then(() => true, () => false);
    if (!hasPs1 && !hasNu) {
      findings.push(
        makeFinding("missing-hook-pair", `hooks/${f}`, "FAIL", `Create hooks/${base}.ps1 or hooks/${base}.nu.`, "Hooks must ship bash + a secondary shell variant."),
      );
    }
  }

  // Declared JSON files must be valid JSON.
  for (const rel of ["package.json", ".claude-plugin/plugin.json", "hooks/hooks.json", ".opencode/opencode.json"]) {
    const abs = join(root, rel);
    try {
      await readJson(abs);
    } catch (err) {
      if (err.code === "ENOENT") continue;
      findings.push(
        makeFinding("invalid-json", rel, "FAIL", `Fix JSON syntax in ${rel}.`, "The manifest cannot be parsed."),
      );
    }
  }

  // --- skill-structure: active skills must have Iron Law / Red Flags / 自检清单.
  for (const s of skills) {
    if (!s.text || s.dirName === "pf-learn") continue;
    const rel = `skills/${s.rel}SKILL.md`;
    const hasIronLaw = /##\s+Iron\s+Law/i.test(s.text);
    const hasRedFlags = /##\s+Red\s+Flags/i.test(s.text);
    const hasSelfCheck = /##\s+自检清单|##\s+Self-check/i.test(s.text);
    const missing = [];
    if (!hasIronLaw) missing.push("Iron Law");
    if (!hasRedFlags) missing.push("Red Flags");
    if (!hasSelfCheck) missing.push("自检清单");
    if (missing.length > 0) {
      findings.push(
        makeFinding("skill-structure", rel, "WARN", `Add missing sections: ${missing.join(", ")}.`, "Skill is missing the three-section standard (Iron Law / Red Flags / 自检清单).", true),
      );
    }
  }

  // --- pre-commit-hook: verify hooks/pre-commit.sh exists when hooks/ directory is present.
  let hooksDir = null;
  try {
    hooksDir = await readdir(join(root, "hooks"));
  } catch {
    /* no hooks directory */
  }
  if (hooksDir && hooksDir.length > 0) {
    const hasPreCommit = hooksDir.some((f) => /^pre-commit\.(sh|ps1)$/.test(f));
    if (!hasPreCommit) {
      findings.push(
        makeFinding("missing-pre-commit-hook", "hooks/", "WARN", "Add hooks/pre-commit.sh (and .ps1) for structural gate + secrets scan.", "No pre-commit hook found — commits bypass structural validation.", true),
      );
    }
  }
}

/* ------------------------------------------------------------------ */
/* Layer 2 — harness contract                                         */
/* ------------------------------------------------------------------ */

async function harnessChecks(root, findings) {
  const harnesses = await collectHarnesses(root);
  if (harnesses.length === 0) return;

  for (const h of harnesses) {
    switch (h) {
      case "claude-code": {
        for (const rel of [".claude-plugin/plugin.json", "skills"]) {
          try {
            await stat(join(root, rel));
          } catch {
            findings.push(
              makeFinding("missing-harness-artifact", rel, "FAIL", `Create ${rel}.`, `Claude Code advertisement is missing ${rel}.`),
            );
          }
        }
        const manifest = join(root, ".claude-plugin", "plugin.json");
        try {
          const json = await readJson(manifest);
          if (Array.isArray(json.commands) && json.commands.length > 0) {
            try {
              await stat(join(root, "commands"));
            } catch {
              findings.push(
                makeFinding("missing-harness-artifact", "commands", "FAIL", "Create commands/ declared by plugin.json.", "Declared commands cannot load."),
              );
            }
          }
          if (Array.isArray(json.hooks) && json.hooks.length > 0) {
            try {
              await stat(join(root, "hooks", "hooks.json"));
            } catch {
              findings.push(
                makeFinding("missing-harness-artifact", "hooks/hooks.json", "FAIL", "Create hooks/hooks.json declared by plugin.json.", "Declared hooks cannot load."),
              );
            }
          }
        } catch {
          /* invalid manifest already reported by structure layer */
        }
        break;
      }
      case "pi":
      case "oh-my-pi": {
        const key = h === "pi" ? "pi" : "omp";
        let pkg = null;
        try {
          pkg = await readJson(join(root, "package.json"));
        } catch {
          findings.push(
            makeFinding("missing-harness-artifact", "package.json", "FAIL", "Create package.json.", `${h} advertisement requires package.json.`),
          );
          break;
        }
        const section = pkg[key];
        if (!section) {
          findings.push(
            makeFinding("missing-harness-artifact", `package.json.${key}`, "FAIL", `Add the "${key}" field to package.json.`, `${h} cannot discover this plugin without ${key} metadata.`),
          );
          break;
        }
        const targets = [
          ...(Array.isArray(section.skills) ? section.skills.map((s) => `skills:${s}`) : []),
          ...(Array.isArray(section.extensions) ? section.extensions.map((e) => `extensions:${e}`) : []),
        ];
        for (const t of targets) {
          const [kind, path] = t.split(":");
          try {
            await stat(join(root, path));
          } catch {
            findings.push(
              makeFinding("missing-harness-artifact", `package.json.${key}.${kind} -> ${path}`, "FAIL", `Create ${path}.`, `${h} declares ${path} but it is missing.`),
            );
          }
        }
        break;
      }
      case "opencode": {
        for (const rel of [".opencode/opencode.json", ".opencode/plugins"]) {
          try {
            await stat(join(root, rel));
          } catch {
            findings.push(
              makeFinding("missing-harness-artifact", rel, "FAIL", `Create ${rel}.`, `opencode advertisement is missing ${rel}.`),
            );
          }
        }
        // A discoverable skill path must exist (opencode does not scan root skills/).
        const skillPaths = [".opencode/skills", ".agents/skills", ".claude/skills"];
        let found = false;
        for (const p of skillPaths) {
          try {
            await stat(join(root, p));
            found = true;
            break;
          } catch {
            /* try next */
          }
        }
        if (!found) {
          findings.push(
            makeFinding("missing-harness-artifact", ".opencode/skills", "FAIL", "Create .opencode/skills/ (or .agents/skills/).", "opencode cannot discover any skill."),
          );
        }
        break;
      }
      case "codex": {
        for (const rel of [".codex-plugin/hooks.json"]) {
          try {
            await stat(join(root, rel));
          } catch {
            findings.push(
              makeFinding("missing-harness-artifact", rel, "FAIL", `Create ${rel}.`, `Codex advertisement is missing ${rel}.`),
            );
          }
        }
        break;
      }
      default:
        break;
    }
  }
}

/* ------------------------------------------------------------------ */
/* Layer 3 — orchestration / lifecycle probes                         */
/* ------------------------------------------------------------------ */

/** Normalized keyword bag for trigger-overlap comparison. */
export function keywordBag(description) {
  return description
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w) && !/^use when$/i.test(w));
}

/** Jaccard similarity of two keyword sets. */
export function jaccard(a, b) {
  const setA = new Set(a);
  const setB = new Set(b);
  if (setA.size === 0 && setB.size === 0) return 1;
  let inter = 0;
  for (const w of setA) if (setB.has(w)) inter += 1;
  const union = setA.size + setB.size - inter;
  return union === 0 ? 0 : inter / union;
}

async function orchestrationChecks(root, findings) {
  const skills = await collectSkills(root);
  const names = new Set(skills.map((s) => s.dirName));
  const entrySkills = skills.filter((s) => /^using-/.test(s.dirName));
  const methods = skills.filter((s) => s.text !== null && s.depth === 1);

  // --- missing-entry-skill: methodology plugin without using-<plugin> entry.
  const declaredEntry = await declaresEntryPath(root);
  if (declaredEntry && entrySkills.length === 0) {
    findings.push(
      makeFinding(
        "missing-entry-skill",
        "skills/",
        "FAIL",
        "Create the declared using-<plugin> entry skill or remove the methodology-plugin claim.",
        "The advertised entry path cannot activate the workflow.",
      ),
    );
  }

  // --- broken-handoff: chained skills reference skills that do not exist.
  for (const s of skills) {
    if (!s.text) continue;
    const rel = `skills/${s.rel}SKILL.md`;
    const refs = collectSkillRefs(s.text);
    for (const ref of refs) {
      if (ref.startsWith("using-") || ref.startsWith("pf-")) continue; // external/convention refs
      if (!names.has(ref)) {
        findings.push(
          makeFinding("broken-handoff", rel, "FAIL", `Route to "${ref}" — create skills/${ref}/SKILL.md or remove the handoff.`, "The chain link cannot activate."),
        );
      }
    }
  }

  // --- orphan-skill: non-entry skill unreachable from any entry or chain.
  if (entrySkills.length > 0) {
    const reachable = new Set(entrySkills.map((s) => s.dirName));
    const allText = skills.filter((s) => s.text).map((s) => s.text).join("\n");
    for (const s of skills) {
      if (reachable.has(s.dirName)) continue;
      if (new RegExp(`\\b${escapeRegExp(s.dirName)}\\b`).test(allText) || new RegExp(`\\b${escapeRegExp(s.dirName)}\\b`).test(await rootIndexText(root))) {
        reachable.add(s.dirName);
      }
    }
    for (const s of skills) {
      if (reachable.has(s.dirName) || /^using-/.test(s.dirName)) continue;
      findings.push(
        makeFinding("orphan-skill", `skills/${s.rel}SKILL.md`, "WARN", "Link this skill from an entry point or chain, or merge it.", "The skill is unreachable from any entry or chain."),
      );
    }
  }

  // --- skill-too-large: line count or heading depth beyond thresholds.
  for (const s of skills) {
    if (!s.text) continue;
    const rel = `skills/${s.rel}SKILL.md`;
    const lines = s.text.split(/\r?\n/);
    const reasons = [];
    if (lines.length > MAX_SKILL_LINES) reasons.push(`${lines.length} lines > ${MAX_SKILL_LINES}`);
    const maxDepth = Math.max(
      0,
      ...lines.filter((l) => /^#{1,6}\s/.test(l)).map((l) => (l.match(/^#+/) || [""])[0].length),
    );
    if (maxDepth > MAX_HEADING_DEPTH) reasons.push(`heading depth ${maxDepth} > ${MAX_HEADING_DEPTH}`);
    if (reasons.length > 0) {
      findings.push(
        makeFinding("skill-too-large", rel, "WARN", "Split into focused skills or extract shared references.", `Skill exceeds size guidance (${reasons.join(", ")}).`),
      );
    }
  }

  // --- trigger-overlap: two descriptions matching the same intent.
  const withDesc = skills.filter((s) => s.text && parseFrontmatter(s.text)?.description);
  for (let i = 0; i < withDesc.length; i++) {
    for (let j = i + 1; j < withDesc.length; j++) {
      const a = parseFrontmatter(withDesc[i].text).description;
      const b = parseFrontmatter(withDesc[j].text).description;
      const bagA = keywordBag(a);
      const bagB = keywordBag(b);
      const sim = jaccard(bagA, bagB);
      const exact = a.trim().toLowerCase() === b.trim().toLowerCase();
      if (exact || sim >= 0.85) {
        findings.push(
          makeFinding(
            "trigger-overlap",
            `skills/${withDesc[i].rel}SKILL.md`,
            exact ? "FAIL" : "WARN",
            "Merge the overlapping skills, keeping the union of their scenarios.",
            `Trigger domain overlaps with skills/${withDesc[j].rel}SKILL.md.`,
          ),
        );
      }
    }
  }

  // --- repeated-guidance: identical headings repeated across skills.
  const headingMap = new Map();
  for (const s of skills) {
    if (!s.text) continue;
    for (const line of s.text.split(/\r?\n/)) {
      const m = /^##\s+(.+)$/.exec(line);
      if (m) {
        const key = m[1].trim().toLowerCase();
        if (SKELETON_HEADINGS.has(key)) continue;
        if (!headingMap.has(key)) headingMap.set(key, []);
        headingMap.get(key).push(`skills/${s.rel}SKILL.md`);
      }
    }
  }
  for (const [heading, files] of headingMap) {
    const uniq = [...new Set(files)];
    if (uniq.length >= 3) {
      findings.push(
        makeFinding("repeated-guidance", uniq[0], "WARN", `Extract the shared "${heading}" guidance into references/.`, `Heading repeated in ${uniq.length} skills.`),
      );
    }
  }

  // --- nested-skill-tree: skill nesting deeper than the allowed depth.
  for (const s of skills) {
    if (s.depth > MAX_SKILL_NESTING) {
      findings.push(
        makeFinding("nested-skill-tree", `skills/${s.rel}`, "WARN", "Flatten nested skill directories into a flat namespace.", `Skill nests at depth ${s.depth} (max ${MAX_SKILL_NESTING}).`),
      );
    }
  }

  // --- lifecycle-status: check skill frontmatter for lifecycle metadata.
  for (const s of skills) {
    if (!s.text) continue;
    const rel = `skills/${s.rel}SKILL.md`;
    const hasLifecycleStatus = /lifecycle:\s*\n\s+status:\s+(active|deprecated|retired)/.test(s.text);
    if (!hasLifecycleStatus) {
      findings.push(
        makeFinding("lifecycle-status", rel, "WARN", "Add lifecycle metadata (status/version/created/updated) to the skill frontmatter.", "Skill is missing lifecycle metadata."),
      );
    } else {
      const statusMatch = s.text.match(/lifecycle:\s*\n\s+status:\s+(active|deprecated|retired)/);
      if (statusMatch && (statusMatch[1] === "deprecated" || statusMatch[1] === "retired")) {
        findings.push(
          makeFinding("lifecycle-status", rel, "INFO", `Skill is ${statusMatch[1]}. Consider removing or replacing it.`, "Deprecated/retired skills should be cleaned up."),
        );
      }
    }
  }

  // --- harness-gap: advertised harness without a discoverable skill path.
  const harnesses = await collectHarnesses(root);
  if (harnesses.includes("opencode")) {
    const oc = [".opencode/skills", ".agents/skills", ".claude/skills"].some(async (p) => {
      try {
        await stat(join(root, p));
        return true;
      } catch {
        return false;
      }
    });
    if (!(await oc)) {
      findings.push(
        makeFinding("harness-gap", ".opencode/skills", "WARN", "Port skills into .opencode/skills/ (or .agents/skills/).", "opencode is advertised but no skill discovery path exists."),
      );
    }
  }

  // --- codex harness-gap: advertised but no .codex-plugin directory.
  if (harnesses.includes("codex")) {
    try {
      await stat(join(root, ".codex-plugin"));
    } catch {
      findings.push(
        makeFinding("harness-gap", ".codex-plugin", "WARN", "Add .codex-plugin/ for codex harness support.", "codex is advertised but no codex plugin directory exists."),
      );
    }
  }

  // --- zombie-skill: no trigger description, references, or tests.
  for (const s of skills) {
    if (!s.text) continue;
    const rel = `skills/${s.rel}SKILL.md`;
    const fm = parseFrontmatter(s.text);
    const hasTrigger = fm?.description?.startsWith("Use when");
    const dir = join(root, "skills", s.rel.replace(/\/$/, ""));
    const hasSupport = await dirHasSupport(dir);
    if (!hasTrigger && !hasSupport) {
      findings.push(
        makeFinding("zombie-skill", rel, "WARN", "Retire the skill or evolve it with a trigger description and tests.", "The skill has no trigger description and no support files."),
      );
    }
  }

  // --- name-collision: duplicate skill names across sources.
  const seenNames = new Map();
  for (const s of skills) {
    if (!seenNames.has(s.dirName)) seenNames.set(s.dirName, []);
    seenNames.get(s.dirName).push(`skills/${s.rel}`);
  }
  for (const [name, locs] of seenNames) {
    if (locs.length > 1) {
      findings.push(
        makeFinding("name-collision", locs[0], "FAIL", "Rename one skill and add a project prefix.", `Duplicate skill name "${name}" in ${locs.length} locations.`),
      );
    }
  }

  // --- version-drift: root plugin version vs skill versions.
  const versions = new Set();
  const versionSources = [];
  let pkg = null;
  try {
    pkg = await readJson(join(root, "package.json"));
    if (pkg.version) {
      versions.add(pkg.version);
      versionSources.push(`package.json:${pkg.version}`);
    }
  } catch {
    /* no package.json */
  }
  try {
    const claude = await readJson(join(root, ".claude-plugin", "plugin.json"));
    if (claude.version) {
      versions.add(claude.version);
      versionSources.push(`plugin.json:${claude.version}`);
    }
  } catch {
    /* no claude manifest */
  }
  for (const s of skills) {
    if (!s.text) continue;
    const fm = parseFrontmatter(s.text);
    const meta = fm?.metadata;
    if (typeof meta === "string") {
      // metadata written as a single-line YAML value: "metadata: { version: 0.1.0 }"
      const v = /version\s*:\s*([0-9][^\s,}]*)/.exec(meta);
      if (v) {
        versions.add(v[1]);
        versionSources.push(`skills/${s.dirName}:${v[1]}`);
      }
    } else if (meta && typeof meta === "object" && meta.version) {
      versions.add(String(meta.version));
      versionSources.push(`skills/${s.dirName}:${meta.version}`);
    }
  }
  if (versions.size > 1) {
    findings.push(
      makeFinding("version-drift", "package.json", "WARN", "Align all declared versions to a single source of truth.", `Declared versions differ: ${[...versionSources].join(", ")}.`),
    );
  }

  // --- adr-status: ADR numbering continuity and status-field hygiene.
  // Absence of docs/ADR-*.md is fine (only significant decisions get ADRs);
  // present ADRs must form a readable, immutable decision chain.
  let adrFiles = [];
  try {
    adrFiles = (await readdir(join(root, "docs"))).filter((f) => /^ADR-\d{4}-.+\.md$/.test(f));
  } catch {
    /* no docs directory — no ADRs to check */
  }
  if (adrFiles.length > 0) {
    const numbers = adrFiles.map((f) => Number(/^ADR-(\d{4})-/.exec(f)?.[1] ?? NaN));
    const seen = new Map();
    for (const f of adrFiles) {
      const n = Number(/^ADR-(\d{4})-/.exec(f)?.[1] ?? NaN);
      if (Number.isNaN(n)) continue;
      if (!seen.has(n)) seen.set(n, []);
      seen.get(n).push(f);
    }
    for (const [n, files] of seen) {
      if (files.length > 1) {
        findings.push(
          makeFinding("adr-status", files.join(", "), "WARN", `Renumber ADR-${String(n).padStart(4, "0")} — one number per decision.`, "Duplicate ADR numbers break the decision log."),
        );
      }
    }
    const sorted = [...numbers].filter((n) => !Number.isNaN(n)).sort((a, b) => a - b);
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] - sorted[i - 1] > 1) {
        findings.push(
          makeFinding("adr-status", "docs/", "INFO", `ADR sequence jumps from ${sorted[i - 1]} to ${sorted[i]} — add the missing record.`, "A gap suggests a missing decision record."),
        );
      }
    }
    const STATUS_RE = /^(Proposed|Accepted|Superseded|Deprecated)/;
    for (const f of adrFiles) {
      const text = await readFile(join(root, "docs", f), "utf8");
      const statusLine = text.split(/\r?\n/).find((l) => /^\s*-\s*\*\*状态\*\*/.test(l));
      if (!statusLine) {
        findings.push(
          makeFinding("adr-status", `docs/${f}`, "WARN", "Add a '**状态**: Accepted' status field.", "An ADR without a status cannot be read as a decision chain."),
        );
        continue;
      }
      const status = (statusLine.match(/\*\*状态\*\*:\s*(.+)/)?.[1] ?? "").trim();
      if (!STATUS_RE.test(status)) {
        findings.push(
          makeFinding("adr-status", `docs/${f}`, "WARN", `Use one of Proposed/Accepted/Superseded/Deprecated (found "${status}").`, "Unknown ADR status."),
        );
      } else if (status.startsWith("Superseded")) {
        const selfNum = /^ADR-(\d{4})/.exec(f)?.[1];
        const hasLink = [...text.matchAll(/ADR-(\d{4})/g)].some((m) => m[1] !== selfNum);
        if (!hasLink) {
          findings.push(
            makeFinding("adr-status", `docs/${f}`, "WARN", "Link the superseding ADR (e.g. 'Superseded by ADR-0003').", "A superseded ADR without a link breaks the chain."),
          );
        }
      }
    }
  }

  // --- spec-trace: handoff schema contract integrity (spec-anchored, Iron Law 6).
  // Every schema must parse, and every handoff schema needs positive + negative
  // contract fixtures; absence of schemas/ is fine (generated plugins don't ship one).
  let schemaFiles = [];
  try {
    schemaFiles = (await readdir(join(root, "schemas"))).filter((f) => f.endsWith(".schema.json"));
  } catch {
    /* no schemas directory — no contract to trace */
  }
  if (schemaFiles.length > 0) {
    for (const f of schemaFiles) {
      try {
        await readJson(join(root, "schemas", f));
      } catch {
        findings.push(
          makeFinding("spec-trace", `schemas/${f}`, "WARN", `Fix JSON syntax in schemas/${f}.`, "An unparsable schema cannot act as a contract."),
        );
      }
    }
    for (const sub of ["verify-valid", "verify-invalid"]) {
      try {
        await stat(join(root, "tests", "fixtures", sub));
      } catch {
        findings.push(
          makeFinding("spec-trace", `tests/fixtures/${sub}`, "WARN", `Create tests/fixtures/${sub}/ with contract examples.`, "A schema without positive/negative fixtures is unverified (spec-anchored)."),
        );
      }
    }
  }

  // --- pipeline-consistency: validate pipeline-state.json integrity.
  // Absence is fine (pre-v1 plugins don't have it); presence requires valid schema.
  try {
    const ps = await import("./pipeline-state.mjs");
    const pipelineState = await ps.readState(root);
    if (pipelineState !== null) {
      const migration = ps.migrateState(pipelineState);
      const validation = ps.validateState(migration);
      if (!validation.valid) {
        findings.push(
          makeFinding(
            "pipeline-consistency",
            "pipeline-state.json",
            "WARN",
            `Fix pipeline state: ${validation.errors.join("; ")}`,
            "Interrupted development state cannot be resumed reliably.",
            true,
          ),
        );
      }
    }
  } catch {
    /* pipeline-state.mjs not available or read error — skip */
  }
}

/* ------------------------------------------------------------------ */
/* Coverage check (VFY-2) — opt-in, configurable severity              */
/* ------------------------------------------------------------------ */

/**
 * Test coverage check. Every `active` skill must have at least one matching
 * test: a `tests/<name>/` directory with test files, or a test referenced in
 * the skill's `metadata.tests` field. `deprecated`/`retired` skills are
 * exempt. Severity is configurable: WARN (advisory) or FAIL (blocking,
 * `--coverage=FAIL`). Opt-in — the probe runs only when `--coverage` is passed.
 * @param {string} root
 * @param {object[]} findings
 * @param {"WARN"|"FAIL"} mode - severity for uncovered active skills.
 */
async function coverageChecks(root, findings, mode) {
  const skills = await collectSkills(root);
  for (const s of skills) {
    if (!s.text) continue;
    const rel = `skills/${s.rel}SKILL.md`;
    const statusMatch = s.text.match(/lifecycle:\s*\n\s+status:\s+(active|deprecated|retired)/);
    if (!statusMatch || statusMatch[1] !== "active") continue; // only active skills are covered
    if (await skillHasTest(root, s.dirName, s.text)) continue;
    findings.push(
      makeFinding(
        "test-coverage",
        rel,
        mode,
        `Add a test under tests/${s.dirName}/ or reference one via the skill's metadata.tests field.`,
        "Active skills require test coverage; escalate with --coverage=FAIL to make it blocking.",
      ),
    );
  }
}

/** Does the skill have a matching test (tests/<name>/ dir or metadata.tests)? */
async function skillHasTest(root, dirName, text) {
  try {
    const entries = await readdir(join(root, "tests", dirName));
    if (entries.length > 0) return true;
  } catch {
    /* no tests/<name>/ dir */
  }
  return /^\s+tests:\s*\[/m.test(text); // frontmatter metadata.tests list
}

/** Does any project file claim a using-<plugin> entry path? */
async function declaresEntryPath(root) {
  const candidates = ["README.md", "AGENTS.md", "CLAUDE.md", "package.json"];
  let text = "";
  for (const c of candidates) {
    try {
      text += "\n" + (await readFile(join(root, c), "utf8"));
    } catch {
      /* skip missing */
    }
  }
  return /using-[a-z0-9-]+/.test(text);
}

/** Root index text (README/AGENTS/CLAUDE) used for orphan detection. */
async function rootIndexText(root) {
  let text = "";
  for (const c of ["README.md", "AGENTS.md", "CLAUDE.md"]) {
    try {
      text += "\n" + (await readFile(join(root, c), "utf8"));
    } catch {
      /* skip missing */
    }
  }
  return text;
}

/** Collect skill references from handoff/route patterns in a skill body. */
export function collectSkillRefs(text) {
  const refs = new Set();
  const patterns = [
    /(?:route to|route via|handoff to|next skill|follow(?:ing)? skill)\s+[`'"]?([a-z0-9]+(?:-[a-z0-9]+)*)/g,
    /(?:next|handoff)\s*:\s*([a-z0-9]+(?:-[a-z0-9]+)*)/g,
  ];
  const stopwords = new Set([
    "the", "a", "an", "and", "or", "of", "to", "in", "on", "for", "with",
    "right", "x", "each", "any", "all", "this", "that", "next", "skill",
  ]);
  for (const re of patterns) {
    for (const m of text.matchAll(re)) {
      const ref = m[1];
      if (ref.length < 2) continue;
      if (stopwords.has(ref.toLowerCase())) continue;
      refs.add(ref);
    }
  }
  return [...refs];
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Does the skill directory contain support files (references/tests/assets)? */
async function dirHasSupport(dir) {
  try {
    const entries = await readdir(dir);
    return entries.some((e) => e !== "SKILL.md");
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------ */
/* Public entry point                                                 */
/* ------------------------------------------------------------------ */

/**
 * Run the requested layers against `root`.
 * @param {string} root
 * @param {{layers?: string[], coverage?: "WARN"|"FAIL"}} [opts]
 *   When `coverage` is set, additionally run the test-coverage probe at that
 *   severity (WARN advisory, FAIL blocking).
 * @returns {Promise<{root: string, findings: object[]}>}
 */
export async function runChecks(root, { layers = ["structure", "harness", "orchestration"], coverage } = {}) {
  const findings = [];
  if (layers.includes("structure")) await structureChecks(root, findings);
  if (layers.includes("harness")) await harnessChecks(root, findings);
  if (layers.includes("orchestration")) await orchestrationChecks(root, findings);
  if (coverage) await coverageChecks(root, findings, coverage);
  return { root, findings: sortFindings(findings) };
}

function parseArgs(argv) {
  const args = { root: process.cwd(), format: "table", layers: null, coverage: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--root") args.root = argv[++i];
    else if (a === "--format") args.format = argv[++i];
    else if (a === "--coverage" || a.startsWith("--coverage=")) {
      const v = (a.includes("=") ? a.split("=")[1] : argv[++i] || "WARN").toUpperCase();
      if (v !== "WARN" && v !== "FAIL") {
        console.error(`verify: invalid --coverage value "${v}" (expected WARN or FAIL)`);
        process.exit(2);
      }
      args.coverage = v;
    } else if (a === "structure") args.layers = ["structure"];
    else if (a === "harness") args.layers = ["harness"];
    else if (a === "lifecycle") args.layers = ["orchestration"];
    else if (a === "all") args.layers = ["structure", "harness", "orchestration"];
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  let result;
  try {
    result = await runChecks(args.root, {
      layers: args.layers ?? undefined,
      coverage: args.coverage ?? undefined,
    });
  } catch (err) {
    console.error(`verify: failed to run checks: ${err.message}`);
    process.exit(2);
  }
  if (args.format === "json") {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(renderTable(result.findings));
    if (result.findings.length === 0) console.log("No findings.");
  }
  const hasFail = result.findings.some((f) => f.severity === "FAIL");
  process.exit(hasFail ? 1 : 0);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
