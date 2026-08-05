#!/usr/bin/env python3
"""
Change classification for MoonBit changes.

Generates candidate change types based on:
  - User intent keywords
  - Changed file paths
  - Presence of test/benchmark/migration/workflow files

Usage:
  python scripts/classify-change.py --user-intent "fix the parser bug" --changed-paths src/parser.mbt src/parser_test.mbt
  python scripts/classify-change.py --changed-paths README.md docs/
  python scripts/classify-change.py --changed-paths moon.mod moon.pkg
"""

import argparse
import os
import sys
from pathlib import Path


# Mapping from file patterns to change type hints
FILE_TYPE_HINTS = {
    # Feature / implementation
    r"src/.*\.mbt": "feature",
    r"tests?/.*\.mbt": "feature",
    r"src/.*_test\.mbt": "feature",

    # Configuration
    r"moon\.mod": "configuration",
    r"moon\.pkg": "configuration",
    r"moon\.work": "configuration",
    r"\.moonbit-pipeline\.json": "configuration",
    r"\.github/workflows/.*\.yml": "configuration",
    r"\.github/workflows/.*\.yaml": "configuration",
    r"hooks/.*\.(sh|cmd|ps1)": "configuration",

    # Documentation
    r"docs/.*\.md": "documentation",
    r"README\.md": "documentation",
    r"CHANGELOG\.md": "documentation",
    r".*\.md": "documentation",

    # Scaffold
    r"scaffold/.*": "scaffold",

    # Performance
    r".*_bench\.mbt": "performance",
    r"benchs?/.*": "performance",

    # Dependency
    r"moon\.(mod|pkg)$": "dependency",
    r".*lock\.json": "dependency",
    r".*\.lock": "dependency",

    # Security
    r".*audit.*": "security",
    r"SECURITY\.md": "security",

    # Release
    r"\.github/workflows/release.*\.(yml|yaml)": "release",
}


def classify_by_intent(intent_text):
    """Classify based on user intent text keywords."""
    if not intent_text:
        return set()

    intent_lower = intent_text.lower()
    types = set()

    # Intent keywords -> change type mapping
    intent_map = [
        (["new feature", "add feature", "implement", "new function", "new api", "add support"], "feature"),
        (["fix", "bug", "error", "crash", "broken", "wrong", "fail"], "bugfix"),
        (["refactor", "clean up", "cleanup", "code smell", "technical debt"], "refactor"),
        (["performance", "optimize", "slow", "bottleneck", "benchmark", "profile"], "performance"),
        (["upgrade", "update dep", "bump", "new version of"], "dependency"),
        (["config", "setting", "setup", "init", "initialize"], "configuration"),
        (["doc", "readme", "comment", "documentation", "document"], "documentation"),
        (["scaffold", "skeleton", "template", "generate"], "scaffold"),
        (["security", "vulnerability", "cve", "audit", "exploit"], "security"),
        (["release", "publish", "deploy", "ship", "version"], "release"),
        (["spike", "prototype", "explore", "proof of concept", "poc"], "spike"),
    ]

    for keywords, change_type in intent_map:
        if any(kw in intent_lower for kw in keywords):
            types.add(change_type)

    return types


def classify_by_paths(changed_paths):
    """Classify based on changed file paths."""
    if not changed_paths:
        return set()

    import re
    types = set()

    for path in changed_paths:
        path_lower = path.lower()
        for pattern, change_type in FILE_TYPE_HINTS.items():
            if re.search(pattern, path_lower):
                types.add(change_type)

    # Heuristic: files under src/ that also have test files
    has_src = any("src/" in p for p in changed_paths)
    has_test = any("test" in p for p in changed_paths)

    return types


def classify(args):
    """Generate candidate change types from all available signals."""
    types = set()

    # From intent
    if args.user_intent:
        intent_types = classify_by_intent(args.user_intent)
        types.update(intent_types)

    # From file paths
    if args.changed_paths:
        path_types = classify_by_paths(args.changed_paths)
        types.update(path_types)

    # Default if nothing matched
    if not types:
        types.add("feature")

    return types


def main():
    parser = argparse.ArgumentParser(
        description="Classify the type of change being made"
    )
    parser.add_argument("--user-intent", "-i",
                        help="User's description of the change intent")
    parser.add_argument("--changed-paths", "-p", nargs="*", default=[],
                        help="List of changed file paths")
    parser.add_argument("--verbose", "-v", action="store_true",
                        help="Show classification reasoning")

    args = parser.parse_args()

    if not args.user_intent and not args.changed_paths:
        parser.print_help()
        sys.exit(1)

    candidates = classify(args)

    if len(candidates) == 1:
        change_type = candidates.pop()
        if args.verbose:
            print(f"change_type: {change_type} (single candidate)")
        else:
            print(change_type)
        sys.exit(0)
    else:
        # Multiple candidates - output for user confirmation
        print("CANDIDATES:", file=sys.stderr)
        for t in sorted(candidates):
            print(f"  - {t}", file=sys.stderr)
        print(f"RESULT: {sorted(candidates)}")
        sys.exit(0)


if __name__ == "__main__":
    main()
