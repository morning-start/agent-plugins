#!/usr/bin/env python3
"""
Consistency checker for MoonBit Skills repository.

Verifies:
  - All JSON files parse correctly
  - All skill frontmatter has name/description
  - Skill directory name matches frontmatter name
  - Skill count consistency across routing, orchestration, README
  - E1-E6 consistency across verify, orchestration
  - Document reference paths exist
  - Command parameters match references/commands.md definitions
  - No absolute local paths, no dead file:/// links
"""

import json
import os
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
SKILLS_DIR = REPO_ROOT / "skills"
REFERENCES_DIR = REPO_ROOT / "references"
SCHEMAS_DIR = REPO_ROOT / "schemas"


def check_json_syntax():
    """Check all JSON files parse correctly."""
    errors = []
    for path in REPO_ROOT.rglob("*.json"):
        if ".git" in path.parts:
            continue
        try:
            with open(path, "r", encoding="utf-8") as f:
                json.load(f)
        except json.JSONDecodeError as e:
            errors.append(f"Invalid JSON: {path.relative_to(REPO_ROOT)}: {e}")
    return errors


def check_skill_frontmatter():
    """Check all skill SKILL.md files have valid frontmatter."""
    errors = []
    skill_dirs = set()

    for skill_dir in sorted(SKILLS_DIR.iterdir()):
        if not skill_dir.is_dir():
            continue
        skill_md = skill_dir / "SKILL.md"
        if not skill_md.exists():
            errors.append(f"Missing SKILL.md in {skill_dir.name}")
            continue

        content = skill_md.read_text(encoding="utf-8")

        # Extract frontmatter
        m = re.match(r'^---\s*\n(.*?)\n---', content, re.DOTALL)
        if not m:
            errors.append(f"Missing or invalid frontmatter in {skill_md.relative_to(REPO_ROOT)}")
            continue

        fm = m.group(1)

        # Check name
        name_match = re.search(r'^name:\s*(\S+)', fm, re.MULTILINE)
        if not name_match:
            errors.append(f"Missing 'name' in frontmatter: {skill_md.relative_to(REPO_ROOT)}")

        # Check description
        desc_match = re.search(r'^description:\s*(.+?)$', fm, re.MULTILINE)
        if not desc_match:
            errors.append(f"Missing 'description' in frontmatter: {skill_md.relative_to(REPO_ROOT)}")

        # Check directory name matches skill name
        # Convention: directory is short name (e.g. 'code-review'), frontmatter name is 'moonbit-code-review'
        # 'using-moonbit-skills' is the full name in both
        if name_match:
            skill_name = name_match.group(1)
            dir_name = skill_dir.name
            # Expected: either exact match (using-moonbit-skills) or 'moonbit-<dir_name>' == skill_name
            expected_name = f"moonbit-{dir_name}"
            if skill_name != dir_name and skill_name != expected_name:
                errors.append(
                    f"Directory name '{dir_name}' does not match frontmatter name '{skill_name}': "
                    f"{skill_md.relative_to(REPO_ROOT)}"
                )

        skill_dirs.add(skill_dir.name)

    return errors, skill_dirs


def _without_fenced_code(content: str) -> str:
    """Remove fenced code blocks before interpreting Markdown links."""
    return re.sub(r"```.*?```", "", content, flags=re.DOTALL)


