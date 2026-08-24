# references/ — 死知识仓库

**放置规则（本项目约定）**：

- **references/ 只放"被技能用到、但是死知识"的内容**——偶尔用、不常用、或特别长
  特别多的规格性文档。
- 技能内（`skills/`）放**流程编排与最重要的知识**（怎么做、什么时候做）；
  不常用的细节与长规格一律下沉到这里，技能只引用不内联。
- 按 **harness（端）** 组织，不按功能堆文件：`harnesses/<h>/` 每个端一个目录，
  收编该端全部规格（打包 + hooks + 适配差异）。跨端共享的方法论死知识放根目录。

## 按 harness 目录（5 端）

| 端 | 目录 | plugin.md（打包/安装） | hooks.md（钩子） | adapters.md（适配速查） |
|----|------|----------------------|------------------|------------------------|
| Claude Code | [`harnesses/claude-code/`](harnesses/claude-code/) | ✅ | ✅ | ✅ |
| pi | [`harnesses/pi/`](harnesses/pi/) | ✅ | ✅ | ✅ |
| opencode | [`harnesses/opencode/`](harnesses/opencode/) | ✅ | ✅ | ✅ |
| oh-my-pi (omp) | [`harnesses/oh-my-pi/`](harnesses/oh-my-pi/) | ✅ | —（与 pi 同 API，见 harnesses/pi/） | ✅ |
| Codex / ChatGPT | [`harnesses/codex/`](harnesses/codex/) | ✅ | —（无 hooks 机制） | ✅ |

> **规则**：agent 做插件设计/打包/hook 设计时必须使用上述分端文件——**不要重复搜网**。
> 仅当某端出现破坏性变更或适配器接线运行时失败时，复核受影响的端文件。

## 跨 harness 死知识（根目录）

| 文件 | 内容 |
|------|------|
| [`design-principles.md`](design-principles.md) | 铁律与设计原则（职责边界、规格锚定等） |
| [`induction-principles.md`](induction-principles.md) | 结构维护方法论（归纳原则：按场景归位、唯一源、移动必接线） |
| [`orchestration-patterns.md`](orchestration-patterns.md) | 编排模式（Chain / Star / Bus / DAG、插件生命周期场景） |
| [`skill-boundaries.md`](skill-boundaries.md) | 技能职责边界纪律清单 |
| [`skill-structure.md`](skill-structure.md) | 共享骨架标题声明（verify 的 repeated-guidance 探针读取） |
| [`plugin-optimization.md`](plugin-optimization.md) | 插件优化方法论（审计先行 + P0/P1/P2 分级 + 防回归测试） |

## 跨端渲染规则（hooks）

每个 hook 只写一次：规范的 `{event, action}`（来自插件构件清单），渲染三种：

- **Claude Code** → `.sh` + `.ps1` 成对，经 `shell` 字段接线（`"bash"` / `"powershell"`）。
- **opencode** → `.opencode/plugins/` 下每个事件组一个 `.ts` 插件
  （修改 `output` / throw）。
- **pi / oh-my-pi** → `.pi/extensions/<插件名>.ts` 中的 `pi.on(...)` 处理器
  （`return {block:true}` / 返回修改结果）。

## 跨端打包规则（发布门禁）

1. 每个对外宣称的端都有对应 manifest（见各端 `plugin.md`）。
2. 技能规范位置为根部 `skills/`（Agent Skills 标准，单一源）；
   Codex 用 `skills` 字段指向 `./skills/`，opencode 用 bootstrap `config`
   钩子运行时注册根 `skills/` — 均为单一源。
3. 双语 README（`README.md` + `README.zh-CN.md`）、`AGENTS.md`/`CLAUDE.md`、
   安装脚本（`install.sh` / `install.ps1`）。
4. **产物契约（T1 生效，`tools/scaffold/scaffold.mjs` 强制）**：一个 harness 只有在
   其全部必需产物渲染后才被声明支持——`tools/harnesses/<h>/` 只放该端的
   manifest、bootstrap 适配器与安装说明；共享文件在 `templates/` 只存一份。
   未请求的 harness 不生成文件；`package.json` 的 `pi`/`omp` 字段只在对应产物
   实际存在时写入（不声明悬空路径）。生成项目自带 `scripts/verify.mjs` +
   `scripts/validate-structure.sh`/`.ps1`，`npm run validate` 立即可运行。

## 复核节奏

- 各分端文件固化于 **2026-08-01**（codex 2026-08-09 补），各自带来源 URL。
- 复核时**只更新受影响的端文件**——绝不跨端一并重搜。
- 背景研究/分析报告（如 plugin-creators）不提交本目录，放 `.agent-workplace/research/`。
