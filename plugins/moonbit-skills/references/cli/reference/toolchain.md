# Moon CLI — 工具链与杂项

> 分类速查见 [`overview.md`](./overview.md)；完整命令↔技能映射见 [`mapping.md`](./mapping.md)。

## moon generate-build-matrix — 生成基准构建矩阵（遗留）

```
Usage: moon generate-build-matrix --output-dir <OUT_DIR>
  -n <NUMBER>  统一设置 drow/dcol/mrow/mcol
  --drow/--dcol/--mrow/--mcol  行列数配置
  -o, --output-dir <OUT_DIR>
```

- **深度说明**：遗留特性，生成基准测试构建矩阵目录结构。
- **要点**：标注 legacy，新项目不建议使用。
- **与技能仓库映射**：无直接映射（历史功能）。

## moon upgrade — 升级工具链

```
Usage: moon upgrade [OPTIONS]
  -f, --force  强制升级
  --dev        安装最新开发版
```

- **深度说明**：升级 moon 工具链本体。`--dev` 安装开发版（尝鲜/验证新特性）。
- **要点**：工具链升级后应重跑全量验证（新版本可能改变诊断/行为）。

## moon shell-completion — 生成 shell 补全

```
Usage: moon shell-completion [OPTIONS]
  --shell <SHELL>  目标 shell [default: powershell]
                   可选：bash / elvish / fish / powershell / zsh
```

- **深度说明**：输出补全脚本到 stdout，支持 bash/elvish/fish/pwsh/zsh。示例：`moon shell-completion --shell bash >> ~/.local/share/bash-completion/completions/moon`；或 `eval "$(moon shell-completion --shell <SHELL>)"` 动态加载。
- **要点**：Windows 用 PowerShell 补全（v5.0+）。