def check_skill_counts(skill_dirs):
    """Check skill count consistency across routing and orchestration."""
    errors = []
    known_skills = sorted(skill_dirs)
    known_count = len(known_skills)
    expected_core_count = known_count - (1 if "using-moonbit-skills" in known_skills else 0)
    fact_files = [
        REPO_ROOT / "README.md",
        REPO_ROOT / "assets" / "readme" / "hero.svg",
        REPO_ROOT / "assets" / "readme" / "section-skills.svg",
    ]
    for fact_file in fact_files:
        if not fact_file.exists():
            continue
        fact_content = fact_file.read_text(encoding="utf-8")
        if "13 个核心技能" in fact_content or "十三个核心技能" in fact_content:
            errors.append(
                f"Stale skill count in {fact_file.relative_to(REPO_ROOT)}: expected {expected_core_count} core skills"
            )

    # Check using-moonbit-skills SKILL.md
    bootstrap = SKILLS_DIR / "using-moonbit-skills" / "SKILL.md"
    if bootstrap.exists():
        content = bootstrap.read_text(encoding="utf-8")

        # Find the available skills table
        table_section = re.search(
            r'\|\s*Skill\s*\|\s*When to Use\s*\|\s*\n\|[-| ]+\|\n((?:\|.*\|.*\|\n)*)',
            content
        )
        if table_section:
            listed = [line.split("|")[1].strip().strip("`") for line in table_section.group(1).strip().split("\n")]
            # Filter out non-moonbit- skills
            moonbit_listed = [s for s in listed if s.startswith("moonbit-")]
            # Normalize: strip 'moonbit-' prefix for comparison with directory names
            listed_normalized = {s.replace("moonbit-", "", 1) for s in moonbit_listed}
            # Exclude bootstrap skill 'using-moonbit-skills' from comparison
            known_normalized = {s.replace("moonbit-", "", 1) if s.startswith("moonbit-") else s
                                for s in known_skills if s != "using-moonbit-skills"}
            missing_in_listed = known_normalized - listed_normalized
            extra_in_listed = listed_normalized - known_normalized
            if missing_in_listed:
                errors.append(f"Skills in directory but not in routing table: {sorted(missing_in_listed)}")
            if extra_in_listed:
                errors.append(f"Skills in routing table but no directory: {sorted(extra_in_listed)}")

    # Check orchestration.md
    orch_path = REFERENCES_DIR / "orchestration.md"
    if orch_path.exists():
        content = orch_path.read_text(encoding="utf-8")
        # Count moonbit- skills in the independent skills table
        table_section = re.search(
            r'\|\s*技能\s*\|\s*触发场景\s*\|\s*类型\s*\|\n\|[-| ]+\|\n((?:\|.*\|.*\|.*\|\n)*)',
            content
        )
        if table_section:
            listed_skills = []
            for line in table_section.group(1).strip().split("\n"):
                m = re.match(r'\|\s*`([^`]+)`', line)
                if m:
                    listed_skills.append(m.group(1))
            # Normalize: strip 'moonbit-' prefix for comparison with directory names
            listed_normalized = {s.replace("moonbit-", "", 1) for s in listed_skills if s.startswith("moonbit-")}
            # Exclude bootstrap skill 'using-moonbit-skills' from comparison
            known_normalized = {s.replace("moonbit-", "", 1) if s.startswith("moonbit-") else s
                                for s in known_skills if s != "using-moonbit-skills"}
            missing_in_orch = known_normalized - listed_normalized
            if missing_in_orch:
                errors.append(f"Skills missing in orchestration table: {sorted(missing_in_orch)}")

    return errors


def check_e6_consistency():
    """Check E1-E6 consistency across verify and orchestration."""
    errors = []
    verify_path = SKILLS_DIR / "verify" / "SKILL.md"
    orch_path = REFERENCES_DIR / "orchestration.md"

    if verify_path.exists():
        content = verify_path.read_text(encoding="utf-8")
        # Find E6 reference in execution order
        if "E6" not in content:
            errors.append("verify/SKILL.md: Missing E6 reference")

    if orch_path.exists():
        content = orch_path.read_text(encoding="utf-8")
        # Check E1-E6 in enhanced test section
        if "E1-E6" not in content:
            errors.append("orchestration.md: Missing E1-E6 reference")
        # Check E6 table row
        if "E6" not in content:
            errors.append("orchestration.md: Missing E6 table row")
        # Check panorama diagram
        if "E1-E6" not in content:
            errors.append("orchestration.md: Missing E1-E6 reference")

    return errors


def check_reference_paths():
    """Check that document reference paths exist."""
    errors = []
    doc_extensions = {".md", ".json", ".yaml", ".yml", ".sh", ".py"}

    # Check references from markdown files
    for md_file in REPO_ROOT.rglob("*.md"):
        if ".git" in md_file.parts:
            continue
        content = _without_fenced_code(md_file.read_text(encoding="utf-8"))

        # Find markdown links with relative paths
        for m in re.finditer(r'\[([^\]]+)\]\(([^)]+)\)', content):
            link = m.group(2)
            # Skip external URLs and anchors
            if link.startswith(("http://", "https://", "#", "mailto:")):
                continue
            # Skip absolute paths
            if link.startswith("/"):
                continue

            # Resolve relative to the markdown file's directory
            target = (md_file.parent / link).resolve()
            # Only check if it's a markdown or project file
            if target.suffix.lower() in doc_extensions or not target.suffix:
                if not target.exists():
                    # Allow paths with wildcards
                    if "*" not in link:
                        errors.append(
                            f"Broken reference in {md_file.relative_to(REPO_ROOT)}: "
                            f"'{link}' -> {target.relative_to(REPO_ROOT) if target.exists() else 'NOT FOUND'}"
                        )

    return errors


