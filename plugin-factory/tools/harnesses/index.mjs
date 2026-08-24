/**
 * index.mjs — harness 模块注册表。
 *
 * 导出所有 harness 的生命周期模块：init / update / upgrade / verify / scaffold。
 */
import * as claudeCodeInit from "./claude-code/init.mjs";
import * as claudeCodeUpdate from "./claude-code/update.mjs";
import * as claudeCodeUpgrade from "./claude-code/upgrade.mjs";
import * as claudeCodeVerify from "./claude-code/verify.mjs";
import * as claudeCodeScaffold from "./claude-code/scaffold.mjs";

import * as opencodeInit from "./opencode/init.mjs";
import * as opencodeUpdate from "./opencode/update.mjs";
import * as opencodeUpgrade from "./opencode/upgrade.mjs";
import * as opencodeVerify from "./opencode/verify.mjs";
import * as opencodeScaffold from "./opencode/scaffold.mjs";

import * as piInit from "./pi/init.mjs";
import * as piUpdate from "./pi/update.mjs";
import * as piUpgrade from "./pi/upgrade.mjs";
import * as piVerify from "./pi/verify.mjs";
import * as piScaffold from "./pi/scaffold.mjs";

import * as codexInit from "./codex/init.mjs";
import * as codexUpdate from "./codex/update.mjs";
import * as codexUpgrade from "./codex/upgrade.mjs";
import * as codexVerify from "./codex/verify.mjs";
import * as codexScaffold from "./codex/scaffold.mjs";

/** 所有注册的 harness 模块。 */
export const harnesses = {
  "claude-code": {
    init: claudeCodeInit,
    update: claudeCodeUpdate,
    upgrade: claudeCodeUpgrade,
    verify: claudeCodeVerify,
    scaffold: claudeCodeScaffold,
  },
  "opencode": {
    init: opencodeInit,
    update: opencodeUpdate,
    upgrade: opencodeUpgrade,
    verify: opencodeVerify,
    scaffold: opencodeScaffold,
  },
  "pi": {
    init: piInit,
    update: piUpdate,
    upgrade: piUpgrade,
    verify: piVerify,
    scaffold: piScaffold,
  },
  "oh-my-pi": {
    init: piInit,
    update: piUpdate,
    upgrade: piUpgrade,
    verify: piVerify,
    scaffold: piScaffold,
  },
  "codex": {
    init: codexInit,
    update: codexUpdate,
    upgrade: codexUpgrade,
    verify: codexVerify,
    scaffold: codexScaffold,
  },
};

/** 获取指定 harness 的完整模块。 */
export function getHarness(name) {
  return harnesses[name] || null;
}

/** 获取指定 harness 的特定生命周期模块。 */
export function getLifecycleModule(harness, phase) {
  return harnesses[harness]?.[phase] || null;
}

/** 获取 validator（兼容旧接口）。 */
export function getValidator(name) {
  return harnesses[name]?.verify || null;
}

/** 获取 scaffold helper（兼容旧接口）。 */
export function getScaffold(name) {
  return harnesses[name]?.scaffold || null;
}

/** 列出所有支持的 harness 名称。 */
export function listHarnesses() {
  return [...new Set(Object.keys(harnesses))];
}

/** 列出所有生命周期阶段。 */
export function listPhases() {
  return ["init", "update", "upgrade", "verify", "scaffold"];
}
