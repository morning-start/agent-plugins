# Moon CLI — 构建与运行

> 分类速查见 [`overview.md`](./overview.md)；完整命令↔技能映射见 [`mapping.md`](./mapping.md)。

## moon build [PATH]... — 构建当前包

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

## moon check [PATH]... — 类型检查（不产出目标文件）

```
Usage: moon check [OPTIONS] [PATH]...
  [PATH]...  包目录或 .mbt/.mbt.md 文件路径
  共享构建选项 + --patch-file / --explain / --fmt / -w, --watch
```

- **深度说明**：只做类型/借用检查，不生成目标文件，速度远快于 build。`--fmt` 顺带检查格式；`--explain` 展开错误码；`--patch-file` 校验补丁；可对单个 `.mbt.md` 文档内嵌代码检查。
- **要点**：CI 与本地门禁的首选检查命令；`--warn-list +73` 启用无条件递归警告（仓库 B2 门禁）。
- **与技能仓库映射**：`moonbit-verify` **B2**（`moon check --warn-list +73`）。

## moon prove [PATH] — 形式化证明

```
Usage: moon prove [OPTIONS] [PATH]
  --why3-config <PATH>  使用用户提供的 Why3 配置文件
```

- **深度说明**：对包进行形式化证明（Why3 后端），是 MoonBit 近年新增的验证能力，用于可证明正确性的核心逻辑。
- **要点**：需要 Why3 环境；适合关键不变量（如 parser 边界、索引越界）的证明；属增强级验证。
- **与技能仓库映射**：`moonbit-verify` 增强测试候选；官方 `moonbit-proof` skill 的底层命令。

## moon run <PACKAGE|MBT_FILE|-> [ARGS]... — 运行 main 包

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

## moon runwasm <LOCAL|PACKAGE[@VERSION]> [ARGS]... — WASM 运行

```
Usage: moon runwasm [OPTIONS] <LOCAL_PACKAGE|PACKAGE[@VERSION]> [ARGS]...
  --experimental-policy <PATH>  moonrun TOML 策略（moonbitlang/async 运行时访问）
  接受 mooncakes 坐标：moonbitlang/parser/cmd/moonfmt@0.3.3
  缓存：$MOON_HOME/registry/cache/assets
```

- **深度说明**：本地包按 `moon run --target wasm` 运行，或直接运行 mooncakes 上预构建的 wasm 二进制（无需本地构建）。
- **要点**：支持 pin 版本坐标与自动解析最新版；适合快速试跑生态工具（如 moonfmt）。
- **与技能仓库映射**：`moonbit-verify` wasm 类型验证。

## moon clean — 删除 _build

- **深度说明**：清除 `<project-root>/_build`，解决陈旧产物导致的诡异编译错误。
