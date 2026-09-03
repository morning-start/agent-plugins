# CLI 工具模式

## 适用场景
命令行工具，需要参数解析、文件 I/O、进程管理。

## 架构
```
src/
├── main.mbt         # CLI 入口（@argparse）
├── lib.mbt          # 核心逻辑
├── moon.pkg         # 包配置（native-only）
├── lib_test.mbt     # 测试
└── README.mbt.md    # 可执行文档
```

## 文件职责
- `main.mbt` — `fn main` 入口，使用 `@argparse` 解析参数
- `lib.mbt` — 核心逻辑，被 main 引用
- `moon.pkg` — `pkgtype(kind: "executable")` 声明
- `lib_test.mbt` — 单元测试和集成测试

## 生成决策
- `moon.mod` 定义模块名和依赖
- `moon.pkg` 使用 `pkgtype(kind: "executable")`（非 `is_main`）
- 目标 `native-only`：`moon check --target native`、`moon run .`

## 测试策略

测试文件组织和命名约定详见 [`references/testing/testing.md`](../../testing/testing.md)。

本项目类型要点:
- `lib_test.mbt` 含单元和集成测试

## 依赖
- `moonbitlang/core/argparse` — 参数解析
- `moonbitlang/core/fs` — 文件操作
- `moonbitlang/core/sys` — 进程退出

## 参考项目
- toml-parser cmd/toml (102 行, @argparse)
- moonbitlang/core/argparse 自身