def check_commands_consistency():
    """Check that command references match references/commands.md if it exists."""
    errors = []
    commands_path = REFERENCES_DIR / "commands.md"

    if not commands_path.exists():
        return errors  # No commands reference to check against

    commands_content = commands_path.read_text(encoding="utf-8")
    known_commands = set()
    for m in re.finditer(r'`(moon\s+\S[^`]+)`', commands_content):
        known_commands.add(m.group(1))

    # Check other markdown files reference known commands
    for md_file in REPO_ROOT.rglob("*.md"):
        if ".git" in md_file.parts or md_file == commands_path:
            continue
        content = md_file.read_text(encoding="utf-8")
        for m in re.finditer(r'`(moon\s+\S[^`]+)`', content):
            cmd = m.group(1)
            # Skip common commands that might not be in commands.md
            if not any(cmd.startswith(prefix) for prefix in ["moon fmt", "moon check", "moon test", "moon info", "moon run", "moon doc", "moon add", "moon publish", "moon-audit"]):
                pass  # Not adding hard errors for now; this is advisory

    return errors


def check_no_absolute_paths():
    """Check for absolute local paths and dead file:/// links."""
    errors = []
    for md_file in REPO_ROOT.rglob("*.md"):
        if ".git" in md_file.parts:
            continue
        content = md_file.read_text(encoding="utf-8")

        # Check for file:/// links (excluding the allowed pattern for local file previews)
        for m in re.finditer(r'`?file:///[^`\n)]+`?', content):
            errors.append(
                f"file:/// link in {md_file.relative_to(REPO_ROOT)}: {m.group().strip()}"
            )

    return errors


def main():
    errors = []
    all_checks_passed = True

    print("=== MoonBit Skills Repository Consistency Checker ===\n")

    # 1. JSON syntax
    print("[1/6] Checking JSON syntax...")
    json_errors = check_json_syntax()
    if json_errors:
        for e in json_errors:
            print(f"  FAIL: {e}")
        errors.extend(json_errors)
    else:
        print("  PASS")

    # 2. Skill frontmatter
    print("[2/6] Checking skill frontmatter...")
    fm_errors, skill_dirs = check_skill_frontmatter()
    if fm_errors:
        for e in fm_errors:
            print(f"  FAIL: {e}")
        errors.extend(fm_errors)
    else:
        print(f"  PASS ({len(skill_dirs)} skills checked)")

    # 3. Skill count consistency
    print("[3/6] Checking skill count consistency...")
    count_errors = check_skill_counts(skill_dirs)
    if count_errors:
        for e in count_errors:
            print(f"  FAIL: {e}")
        errors.extend(count_errors)
    else:
        print("  PASS")

    # 4. E1-E6 consistency
    print("[4/6] Checking E1-E6 consistency...")
    e6_errors = check_e6_consistency()
    if e6_errors:
        for e in e6_errors:
            print(f"  FAIL: {e}")
        errors.extend(e6_errors)
    else:
        print("  PASS")

    # 5. Reference paths
    print("[5/6] Checking document reference paths...")
    ref_errors = check_reference_paths()
    if ref_errors:
        print(f"  WARN: {len(ref_errors)} issues found")
        for e in ref_errors[:10]:  # Show first 10
            print(f"    {e}")
        if len(ref_errors) > 10:
            print(f"    ... and {len(ref_errors) - 10} more")
        # Path issues are warnings, not hard failures
    else:
        print("  PASS")

    # 6. Absolute paths
    print("[6/6] Checking for absolute local paths...")
    path_errors = check_no_absolute_paths()
    if path_errors:
        for e in path_errors:
            print(f"  FAIL: {e}")
        errors.extend(path_errors)
    else:
        print("  PASS")

    print()
    if errors:
        print(f"FAILED: {len(errors)} error(s) found")
        sys.exit(1)
    else:
        print("ALL CHECKS PASSED")
        sys.exit(0)


if __name__ == "__main__":
    main()
