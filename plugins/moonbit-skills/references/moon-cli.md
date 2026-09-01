# Moon CLI 命令深度参考（moon-cli）

> 调研版本：moon 0.1.20260713（75c7e1f，2026-07-13）
> 数据来源：`moon --help` 与 `moon <cmd> --help` 实际输出 + MoonBit 官方文档（docs.moonbitlang.com）
> 用途：MoonBit 项目开发、验证、发布全流程的 CLI 权威速查；与 MoonBit Skills 仓库各技能的命令引用一一对应

---

## 一、命令总览（29 个顶层命令）

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

## 二、通用选项（所有命令共享）

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

---

## 三、命令深度说明（按归类）

### 3.1 项目创建与工作区

#### `moon new <PATH>` — 创建新 MoonBit 模块

```
Usage: moon new [OPTIONS] <PATH>
  --user <USER>  模块用户名，默认取当前登录用户
  --name <NAME>  模块名，默认取路径最后一段
```

- **深度说明**：生成一个最小可构建的 MoonBit 模块骨架（`moon.mod` + 默认包结构），是 `moonbit-scaffold` 的前置依赖。
- **要点**：用户名/模块名可显式指定，避免与登录账号不一致；生成后需自行补充 `moon.pkg` 等结构。
- **与技能仓库映射**：`moonbit-scaffold`（动态生成骨架的前提）。

#### `moon work <SUBCOMMAND>` — 工作区维护

```
Usage: moon work <COMMAND>
  init   创建工作区清单（moon.work）
  use    将模块加入工作区清单
  sync   将工作区依赖版本同步进成员清单
```

- **深度说明**：管理多模块工作区（monorepo 场景）。`init` 创建 `moon.work`；`use` 把多个模块纳入统一工作区；`sync` 统一依赖版本，避免成员间版本漂移。
- **要点**：工作区项目用 `moon.work` 而非单 `moon.mod`；多包依赖分析用 `moon tree`。
- **与技能仓库映射**：`moonbit-verify` B4 工作区状态检查。

### 3.2 构建与运行

#### `moon build [PATH]...` — 构建当前包

```
Usage: moon build [OPTIONS] [PATH]...
  [PATH]...  要构建的包路径
  -g/--release/--strip/--target/--enable-coverage/--sort-input/--output-wat
  -d, --deny-warn / --no-render / --output-json / --warn-list / -j / --render-no-loc / --diagnostic-limit
  --frozen / -w, --watch
```

- **深度说明**：编译当前包产出目标文件。`--watch` 可监听文件系统自动重建；`--target all` 一次构建全部后端；`--output-json` 供脚本解析诊断。
- **要点**：`-d --deny-warn` 把警告当错误（严格门禁）；`--frozen` 离线构建。
- **与技能仓库映射**：`moonbit-verify` 各类型专属验证。

#### `moon check [PATH]...` — 类型检查（不产出目标文件）

```
Usage: moon check [OPTIONS] [PATH]...
  [PATH]...  包目录或 .mbt/.mbt.md 文件路径
  共享构建选项 + --patch-file / --explain / --fmt / -w, --watch
```

- **深度说明**：只做类型/借用检查，不生成目标文件，速度远快于 build。`--fmt` 顺带检查格式；`--explain` 展开错误码；`--patch-file` 校验补丁；可对单个 `.mbt.md` 文档内嵌代码检查。
- **要点**：CI 与本地门禁的首选检查命令；`--warn-list +73` 启用无条件递归警告（仓库 B2 门禁）。
- **与技能仓库映射**：`moonbit-verify` **B2**（`moon check --warn-list +73`）。

#### `moon prove [PATH]` — 形式化证明

```
Usage: moon prove [OPTIONS] [PATH]
  --why3-config <PATH>  使用用户提供的 Why3 配置文件
```

- **深度说明**：对包进行形式化证明（Why3 后端），是 MoonBit 近年新增的验证能力，用于可证明正确性的核心逻辑。
- **要点**：需要 Why3 环境；适合关键不变量（如 parser 边界、索引越界）的证明；属增强级验证。
- **与技能仓库映射**：`moonbit-verify` 增强测试候选；官方 `moonbit-proof` skill 的底层命令。

#### `moon run <PACKAGE|MBT_FILE|-> [ARGS]...` — 运行 main 包

```
Usage: moon run [OPTIONS] <PACKAGE_OR_MBT_FILE|-e <SCRIPT>> [ARGS]...
  -e <SCRIPT>              直接运行 .mbtx 源码字符串
  - / stdin                从标准输入读 .mbtx
  --target / --release / --debug / --strip
  --profile                原生可执行文件性能剖析（macOS Time Profiler / Linux perf）
  --build-only             只构建不运行
```

