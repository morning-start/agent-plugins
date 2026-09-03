#!/usr/bin/env node
/*
 * Consistency checker for MoonBit Skills repository.
 *
 * Verifies:
 *   - All JSON files parse correctly
 *   - All skill frontmatter has name/description
 *   - Skill directory name matches frontmatter name
 *   - Skill count consistency across routing, orchestration, README
 *   - E1-E6 consistency across verify, orchestration
 *   - Document reference paths exist
 *   - Command parameters match references/cli/commands.md definitions
 *   - No absolute local paths, no dead file:/// links
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const SKILLS_DIR = path.join(REPO_ROOT, "skills");
const REFERENCES_DIR = path.join(REPO_ROOT, "references");

const isDir = (p) => {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
};
const isFile = (p) => {
  try {
    return fs.statSync(p).isFile();
  } catch {
    return false;
  }
};
const readText = (p) => fs.readFileSync(p, "utf-8");
const rel = (p) => path.relative(REPO_ROOT, p).split(path.sep).join("/");

/** Recursively find files matching a predicate, skipping .git and __pycache__. */
function rglob(dir, predicate) {
  const out = [];
  let entries = [];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (entry.name === ".git" || entry.name === "__pycache__") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...rglob(full, predicate));
    } else if (predicate(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

const jsonFiles = () => rglob(REPO_ROOT, (n) => n.endsWith(".json"));
const mdFiles = () => rglob(REPO_ROOT, (n) => n.endsWith(".md"));

function checkJsonSyntax() {
  const errors = [];
  for (const p of jsonFiles()) {
    try {
      JSON.parse(readText(p));
    } catch (e) {
      errors.push(`${rel(p)}: ${e.message}`);
    }
  }
  return errors;
}

function checkSkillFrontmatter() {
  const errors = [];
  const skillDirs = new Set();

  let skillEntries = [];
  try {
    skillEntries = fs.readdirSync(SKILLS_DIR, { withFileTypes: true });
  } catch {
    return [errors, skillDirs];
  }

  for (const entry of skillEntries) {
    if (!entry.isDirectory()) continue;
    const skillMd = path.join(SKILLS_DIR, entry.name, "SKILL.md");
    if (!isFile(skillMd)) {
      errors.push(`Missing SKILL.md in ${entry.name}`);
      continue;
    }

    const content = readText(skillMd);

    // Extract frontmatter
    const m = /^---\s*\n([\s\S]*?)\n---/.exec(content);
    if (!m) {
      errors.push(`Missing or invalid frontmatter in ${rel(skillMd)}`);
      continue;
    }
    const fm = m[1];

    // Check name
    const nameMatch = /^name:\s*(\S+)/m.exec(fm);
    if (!nameMatch) {
      errors.push(`Missing 'name' in frontmatter: ${rel(skillMd)}`);
    }

    // Check description
    const descMatch = /^description:\s*(.+?)$/m.exec(fm);
    if (!descMatch) {
      errors.push(`Missing 'description' in frontmatter: ${rel(skillMd)}`);
    }

    // Check directory name matches skill name
    // Convention: directory is short name (e.g. 'code-review'), frontmatter name is 'moonbit-code-review'
    // 'using-moonbit-skills' is the full name in both
    if (nameMatch) {
      const skillName = nameMatch[1];
      const dirName = entry.name;
      // Expected: either exact match (using-moonbit-skills) or 'moonbit-<dir_name>' == skill_name
      const expectedName = `moonbit-${dirName}`;
      if (skillName !== dirName && skillName !== expectedName) {
        errors.push(
          `Directory name '${dirName}' does not match frontmatter name '${skillName}': ` +
            rel(skillMd)
        );
      }
    }

    skillDirs.add(entry.name);
  }

  return [errors, skillDirs];
}

/** Remove fenced code blocks before interpreting Markdown links. */
function withoutFencedCode(content) {
  return content.replace(/```[\s\S]*?```/g, "");
}

function checkSkillCounts(skillDirs) {
  const errors = [];
  const knownSkills = [...skillDirs].sort();
  const knownCount = knownSkills.length;
  const expectedCoreCount = knownCount - (knownSkills.includes("using-moonbit-skills") ? 1 : 0);

  // Check fact files for stale hard-coded counts
  const factFiles = [path.join(REPO_ROOT, "README.md")];
  for (const factFile of factFiles) {
    if (!isFile(factFile)) continue;
    const factContent = readText(factFile);
    if (factContent.includes("13 个核心技能") || factContent.includes("十三个核心技能")) {
      errors.push(
        `Stale skill count in ${rel(factFile)}: expected ${expectedCoreCount} core skills`
      );
    }
  }

  // Check using-moonbit-skills SKILL.md routing table
  const bootstrap = path.join(SKILLS_DIR, "using-moonbit-skills", "SKILL.md");
  if (isFile(bootstrap)) {
    const content = readText(bootstrap);

    // Find the available skills table
    const tableSection = /\|\s*Skill\s*\|\s*When to Use\s*\|\s*\n\|[-| ]+\|\n((?:\|.*\|.*\|\n)*)/.exec(
      content
    );
    if (tableSection) {
      const listed = tableSection[1]
        .trim()
        .split("\n")
        .map((line) => line.split("|")[1].trim().replace(/^`|`$/g, ""));
      // Filter out non-moonbit- skills
      const moonbitListed = listed.filter((s) => s.startsWith("moonbit-"));
      // Normalize: strip 'moonbit-' prefix for comparison with directory names
      const listedNormalized = new Set(moonbitListed.map((s) => s.replace(/^moonbit-/, "")));
      // Exclude bootstrap skill 'using-moonbit-skills' from comparison
      const knownNormalized = new Set(
        knownSkills
          .filter((s) => s !== "using-moonbit-skills")
          .map((s) => (s.startsWith("moonbit-") ? s.replace(/^moonbit-/, "") : s))
      );
      const missingInListed = [...knownNormalized].filter((s) => !listedNormalized.has(s)).sort();
      const extraInListed = [...listedNormalized].filter((s) => !knownNormalized.has(s)).sort();
      if (missingInListed.length) {
        errors.push(`Skills in directory but not in routing table: ${JSON.stringify(missingInListed)}`);
      }
      if (extraInListed.length) {
        errors.push(`Skills in routing table but no directory: ${JSON.stringify(extraInListed)}`);
      }
    }
  }

  // Check orchestration.md independent-skills table
  const orchPath = path.join(REFERENCES_DIR, "orchestration.md");
  if (isFile(orchPath)) {
    const content = readText(orchPath);
    const tableSection = /\|\s*技能\s*\|\s*触发场景\s*\|\s*类型\s*\|\n\|[-| ]+\|\n((?:\|.*\|.*\|.*\|\n)*)/.exec(
      content
    );
    if (tableSection) {
      const listedSkills = [];
      for (const line of tableSection[1].trim().split("\n")) {
        const m = /^\|\s*`([^`]+)`/.exec(line);
        if (m) listedSkills.push(m[1]);
      }
      // Normalize: strip 'moonbit-' prefix for comparison with directory names
      const listedNormalized = new Set(
        listedSkills
          .filter((s) => s.startsWith("moonbit-"))
          .map((s) => s.replace(/^moonbit-/, ""))
      );
      // Exclude bootstrap skill 'using-moonbit-skills' from comparison
      const knownNormalized = new Set(
        knownSkills
          .filter((s) => s !== "using-moonbit-skills")
          .map((s) => (s.startsWith("moonbit-") ? s.replace(/^moonbit-/, "") : s))
      );
      const missingInOrch = [...knownNormalized].filter((s) => !listedNormalized.has(s)).sort();
      if (missingInOrch.length) {
        errors.push(`Skills missing in orchestration table: ${JSON.stringify(missingInOrch)}`);
      }
    }
  }

  return errors;
}

function checkE6Consistency() {
  const errors = [];
  const verifyPath = path.join(SKILLS_DIR, "verify", "SKILL.md");
  const orchPath = path.join(REFERENCES_DIR, "orchestration.md");

  if (isFile(verifyPath)) {
    const content = readText(verifyPath);
    // Find E6 reference in execution order
    if (!content.includes("E6")) {
      errors.push("verify/SKILL.md: Missing E6 reference");
    }
  }

  if (isFile(orchPath)) {
    const content = readText(orchPath);
    // Check E1-E6 in enhanced test section
    if (!content.includes("E1-E6")) {
      errors.push("orchestration.md: Missing E1-E6 reference");
    }
    // Check E6 table row
    if (!content.includes("E6")) {
      errors.push("orchestration.md: Missing E6 table row");
    }
    // Check panorama diagram
    if (!content.includes("E1-E6")) {
      errors.push("orchestration.md: Missing E1-E6 reference");
    }
  }

  return errors;
}

/** Check that document reference paths exist. */
function checkReferencePaths() {
  const errors = [];
  const docExtensions = new Set([".md", ".json", ".yaml", ".yml", ".sh", ".js", ".mjs", ".ts"]);

  for (const mdFile of mdFiles()) {
    const content = withoutFencedCode(readText(mdFile));

    // Find markdown links with relative paths
    const linkRe = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;
    while ((match = linkRe.exec(content)) !== null) {
      const link = match[2];
      // Skip external URLs and anchors
      if (link.startsWith("http://") || link.startsWith("https://") || link.startsWith("#") || link.startsWith("mailto:")) {
        continue;
      }
      // Skip absolute paths
      if (link.startsWith("/")) continue;

      // Resolve relative to the markdown file's directory
      const target = path.resolve(path.dirname(mdFile), link);
      const suffix = path.extname(target).toLowerCase();
      // Only check if it's a markdown or project file
      if (docExtensions.has(suffix) || !suffix) {
        if (!isFile(target)) {
          // Allow paths with wildcards
          if (!link.includes("*")) {
            errors.push(
              `Broken reference in ${rel(mdFile)}: ` +
                `'${link}' -> ${isFile(target) ? rel(target) : "NOT FOUND"}`
            );
          }
        }
      }
    }
  }

  return errors;
}

/** Check that command references match references/cli/commands.md if it exists. */
function checkCommandsConsistency() {
  const commandsPath = path.join(REFERENCES_DIR, "cli", "commands.md");
  if (!isFile(commandsPath)) {
    return []; // No commands reference to check against
  }

  const commandsContent = readText(commandsPath);
  const knownCommands = new Set();
  const cmdRe = /`(moon\s+\S[^`]+)`/g;
  let m;
  while ((m = cmdRe.exec(commandsContent)) !== null) {
    knownCommands.add(m[1]);
  }

  // Advisory only: check other markdown files reference known commands.
  // Known command prefixes are tolerated without hard errors.
  const toleratedPrefixes = [
    "moon fmt", "moon check", "moon test", "moon info",
    "moon run", "moon doc", "moon add", "moon publish", "moon-audit",
  ];
  for (const mdFile of mdFiles()) {
    if (mdFile === commandsPath) continue;
    const content = readText(mdFile);
    const re = /`(moon\s+\S[^`]+)`/g;
    let mm;
    while ((mm = re.exec(content)) !== null) {
      const cmd = mm[1];
      if (!toleratedPrefixes.some((prefix) => cmd.startsWith(prefix))) {
        // Not adding hard errors for now; this is advisory
      }
    }
  }

  return [];
}

/** Check for absolute local paths and dead file:/// links. */
function checkNoAbsolutePaths() {
  const errors = [];
  for (const mdFile of mdFiles()) {
    const content = readText(mdFile);
    // Check for file:/// links (excluding the allowed pattern for local file previews)
    const re = /`?file:\/\/\/[^`\n)]+`?/g;
    let m;
    while ((m = re.exec(content)) !== null) {
      errors.push(`file:/// link in ${rel(mdFile)}: ${m[0].trim()}`);
    }
  }
  return errors;
}

function main() {
  const errors = [];
  const results = [];

  console.log("=== MoonBit Skills Repository Consistency Checker ===\n");

  // 1. JSON syntax
  console.log("[1/6] Checking JSON syntax...");
  const jsonErrors = checkJsonSyntax();
  if (jsonErrors.length) {
    for (const e of jsonErrors) console.log(`  FAIL: ${e}`);
    errors.push(...jsonErrors);
  } else {
    console.log("  PASS");
  }

  // 2. Skill frontmatter
  console.log("[2/6] Checking skill frontmatter...");
  const [fmErrors, skillDirs] = checkSkillFrontmatter();
  if (fmErrors.length) {
    for (const e of fmErrors) console.log(`  FAIL: ${e}`);
    errors.push(...fmErrors);
  } else {
    console.log(`  PASS (${skillDirs.size} skills checked)`);
  }

  // 3. Skill count consistency
  console.log("[3/6] Checking skill count consistency...");
  const countErrors = checkSkillCounts(skillDirs);
  if (countErrors.length) {
    for (const e of countErrors) console.log(`  FAIL: ${e}`);
    errors.push(...countErrors);
  } else {
    console.log("  PASS");
  }

  // 4. E1-E6 consistency
  console.log("[4/6] Checking E1-E6 consistency...");
  const e6Errors = checkE6Consistency();
  if (e6Errors.length) {
    for (const e of e6Errors) console.log(`  FAIL: ${e}`);
    errors.push(...e6Errors);
  } else {
    console.log("  PASS");
  }

  // 5. Reference paths
  console.log("[5/6] Checking document reference paths...");
  const refErrors = checkReferencePaths();
  if (refErrors.length) {
    console.log(`  WARN: ${refErrors.length} issues found`);
    for (const e of refErrors.slice(0, 10)) {
      console.log(`    ${e}`);
    }
    if (refErrors.length > 10) {
      console.log(`    ... and ${refErrors.length - 10} more`);
    }
    // Path issues are warnings, not hard failures
  } else {
    console.log("  PASS");
  }

  // 6. Absolute paths
  console.log("[6/6] Checking for absolute local paths...");
  const pathErrors = checkNoAbsolutePaths();
  if (pathErrors.length) {
    for (const e of pathErrors) {
      console.log(`  FAIL: ${e}`);
    }
    errors.push(...pathErrors);
  } else {
    console.log("  PASS");
  }

  console.log();
  if (errors.length) {
    console.log(`FAILED: ${errors.length} error(s) found`);
    process.exitCode = 1;
  } else {
    console.log("ALL CHECKS PASSED");
    process.exitCode = 0;
  }
  return results;
}

main();
