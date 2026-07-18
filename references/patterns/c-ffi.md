# C FFI 绑定模式

## 适用场景
封装 C/C++ 库，提供 MoonBit 类型安全 API。

## 架构（四层 FFI）
```
L3: Traits — Reader/Writer/Data (模板方法)
L2: 公共 API — 安全封装 + 错误转换
L1: Raw 绑定 — 类型安全包装 + RAII
L0: FFI 原语 — extern "c" 声明
```

## 目录结构
```
src/
├── wrapper.c         # ABI 归一化 + 内存管理
├── ffi.mbt           # L0: extern "c" 声明
├── raw/              # L1: 类型安全包装
│   ├── moon.pkg
│   └── raw.mbt
├── lib.mbt           # L2: 公共 API
├── io/               # L3: Traits (可选)
│   ├── moon.pkg
│   └── io.mbt
├── moon.pkg          # native-stub 配置
├── lib_test.mbt      # 测试
├── README.mbt.md     # 可执行文档
└── scripts/
    └── prepare.py    # 供应商脚本
```

## 关键模板
- `templates/c-ffi/moon.mod.json` — 目标: native-only
- `templates/c-ffi/moon.pkg` — native-stub 配置
- `templates/c-ffi/ffi.mbt` — FFI 声明

## 测试策略
- ASan 验证（Address Sanitizer）
- 内存泄漏检查
- 边界值测试
- `moon test --target native`

## 关键模式
- `with_closed_*` RAII 资源管理
- `wrap()` 层间错误转换
- `malloc → defer free` 手动内存管理
- 类型宽度编译期断言

## 参考项目
- moonbit-community/miniio (23 文件, 4 层架构)
- moonbitlang/async 的 C FFI 部分