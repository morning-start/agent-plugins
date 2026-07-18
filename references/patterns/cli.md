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

## 关键模板
- `templates/cli/moon.mod.json` — 目标: native-only
- `templates/cli/moon.pkg.json` — 导入: @argparse, @fs
- `templates/cli/main.mbt` — CLI 入口
- `templates/cli/test.mbt` — 集成测试

## 测试策略
- 单元测试核心逻辑
- 集成测试 CLI 输出
- `moon test --target native` 为主

## 依赖
- `moonbitlang/core/argparse` — 参数解析
- `moonbitlang/core/fs` — 文件操作
- `moonbitlang/core/sys` — 进程退出

## 参考项目
- toml-parser cmd/toml (102 行, @argparse)
- moonbitlang/core/argparse 自身