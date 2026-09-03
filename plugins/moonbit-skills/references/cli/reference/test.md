# Moon CLI — 测试与基准

> 分类速查见 [`overview.md`](./overview.md)；完整命令↔技能映射见 [`mapping.md`](./mapping.md)。

## moon test [PATH]... — 运行测试

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

## moon bench [PATH]... — 运行基准测试

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

## moon coverage <SUBCOMMAND> — 代码覆盖率

```
Usage: moon coverage <COMMAND>
  analyze  带插桩运行测试并报告覆盖率
  report   生成覆盖率报告
  clean    清理覆盖率产物
```

- **深度说明**：覆盖率三件套：`analyze` 收集数据，`report` 出报告，`clean` 清理。配合构建选项 `--enable-coverage` 使用。
- **要点**：新增命令（近期工具链加入），可用于增强验证的覆盖门禁。
- **与技能仓库映射**：`moonbit-verify` 增强测试候选（覆盖完整性信号）。
