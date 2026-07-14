# MoonBit Orchestrator — Skill Dispatch & Composition Agent

## Purpose
Classify incoming MoonBit user requests and route to the correct skill (or skill chain). The mandatory gateway before any domain skill executes.

## Trigger
- Any user request mentioning MoonBit, `.mbt` files, `moon` commands, or mooncakes
- Implicitly triggered by `moonbit-orientation` when it detects a complex task spanning multiple skills

## Classification Matrix

| User intent | Trigger phrases | Route to |
|-------------|----------------|----------|
| C FFI binding | "C binding", "FFI", "wrapper.c", "链接C库", "extern" | `make-moonbit-c-bindings` |
| Spec test extraction | "spec test", "提取测试", "spec from impl", "extract test" | `moonbit-extract-spec-test` |
| Learning MoonBit | "怎么学", "how to", "语法", "入门", "tutorial" | `moonbit-agent-guide` |
| Refactoring | "重构", "重命名", "extract function", "rename" | `moonbit-refactoring` |
| Proof | "证明", "prove", "verification", "formal" | `moonbit-proof` |
| OCaml migration | "OCaml迁移", "ocaml2moonbit", "从OCaml" | `ocaml2moonbit-migration` |
| General / unknown | Everything else | `moonbit-orientation` (fallback to references/) |

## Workflow

### Step 1: Classify
Read the user's request. Identify domain and scope from the classification matrix.

### Step 2: Route
- **Single domain**: Load the matching skill, hand off execution
- **Multi-domain**: Load skills in sequence, passing state between them
- **Unknown**: Load `moonbit-orientation` → its `references/` sub-guides → if still no match, state limitation

### Step 3: Compose (for multi-step tasks)
When a task spans multiple skills, chain them:

```
moonbit-orientation: classify
  → skill-1: execute → output state summary
  → skill-2: continue from state summary → verify
  → moonbit-orientation: wrap-up + verification
```

### Step 4: Verify
After the skill chain completes, run the verification pipeline from the last skill. If any step failed, report which step and the failure mode.

### Step 5: State Summary
Return a structured summary:

```markdown
## Result
- **Skills used**: [skill-1, skill-2, ...]
- **Files created/modified**: [paths]
- **Verification**: [passed/failed]
- **Next steps**: [if any]
```

## Fallback Rules

1. If no skill description matches → use `moonbit-orientation` with `references/`
2. If `moonbit-orientation` cannot resolve → use `moonbit-agent-guide` for general guidance
3. If still insufficient → state "This scenario is not covered by current skills" and suggest filing an issue

## Anti-Patterns

- Do NOT skip classification and jump directly to a skill
- Do NOT compose skills that have conflicting preconditions
- Do NOT silently fall through to a skill that is a poor match — state the mismatch