- **深度说明**：运行 main 包；支持 `-e` 单行脚本与 stdin 管道；`--profile` 直接出性能剖析。
- **要点**：CLI 项目验收的必需命令（输出非空）；`-e` 适合快速冒烟测试。
- **与技能仓库映射**：`moonbit-verify` **C2**（main 项目 `moon run .` + stdout 非空）。

#### `moon runwasm <LOCAL|PACKAGE[@VERSION]> [ARGS]...` — WASM 运行

```
Usage: moon runwasm [OPTIONS] <LOCAL_PACKAGE|PACKAGE[@VERSION]> [ARGS]...
  --experimental-policy <PATH>  moonrun TOML 策略（moonbitlang/async 运行时访问）
  接受 mooncakes 坐标：moonbitlang/parser/cmd/moonfmt@0.3.3
  缓存：$MOON_HOME/registry/cache/assets
```

- **深度说明**：本地包按 `moon run --target wasm` 运行，或直接运行 mooncakes 上预构建的 wasm 二进制（无需本地构建）。
- **要点**：支持 pin 版本坐标与自动解析最新版；适合快速试跑生态工具（如 moonfmt）。
- **与技能仓库映射**：`moonbit-verify` wasm 类型验证。

#### `moon clean` — 删除 _build

- **深度说明**：清除 `<project-root>/_build`，解决陈旧产物导致的诡异编译错误。

### 3.3 测试与基准

#### `moon test [PATH]...` — 运行测试

```
Usage: moon test [OPTIONS] [PATH]...
  [PATH]...  测试目标路径（包目录或包内文件；项目外则临时项目运行）
  -f, --filter <FILTER>       按 glob 过滤测试名（* 任意序列 / ? 单字符）
  -p, --package <PACKAGE>...  指定包运行测试
  -i, --index <INDEX>         只跑文件中第 index 个测试（支持 0-2 范围，隐含 --include-skipped）
  --doc-index <DOC_INDEX>     只跑文件中第 index 个 doc test（隐含 --include-skipped）
  -u, --update                更新测试快照（expect test）
  -l, --limit <LIMIT>         快照更新轮数上限 [default: 256]
  --outline                   打印待执行测试大纲并退出
  --test-failure-json         以 JSON 输出失败信息
  --include-skipped           包含跳过测试
  --no-parallelize            目标后端内串行执行
  --profile                   原生测试可执行文件性能剖析
  --build-only                只构建不运行测试
  --patch-file <PATCH_FILE>   指定补丁文件
  共享构建选项（--target/--release/--debug/--warn-list 等）
```

- **深度说明**：MoonBit 测试总入口。`-f` 过滤是 TDD 循环中 RED/GREEN 聚焦验证的关键；`-u` 用于 expect test（快照测试）更新；`--test-failure-json` 供 CI 脚本解析；`--outline` 可先看测试清单。
- **要点**：本仓库所有 TDD 步骤均用 `moon test -f "test_name"` 聚焦；valid/invalid/edge 分类靠测试名前缀（`-f "valid/"` 等）。
- **与技能仓库映射**：`moonbit-verify` **B3**、`moonbit-testing` 测试运行。

#### `moon bench [PATH]...` — 运行基准测试

```
Usage: moon bench [OPTIONS] [PATH]...
  [PATH]...  基准测试路径（包目录或包内文件）
  -p, --package <PACKAGE>...  指定包
  -f, --file <FILE>           指定文件（需与 --package 搭配）
  -i, --index <INDEX>         只跑第 index 个基准（支持范围）
  --no-parallelize / --build-only
  共享构建选项
```

- **深度说明**：运行 `bench_` 前缀的基准测试。`-f/--file` 与 `-i` 用于精准定位单个基准；`--no-parallelize` 串行跑保证测量稳定。
- **要点**：性能回归检测的基础；配合 `moon run --profile` 做热点定位。
- **与技能仓库映射**：`moonbit-verify` E3 性能基线。

#### `moon coverage <SUBCOMMAND>` — 代码覆盖率

```
Usage: moon coverage <COMMAND>
  analyze  带插桩运行测试并报告覆盖率
  report   生成覆盖率报告
  clean    清理覆盖率产物
```

- **深度说明**：覆盖率三件套：`analyze` 收集数据，`report` 出报告，`clean` 清理。配合构建选项 `--enable-coverage` 使用。
- **要点**：新增命令（近期工具链加入），可用于增强验证的覆盖门禁。
- **与技能仓库映射**：`moonbit-verify` 增强测试候选（覆盖完整性信号）。

