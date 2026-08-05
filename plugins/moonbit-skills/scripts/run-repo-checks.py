#!/usr/bin/env python3
"""
Deterministic repository quality check entry point for the MoonBit Skills repository.

This script is the SINGLE entry point for all repository-level deterministic checks.
It is used both locally and in CI (see .github/workflows/ci.yml).

Checks:
  1. JSON syntax validation (all .json files)
  2. Plugin metadata validation (via scripts/check-plugin-metadata.py)
  3. Bash shell syntax check (bash -n on all .sh files)
  4. Repository consistency checks (via scripts/check-pipeline-consistency.py)
  5. Git diff --check (whitespace/merge conflict markers)
  6. Python syntax check for all scripts under scripts/

Usage:
  python scripts/run-repo-checks.py [--verbose] [--allow-working-tree]
  python scripts/run-repo-checks.py --skip-shell  (for Windows without bash)
"""

import argparse
import json
import os
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
SCRIPTS_DIR = REPO_ROOT / "scripts"
SKILLS_DIR = REPO_ROOT / "skills"
HOOKS_DIR = REPO_ROOT / "hooks"


class CheckResult:
    """Represents the result of a single check."""
    def __init__(self, name, passed, details=None):
        self.name = name
        self.passed = passed
        self.details = details or []

    def __str__(self):
        status = "PASS" if self.passed else "FAIL"
        return f"[{status}] {self.name}"

    def to_dict(self):
        return {"name": self.name, "passed": self.passed, "details": self.details}


def check_json_syntax():
    """Check all JSON files parse correctly."""
    errors = []
    count = 0
    for json_file in REPO_ROOT.rglob("*.json"):
        if ".git" in json_file.parts:
            continue
        count += 1
        try:
            with open(json_file, "r", encoding="utf-8") as f:
                json.load(f)
        except json.JSONDecodeError as e:
            errors.append(f"{json_file.relative_to(REPO_ROOT)}: {e}")
    passed = len(errors) == 0
    details = [f"Checked {count} JSON files"]
    if errors:
        details.extend(errors)
    return CheckResult("JSON syntax validation", passed, details)


def check_plugin_metadata():
    """Run the plugin metadata validation script."""
    meta_script = SCRIPTS_DIR / "check-plugin-metadata.py"
    if not meta_script.exists():
        return CheckResult("Plugin metadata", False, ["check-plugin-metadata.py not found"])

    try:
        result = subprocess.run(
            [sys.executable, str(meta_script)],
            capture_output=True, text=True, timeout=30
        )
        passed = result.returncode == 0
        details = []
        if result.stdout:
            details.append(result.stdout.strip())
        if result.stderr:
            details.append(result.stderr.strip())
        return CheckResult("Plugin metadata validation", passed, details)
    except subprocess.TimeoutExpired:
        return CheckResult("Plugin metadata validation", False, ["Timed out"])
    except Exception as e:
        return CheckResult("Plugin metadata validation", False, [str(e)])


def check_bash_syntax():
    """Check bash/sh scripts with 'bash -n'."""
    errors = []
    count = 0
    for sh_file in REPO_ROOT.rglob("*.sh"):
        if ".git" in sh_file.parts:
            continue
        count += 1
        try:
            result = subprocess.run(
                ["bash", "-n", str(sh_file)],
                capture_output=True, text=True, timeout=10
            )
            if result.returncode != 0:
                errors.append(f"{sh_file.relative_to(REPO_ROOT)}: {result.stderr.strip()}")
        except FileNotFoundError:
            return CheckResult("Bash syntax", False, ["bash not found on this system"])
        except subprocess.TimeoutExpired:
            errors.append(f"{sh_file.relative_to(REPO_ROOT)}: timed out")

    passed = len(errors) == 0
    details = [f"Checked {count} shell scripts"]
    if errors:
        details.extend(errors)
    return CheckResult("Bash shell syntax", passed, details)


def check_python_syntax():
    """Check Python scripts syntax."""
    errors = []
    count = 0
    for py_file in REPO_ROOT.rglob("*.py"):
        if ".git" in py_file.parts:
            continue
        count += 1
        try:
            result = subprocess.run(
                [sys.executable, "-m", "py_compile", str(py_file)],
                capture_output=True, text=True, timeout=10
            )
            if result.returncode != 0:
                errors.append(f"{py_file.relative_to(REPO_ROOT)}: {result.stderr.strip()}")
        except subprocess.TimeoutExpired:
            errors.append(f"{py_file.relative_to(REPO_ROOT)}: timed out")

    passed = len(errors) == 0
    details = [f"Checked {count} Python files"]
    if errors:
        details.extend(errors)
    return CheckResult("Python syntax", passed, details)


