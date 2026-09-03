# Moon CLI — 命令总览与通用选项

> 调研版本：moon 0.1.20260713（75c7e1f，2026-07-13）
> 数据来源：`moon --help` 与 `moon <cmd> --help` 实际输出 + MoonBit 官方文档（docs.moonbitlang.com）
> 用途：MoonBit 项目开发、验证、发布全流程的 CLI 权威速查；与 MoonBit Skills 仓库各技能的命令引用一一对应

---

## 命令总览（29 个顶层命令）

| # | 命令 | 一句话说明 | 归类 |
|---|------|-----------|------|
| 1 | `moon new` | 创建新 MoonBit 模块 | 项目创建 |
| 2 | `moon work` | 工作区维护（init/use/sync 子命令） | 工作区 |
| 3 | `moon build` | 构建当前包 | 构建运行 |
| 4 | `moon check` | 类型检查（不产出目标文件） | 构建运行 |
| 5 | `moon prove` | 形式化证明当前包（Why3） | 构建运行 |
| 6 | `moon run` | 运行 main 包 | 构建运行 |
| 7 | `moon runwasm` | 以 WASM 运行本地包或预构建 mooncakes 二进制 | 构建运行 |
| 8 | `moon clean` | 删除 `_build` 目录 | 构建运行 |
| 9 | `moon test` | 运行测试 | 测试 |
| 10 | `moon bench` | 运行基准测试 | 测试 |
| 11 | `moon coverage` | 代码覆盖率（analyze/report/clean） | 测试 |
| 12 | `moon fmt` | 格式化源码 | 格式文档 |
| 13 | `moon doc` | 生成/检索文档（`--serve` 起 web 服务） | 格式文档 |
| 14 | `moon explain` | 解释编译器诊断码与语言特性（--diagnostic/--attribute） | 格式文档 |
| 15 | `moon info` | 生成公共接口 `.mbti` 文件 | 格式文档 |
| 16 | `moon add` | 添加依赖 | 依赖管理 |
| 17 | `moon remove` | 移除依赖 | 依赖管理 |
| 18 | `moon install` | 全局安装二进制包 / 安装项目依赖（无参已弃用） | 依赖管理 |
| 19 | `moon tree` | 显示依赖树 | 依赖管理 |
| 20 | `moon fetch` | 下载包到 `.repos`（不稳定） | 依赖管理 |
| 21 | `moon update` | 更新包注册索引 | 依赖管理 |
| 22 | `moon login` | 登录账号 | 账户发布 |
| 23 | `moon whoami` | 显示登录状态与用户名 | 账户发布 |
| 24 | `moon register` | 在 mooncakes.io 注册账号 | 账户发布 |
| 25 | `moon publish` | 发布当前模块 | 账户发布 |
| 26 | `moon package` | 打包当前模块（--list 列出内容） | 账户发布 |
| 27 | `moon generate-build-matrix` | 生成基准构建矩阵（遗留特性） | 工具链 |
| 28 | `moon upgrade` | 升级工具链（--force/--dev） | 工具链 |
| 29 | `moon shell-completion` | 生成 shell 补全脚本（bash/elvish/fish/pwsh/zsh） | 工具链 |

另：`moon version`（版本信息）、`moon help`（帮助）为通用命令。

---

## 通用选项（所有命令共享）

| 选项 | 说明 |
|------|------|
| `-C <DIR>` | 先切换到 DIR 再执行（必须在子命令之前）；相对路径相对于 DIR 解析 |
| `--target-dir <TARGET_DIR>` | 目标目录，默认 `<project-root>/_build` |
| `-q, --quiet` | 抑制输出 |
| `-v, --verbose` | 增加详细度 |
| `--trace` | 跟踪程序执行 |
| `--dry-run` | 不真正执行命令 |
| `-Z, --unstable-feature <FEATURE>` | 不稳定特性开关（env: `MOON_UNSTABLE`） |
| `-V, --version` | 打印全部版本信息 |

### 构建类共享选项（build/check/run/test/bench 通用）

| 选项 | 说明 |
|------|------|
| `-g, --debug` | 输出调试信息 |
| `--release` | 发布模式编译 |
| `--strip` / `--no-strip` | 开启/关闭剥离调试信息 |
| `--target <TARGET>` | 目标后端：`wasm` / `wasm-gc` / `js` / `native` / `llvm` / `all` |
| `--enable-coverage` | 启用覆盖率插桩 |
| `--sort-input` | 排序输入文件 |
| `--output-wat` | 输出 WAT 而非 WASM |
| `-d, --deny-warn` | 所有警告视为错误 |
| `--no-render` | 原始人类可读格式输出诊断 |
| `--output-json` | JSON 格式输出诊断 |
| `--warn-list <LIST>` | 警告列表配置（如 `+73`） |
| `-j, --jobs <N>` | 并行 job 数上限 |
| `--render-no-loc <LEVEL>` | 从某级别起渲染无位置诊断（默认 error） |
| `--diagnostic-limit <N>` | 限制渲染诊断数量 |
| `--frozen`（Manifest） | 不同步依赖，假定本地依赖最新 |