### 3.4 格式与文档

#### `moon fmt [PATH]... [-- <ARGS>...]` — 格式化源码

```
Usage: moon fmt [OPTIONS] [PATH]... [-- <ARGS>...]
  --check       只检查不改动源码（exit 非 0 表示需要格式化）
  --sort-input  排序输入文件
  --warn        若未格式化则告警
  [ARGS]...     传给格式化器的额外参数（在 -- 之后）
```

- **深度说明**：自动格式化；`--check` 是 CI/门禁的标准用法（本仓库 B1）。可指定单文件/单包范围。
- **要点**：`moon fmt --check` 失败后先 `moon fmt` 自动修复，再 `git diff --exit-code` 确认干净。
- **与技能仓库映射**：`moonbit-verify` **B1**、hooks pre-commit。

#### `moon doc [SYMBOL]` — 生成/检索文档

```
Usage: moon doc [OPTIONS] [SYMBOL]
  --serve        启动 web 服务器托管文档
  -b, --bind     服务器地址 [default: 127.0.0.1]
  -p, --port     服务器端口 [default: 3000]
  [SYMBOL]       [已弃用] 查询符号文档；改用 `moon ide doc <SYMBOL>`
```

- **深度说明**：`--serve` 起本地文档服务器；符号查询已迁移到 `moon ide doc`。
- **要点**：evaluate 阶段文档预览用 `moon doc --target-dir`（老接口）或 `--serve` 浏览。

#### `moon explain <--diagnostic|--attribute>` — 解释诊断码与语言特性

```
Usage: moon explain [OPTIONS] <--diagnostic [<ID_OR_NAME>]|--attribute [<NAME>]>
  --diagnostic [<ID_OR_NAME>]  解释诊断；不带查询则列出全部诊断码与名称
  --attribute [<NAME>]         解释属性；不带查询则列出属性名
```

- **深度说明**：编译器诊断码（如 `E4053`）与语言属性的官方解释入口，无网络依赖。
- **要点**：本仓库错误恢复的统一第一步：`moon explain --diagnostic E####` 定位类型错误。
- **与技能仓库映射**：`moonbit-verify` 错误恢复。

#### `moon info [PATH]...` — 生成公共接口 .mbti

```
Usage: moon info [OPTIONS] [PATH]...
  --target <TARGET>   检查指定后端接口差异，不改变 pkg.generated.mbti 输出
  -p, --package <PKG> 为指定包生成 mbti（与 PATH 互斥）
  [PATH]...           包或文件路径
```

- **深度说明**：为每个包生成 `pkg.generated.mbti`（公共 API 签名文件），是 API 稳定性检查的基础。默认写 canonical backend（模块/工作区 `preferred-backend`，回退 `wasm-gc`）；`--target` 只检查不改写。
- **要点**：`git diff --exit-code pkg.generated.mbti` 用于 API 表面比对（C1/H5 门禁）；跨版本比对决定 SemVer 建议。
- **与技能仓库映射**：`moonbit-verify` **C1**（API 稳定性）。

### 3.5 依赖管理

#### `moon add <MODULE>` — 添加依赖

```
Usage: moon add [OPTIONS] <MODULE>
  --bin          作为二进制依赖添加
  -u, --upgrade  升级已有依赖
  --no-update    添加前不更新注册索引
```

- **深度说明**：添加 mooncakes 注册表依赖。`--bin` 添加二进制包（工具类）；`--upgrade` 升级版本。
- **要点**：本仓库依赖管理契约的第一步：`moon add <pkg>` → `moon check` → `moon test` → `moon-audit`。
- **与技能仓库映射**：`moonbit-verify` E2 依赖安全审计。

#### `moon remove <MODULE>` — 移除依赖

```
Usage: moon remove [OPTIONS] <MODULE>
```

- **深度说明**：从 manifest 移除依赖。

#### `moon install [SOURCE] [PATH_IN_REPO]` — 安装二进制/项目依赖

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

#### `moon tree` — 显示依赖树

- **深度说明**：打印当前模块的依赖树，排查依赖版本冲突与循环依赖。
- **与技能仓库映射**：`moonbit-plan` 依赖评估。

#### `moon fetch <MODULE[@VERSION]>` — 下载包到 .repos（不稳定）

```
Usage: moon fetch [OPTIONS] <MODULE[@VERSION]>
  --no-update  获取前不更新注册索引
```

