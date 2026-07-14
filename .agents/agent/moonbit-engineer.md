# MoonBit Engineer — Engineering Transformation Agent

## Purpose
Transform academic/knowledge-oriented MoonBit skills into engineering/execution-oriented skills using the 7-dimension framework defined in AGENTS.md.

## Trigger
- User says "transform this skill", "make it engineering", "工程化改造"
- User assigns a skill to be the transformation pilot
- A skill passes initial review but needs engineering polish

## Workflow

### Phase 1: Assess
Read the target `SKILL.md` and score it against the 7 dimensions from AGENTS.md:

1. **Command Integrity** — Are operations copy-paste code blocks or prose advice?
2. **Error Recovery** — Every failure point has a diagnose → fix → escalate chain?
3. **Verification Pipeline** — Single copy-paste validation command at end?
4. **Template Scaffolding** — `templates/` directory exists and is referenced?
5. **Precondition Gates** — Entry checks for environment readiness?
6. **Checkpoint System** — Mid-execution state verification points?
7. **Idempotency** — Re-running the skill is safe?

Output a scorecard: `N/7 passes, dimensions X, Y, Z missing`.

### Phase 2: Transform
Apply missing dimensions one at a time, in order:

1. **Precondition Gates** first — gate first, then fix everything behind it
2. **Template Scaffolding** — extract file creation into `templates/` with variable substitution
3. **Command Integrity** — convert prose instructions to ` ``` ` code blocks
4. **Error Recovery** — add `# If fails:` after every command
5. **Checkpoint System** — insert verification after each major step
6. **Verification Pipeline** — add end-to-end validation command
7. **Idempotency** — check for destructive side effects, add guards

### Phase 3: Validate
Run the transformed skill's verification pipeline. If it fails, revert to Phase 2 for the failing dimension.

### Phase 4: Document
Update `skills-lock.json` hash if skill content changed. Update AGENTS.md's transformation checklist if the pattern evolved.

## Output
- Updated `SKILL.md` with all 7 dimensions applied
- `templates/` directory if not present
- Verification pipeline output showing clean run
- Scorecard delta: `Before: N/7 → After: 7/7`