def check_repo_consistency():
    """Run the pipeline consistency checker."""
    check_script = SCRIPTS_DIR / "check-pipeline-consistency.py"
    if not check_script.exists():
        return CheckResult("Repository consistency", False, ["check-pipeline-consistency.py not found"])

    try:
        result = subprocess.run(
            [sys.executable, str(check_script)],
            capture_output=True, text=True, timeout=60
        )
        passed = result.returncode == 0
        details = []
        if result.stdout:
            details.append(result.stdout.strip().split("\n")[-1])  # Last line: PASS/FAIL
        if result.stderr:
            details.extend(result.stderr.strip().split("\n"))
        return CheckResult("Repository consistency checks", passed, details)
    except subprocess.TimeoutExpired:
        return CheckResult("Repository consistency checks", False, ["Timed out"])
    except Exception as e:
        return CheckResult("Repository consistency checks", False, [str(e)])


def check_git_diff_check():
    """Check for whitespace errors and merge conflict markers."""
    try:
        result = subprocess.run(
            ["git", "diff", "--check"],
            capture_output=True, text=True, timeout=10,
            cwd=REPO_ROOT
        )
        passed = result.returncode == 0
        details = []
        if result.stdout:
            details.append(result.stdout.strip())
        if result.stderr:
            details.append(result.stderr.strip())
        return CheckResult("Git diff --check (whitespace/conflicts)", passed, details)
    except FileNotFoundError:
        return CheckResult("Git diff --check", False, ["git not found"])
    except subprocess.TimeoutExpired:
        return CheckResult("Git diff --check", False, ["Timed out"])


def check_working_tree(allow_changes=False):
    """Check for unexpected untracked artifacts unless local changes are allowed."""
    try:
        result = subprocess.run(
            ["git", "status", "--porcelain"],
            capture_output=True, text=True, timeout=10,
            cwd=REPO_ROOT
        )
        if result.returncode != 0:
            return CheckResult("Working tree check", False, ["git status failed"])

        output = result.stdout.strip()
        if not output:
            return CheckResult("Working tree clean", True, ["No unexpected changes"])
        if allow_changes:
            return CheckResult("Working tree check", True, ["Working tree changes allowed by --allow-working-tree"])

        # Filter out allowed artifacts
        lines = [line for line in output.split("\n") if line.strip()]
        # Known allowable: .mbti files, generated docs
        allowed_patterns = ["pkg.generated.mbti", "moon.mod", "moon.pkg"]
        known = []
        unexpected = []
        for line in lines:
            path = line[3:].strip()
            if any(p in path for p in allowed_patterns):
                known.append(path)
            else:
                unexpected.append(line)

        if unexpected:
            return CheckResult("Working tree clean", False,
                               [f"Unexpected changes: {len(unexpected)}",
                                *unexpected[:10]])
        return CheckResult("Working tree clean", True, [f"Only known artifacts: {known}"])
    except (FileNotFoundError, subprocess.TimeoutExpired) as e:
        return CheckResult("Working tree check", False, [str(e)])


def main():
    parser = argparse.ArgumentParser(description="MoonBit Skills repository quality checks")
    parser.add_argument("--verbose", "-v", action="store_true",
                        help="Show detailed output")
    parser.add_argument("--skip-shell", action="store_true",
                        help="Skip shell syntax checks (on Windows without bash)")
    parser.add_argument("--allow-working-tree", action="store_true",
                        help="Do not fail on intentional local changes")
    parser.add_argument("--format", choices=["text", "json"], default="text",
                        help="Output format")
    args = parser.parse_args()

    checks = [
        ("JSON syntax", check_json_syntax),
        ("Plugin metadata", check_plugin_metadata),
        ("Python syntax", check_python_syntax),
        ("Repository consistency", check_repo_consistency),
        ("Git whitespace", check_git_diff_check),
        ("Working tree", lambda: check_working_tree(args.allow_working_tree)),
    ]

    if not args.skip_shell:
        checks.insert(2, ("Bash syntax", check_bash_syntax))

    results = []
    failed = False

    for name, check_fn in checks:
        result = check_fn()
        results.append(result.to_dict())
        if not result.passed:
            failed = True
        if args.format == "text":
            print(result)
            if args.verbose and result.details:
                for d in result.details:
                    print(f"    {d}")

    if args.format == "json":
        print(json.dumps({"failed": failed, "checks": results}, indent=2))

    if args.format == "text":
        print(f"\n{'=' * 40}")
        passed_count = sum(1 for r in results if r["passed"])
        total_count = len(results)
        print(f"Results: {passed_count}/{total_count} passed")
        if failed:
            print("OVERALL: FAILED")
        else:
            print("OVERALL: PASSED")

    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