- **深度说明**：不稳定命令，把包下载到 `.repos` 目录（本地开发/调试依赖用）。
- **要点**：标注 unstable，生产流程慎用。

#### `moon update` — 更新注册索引

- **深度说明**：同步 mooncakes 注册索引；`moon add` 的 `--no-update` 可跳过。
- **与技能仓库映射**：依赖管理前置步骤。

### 3.6 账户与发布

#### `moon login` / `moon whoami` / `moon register`

```
Usage: moon login          # 登录（交互式）
Usage: moon whoami         # 显示登录状态与用户名
Usage: moon register       # 在 mooncakes.io 注册账号
```

- **深度说明**：发布前置三件套：注册 → 登录 → 确认身份。`whoami` 验证当前凭证。
- **要点**：`moon publish` 前必须 login 成功。

#### `moon publish` — 发布当前模块

```
Usage: moon publish [OPTIONS]
  --frozen  不同步依赖
```

- **深度说明**：把当前模块发布到 mooncakes.io（lib 项目的发布方式）。发布前应完成全量验证 + SemVer 决策。
- **要点**：发布不可逆，版本号一经发布不可改写（注册表不可变语义）。

#### `moon package [--list]` — 打包当前模块

```
Usage: moon package [OPTIONS]
  --list  列出打包内容
```

- **深度说明**：打包当前模块为可分发包（发布前预览包含哪些文件）。`--list` 查看内容清单。

### 3.7 工具链与杂项

#### `moon generate-build-matrix` — 生成基准构建矩阵（遗留）

```
Usage: moon generate-build-matrix --output-dir <OUT_DIR>
  -n <NUMBER>  统一设置 drow/dcol/mrow/mcol
  --drow/--dcol/--mrow/--mcol  行列数配置
  -o, --output-dir <OUT_DIR>
```

- **深度说明**：遗留特性，生成基准测试构建矩阵目录结构。
- **要点**：标注 legacy，新项目不建议使用。
- **与技能仓库映射**：无直接映射（历史功能）。

#### `moon upgrade` — 升级工具链

```
Usage: moon upgrade [OPTIONS]
  -f, --force  强制升级
  --dev        安装最新开发版
```

- **深度说明**：升级 moon 工具链本体。`--dev` 安装开发版（尝鲜/验证新特性）。
- **要点**：工具链升级后应重跑全量验证（新版本可能改变诊断/行为）。

#### `moon shell-completion` — 生成 shell 补全

```
Usage: moon shell-completion [OPTIONS]
  --shell <SHELL>  目标 shell [default: powershell]
                   可选：bash / elvish / fish / powershell / zsh
```

- **深度说明**：输出补全脚本到 stdout，支持 bash/elvish/fish/pwsh/zsh。示例：`moon shell-completion --shell bash >> ~/.local/share/bash-completion/completions/moon`；或 `eval "$(moon shell-completion --shell <SHELL>)"` 动态加载。
- **要点**：Windows 用 PowerShell 补全（v5.0+）。

---

## 四、命令 ↔ 技能仓库映射总表

| 技能 | 核心命令 | 用途 |
|------|---------|------|
| `moonbit-plan` | `moon tree` | 依赖评估；不直接使用构建命令 |
| `moonbit-scaffold` | `moon new` | 新项目骨架前提 |
| `moonbit-testing` | `moon test`、`moon test --outline` | 测试运行与组织 |
| `moonbit-verify` | `moon fmt --check`（B1）、`moon check --warn-list +73`（B2）、`moon test`（B3）、`moon info`（C1）、`moon run .`（C2）、`moon check --target all`（E1） | 三级门禁 |

## 五、实用组合速查

| 场景 | 命令组合 |
|------|---------|
| 新项目 + 骨架 | `moon new my-tool && cd my-tool && moon build` |
| TDD 聚焦验证 | `moon test -f "task_x_*"` |
| 单任务完成全量门禁 | `moon fmt --check && moon check --warn-list +73 && moon test` |
| API 表面比对 | `moon info --target native && git diff --exit-code pkg.generated.mbti` |
| 跨平台检查 | `moon check --target all` |
| 诊断定位 | `moon explain --diagnostic E####` |
| 覆盖率信号 | `moon coverage analyze && moon coverage report` |
| 快照测试更新 | `moon test -u`（expect test） |
| 发布前检查 | `moon login && moon whoami && moon package --list && moon publish` |
| 工作区同步 | `moon work init && moon work use <module> && moon work sync` |

---

*文档完 · 基于 moon 0.1.20260713 实际 help 输出 + 官方文档*




