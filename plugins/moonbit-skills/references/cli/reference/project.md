# Moon CLI — 项目创建与工作区

> 分类速查见 [`overview.md`](./overview.md)；完整命令↔技能映射见 [`mapping.md`](./mapping.md)。

## moon new <PATH> — 创建新 MoonBit 模块

```
Usage: moon new [OPTIONS] <PATH>
  --user <USER>  模块用户名，默认取当前登录用户
  --name <NAME>  模块名，默认取路径最后一段
```

- **深度说明**：生成一个最小可构建的 MoonBit 模块骨架（`moon.mod` + 默认包结构），是 `moonbit-scaffold` 的前置依赖。
- **要点**：用户名/模块名可显式指定，避免与登录账号不一致；生成后需自行补充 `moon.pkg` 等结构。
- **与技能仓库映射**：`moonbit-scaffold`（动态生成骨架的前提）。

## moon work <SUBCOMMAND> — 工作区维护

```
Usage: moon work <COMMAND>
  init   创建工作区清单（moon.work）
  use    将模块加入工作区清单
  sync   将工作区依赖版本同步进成员清单
```

- **深度说明**：管理多模块工作区（monorepo 场景）。`init` 创建 `moon.work`；`use` 把多个模块纳入统一工作区；`sync` 统一依赖版本，避免成员间版本漂移。
- **要点**：工作区项目用 `moon.work` 而非单 `moon.mod`；多包依赖分析用 `moon tree`。
- **与技能仓库映射**：`moonbit-verify` B4 工作区状态检查。
