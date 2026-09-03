# Moon CLI — 格式与文档

> 分类速查见 [`overview.md`](./overview.md)；完整命令↔技能映射见 [`mapping.md`](./mapping.md)。

## moon fmt [PATH]... [-- <ARGS>...] — 格式化源码

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

## moon doc [SYMBOL] — 生成/检索文档

```
Usage: moon doc [OPTIONS] [SYMBOL]
  --serve        启动 web 服务器托管文档
  -b, --bind     服务器地址 [default: 127.0.0.1]
  -p, --port     服务器端口 [default: 3000]
  [SYMBOL]       [已弃用] 查询符号文档；改用 `moon ide doc <SYMBOL>`
```

- **深度说明**：`--serve` 起本地文档服务器；符号查询已迁移到 `moon ide doc`。
- **要点**：文档预览用 `moon doc --target-dir`（老接口）或 `--serve` 浏览。

## moon explain <--diagnostic|--attribute> — 解释诊断码与语言特性

```
Usage: moon explain [OPTIONS] <--diagnostic [<ID_OR_NAME>]|--attribute [<NAME>]>
  --diagnostic [<ID_OR_NAME>]  解释诊断；不带查询则列出全部诊断码与名称
  --attribute [<NAME>]         解释属性；不带查询则列出属性名
```

- **深度说明**：编译器诊断码（如 `E4053`）与语言属性的官方解释入口，无网络依赖。
- **要点**：本仓库错误恢复的统一第一步：`moon explain --diagnostic E####` 定位类型错误。
- **与技能仓库映射**：`moonbit-verify` 错误恢复。

## moon info [PATH]... — 生成公共接口 .mbti

```
Usage: moon info [OPTIONS] [PATH]...
  --target <TARGET>   检查指定后端接口差异，不改变 pkg.generated.mbti 输出
  -p, --package <PKG> 为指定包生成 mbti（与 PATH 互斥）
  [PATH]...           包或文件路径
```

- **深度说明**：为每个包生成 `pkg.generated.mbti`（公共 API 签名文件），是 API 稳定性检查的基础。默认写 canonical backend（模块/工作区 `preferred-backend`，回退 `wasm-gc`）；`--target` 只检查不改写。
- **要点**：`git diff --exit-code pkg.generated.mbti` 用于 API 表面比对（C1/H5 门禁）；跨版本比对决定 SemVer 建议。
- **与技能仓库映射**：`moonbit-verify` **C1**（API 稳定性）。
