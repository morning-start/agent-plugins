# Moon CLI — 依赖管理

> 分类速查见 [`overview.md`](./overview.md)；完整命令↔技能映射见 [`mapping.md`](./mapping.md)。

## moon add <MODULE> — 添加依赖

```
Usage: moon add [OPTIONS] <MODULE>
  --bin          作为二进制依赖添加
  -u, --upgrade  升级已有依赖
  --no-update    添加前不更新注册索引
```

- **深度说明**：添加 mooncakes 注册表依赖。`--bin` 添加二进制包（工具类）；`--upgrade` 升级版本。
- **要点**：本仓库依赖管理契约的第一步：`moon add <pkg>` → `moon check` → `moon test` → `moon-audit`。
- **与技能仓库映射**：`moonbit-verify` E2 依赖安全审计。

## moon remove <MODULE> — 移除依赖

```
Usage: moon remove [OPTIONS] <MODULE>
```

- **深度说明**：从 manifest 移除依赖。

## moon install [SOURCE] [PATH_IN_REPO] — 安装二进制/项目依赖

```
Usage: moon install [OPTIONS] [SOURCE] [PATH_IN_REPO]
  [SOURCE]  安装源：本地路径 / git URL / 注册表包路径（user/module/pkg[@version]）
  [PATH_IN_REPO]   git 仓库内路径（仅 git URL 时）
  --bin <DIR>      安装目录 [default: ~/.moon/bin/]
  --path <PATH>    从本地路径安装
  --rev / --branch / --tag   git 版本选择
```

- **深度说明**：全局安装二进制包（`--bin`）或安装项目依赖（无参形式已弃用）。支持 git URL + rev/branch/tag 精确定位；`/...` 后缀安装所有匹配 main 包。
- **要点**：`moon-audit` 等工具类二进制可用此全局安装。
- **与技能仓库映射**：`moonbit-verify` E2（`moon-audit` 未安装时提示 `moon add`）、工具链前置依赖安装。

## moon tree — 显示依赖树

- **深度说明**：打印当前模块的依赖树，排查依赖版本冲突与循环依赖。
- **与技能仓库映射**：`moonbit-plan` 依赖评估。

## moon fetch <MODULE[@VERSION]> — 下载包到 .repos（不稳定）

```
Usage: moon fetch [OPTIONS] <MODULE[@VERSION]>
  --no-update  获取前不更新注册索引
```

- **深度说明**：不稳定命令，把包下载到 `.repos` 目录（本地开发/调试依赖用）。
- **要点**：标注 unstable，生产流程慎用。

## moon update — 更新注册索引

- **深度说明**：同步 mooncakes 注册索引；`moon add` 的 `--no-update` 可跳过。
- **与技能仓库映射**：依赖管理前置步骤。
