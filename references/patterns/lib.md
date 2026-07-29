# 库项目模式

## 适用场景
纯 MoonBit 逻辑库，不依赖外部 C/WASM 代码。

## 架构
```
src/
├── lib.mbt           # 公共 API（最小表面）
├── <domain>.mbt      # 核心实现
├── internal/         # 私有实现
│   ├── moon.pkg
│   └── helper.mbt
├── moon.pkg          # 包配置
├── lib_test.mbt      # 测试
└── README.mbt.md     # 可执行文档
```

## 文件职责
- `lib.mbt` — 公共 API 入口，最小导出表面
- `internal/` — 私有实现，不暴露给外部
- `moon.pkg` — 无 `pkgtype(kind: "executable")` 声明（library 默认）

## 生成决策
- `moon.mod` 定义模块名
- `moon.pkg` 不声明 `pkgtype`（默认 library）
- 目标 `native, wasm, js`：`moon check --target all`

## 测试策略

测试文件组织和命名约定详见 [`references/testing.md`](../testing.md)。

本项目类型要点:
- 单个 `lib_test.mbt` 覆盖公共 API

示例结构:
```
src/
├── lib.mbt           # 公共 API（最小表面）
├── <domain>.mbt      # 核心实现
├── internal/         # 私有实现
│   ├── moon.pkg
│   └── helper.mbt
├── moon.pkg          # 包配置
├── lib_test.mbt      # 测试
└── README.mbt.md     # 可执行文档
```

## 参考项目
- moonbitlang/core (674 文件, 56+ 包)
- bobzhang/toml (34 文件, 3218 行核心)