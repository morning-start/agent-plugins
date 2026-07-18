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

## 关键模板
- `templates/lib/moon.mod.json` — 目标: native,wasm,js
- `templates/lib/moon.pkg.json` — 导入: moonbitlang/core
- `templates/lib/lib.mbt` — 主模块
- `templates/lib/test.mbt` — 测试文件

## 测试策略
- 单元测试覆盖所有公共函数
- valid/invalid/edge 分类
- `moon check --target all` 跨平台验证

## 参考项目
- moonbitlang/core (674 文件, 56+ 包)
- bobzhang/toml (34 文件, 3218 行核心)