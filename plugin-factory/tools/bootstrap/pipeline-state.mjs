// scripts/pipeline-state.mjs — Pipeline state read/write/validation/migration utilities.
export async function readState(root) {
  const fs = await import("node:fs/promises");
  const path = await import("node:path");
  const statePath = path.join(root, "pipeline-state.json");
  try {
    const raw = await fs.readFile(statePath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function writeState(root, state) {
  const fs = await import("node:fs/promises");
  const path = await import("node:path");
  const statePath = path.join(root, "pipeline-state.json");
  await fs.writeFile(statePath, JSON.stringify(state, null, 2) + "\n", "utf-8");
}

export function migrateState(state) {
  if (!state || typeof state !== "object") return state;
  // v1: no migrations needed yet — if schema_version changes, add branches here
  return state;
}

export function validateState(state) {
  const errors = [];
  if (!state || typeof state !== "object") {
    return { valid: false, errors: ["State is null or not an object"] };
  }
  if (state.schema_version !== 1) {
    errors.push(`Unknown schema_version: ${state.schema_version}`);
  }
  if (!["design", "build", "verify", "release"].includes(state.phase)) {
    errors.push(`Invalid phase: ${state.phase}`);
  }
  if (!["pending", "in_progress", "completed", "interrupted"].includes(state.status)) {
    errors.push(`Invalid status: ${state.status}`);
  }
  if (state.tasks) {
    const { total, completed, current } = state.tasks;
    if (typeof total !== "number" || total < 0) errors.push("tasks.total must be a non-negative number");
    if (typeof completed !== "number" || completed < 0) errors.push("tasks.completed must be a non-negative number");
    if (typeof current !== "number" || current < 1) errors.push("tasks.current must be >= 1");
    if (completed > total) errors.push("tasks.completed cannot exceed tasks.total");
  }
  return { valid: errors.length === 0, errors };
}
