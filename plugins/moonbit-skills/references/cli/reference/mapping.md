# Moon CLI — 命令 ↔ 技能映射与实用组合

> 各命令的深度说明分布在 `cli/reference/` 下：`project.md`、`build-run.md`、`test.md`、`format-doc.md`、`deps.md`、`publish.md`、`toolchain.md`。

## 命令 ↔ 技能仓库映射总表

| 技能 | 核心命令 | 用途 |
|------|---------|------|
| `moonbit-plan` | `moon tree` | 依赖评估；不直接使用构建命令 |
| `moonbit-scaffold` | `moon new` | 新项目骨架前提 |
| `moonbit-testing` | `moon test`、`moon test --outline` | 测试运行与组织 |
| `moonbit-verify` | `moon fmt --check`（B1）、`moon check --warn-list +73`（B2）、`moon test`（B3）、`moon info`（C1）、`moon run .`（C2）、`moon check --target all`（E1） | 三级门禁 |

## 实用组合速查

| 场景 | 命令组合 |
|------|---------|
| 新项目 + 骨架 | `moon new my-tool && cd my-tool && moon build` |
| TDD 聚焦验证 | `moon test -f "feature_x_*"` |
| 单任务完成全量门禁 | `moon fmt --check && moon check --warn-list +73 && moon test` |
| API 表面比对 | `moon info --target native && git diff --exit-code pkg.generated.mbti` |
| 跨平台检查 | `moon check --target all` |
| 诊断定位 | `moon explain --diagnostic E####` |
| 覆盖率信号 | `moon coverage analyze && moon coverage report` |
| 快照测试更新 | `moon test -u`（expect test） |
| 发布前检查 | `moon login && moon whoami && moon package --list && moon publish` |
| 工作区同步 | `moon work init && moon work use <module> && moon work sync` |
