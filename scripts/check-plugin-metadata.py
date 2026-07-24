#!/usr/bin/env python3
"""Check that Claude and Codex plugin metadata stay in sync."""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FILES = [ROOT / ".claude-plugin" / "plugin.json", ROOT / ".codex-plugin" / "plugin.json"]
FIELDS = ("name", "repository", "version", "author")


def main() -> int:
    documents = [json.loads(path.read_text(encoding="utf-8")) for path in FILES]
    failures = []
    for field in FIELDS:
        values = {document.get(field) for document in documents}
        if len(values) != 1:
            failures.append(f"{field}: {sorted(values, key=str)}")
    for path, document in zip(FILES, documents):
        if document.get("hooks") != "hooks/hooks.json":
            failures.append(f"{path}: hooks must point to hooks/hooks.json")
    if failures:
        print("Plugin metadata mismatch:")
        print("\n".join(f"- {failure}" for failure in failures))
        return 1
    print("Plugin metadata is consistent")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
