# 解析器模式

## 适用场景
解析结构化文本格式：TOML、JSON、YAML、CSV、自定义 DSL。

## 架构（递归下降 + 分层）
```
Text → Lexer (字符级) → Tokenizer (词法) → Parser (语法) → AST → Validate → Serialize
```

## 目录结构
```
src/
├── internal/
│   ├── tokenize/    # 词法分析器
│   │   ├── moon.pkg
│   │   ├── tokenize.mbt
│   │   └── token.mbt
│   └── moon.pkg
├── parser.mbt       # 递归下降解析器
├── lib.mbt          # 公共 API + 类型定义
├── lib_utils.mbt    # 工具函数
├── lib_to_string.mbt # 序列化
├── moon.pkg
├── lib_test.mbt     # 测试
├── lib_valid_test.mbt   # 有效输入测试
├── lib_invalid_test.mbt # 无效输入测试
└── README.mbt.md    # 可执行文档
```

## 测试策略

测试文件组织和命名约定详见 [`references/testing.md`](../testing.md)。

本项目类型要点:
- `lib_valid_test.mbt` + `lib_invalid_test.mbt` 按输入类别分文件

示例结构:
```
src/
├── internal/
│   ├── tokenize/    # 词法分析器
│   │   ├── moon.pkg
│   │   ├── tokenize.mbt
│   │   └── token.mbt
│   └── moon.pkg
├── parser.mbt       # 递归下降解析器
├── lib.mbt          # 公共 API + 类型定义
├── lib_utils.mbt    # 工具函数
├── lib_to_string.mbt # 序列化
├── moon.pkg
├── lib_test.mbt     # 测试
├── lib_valid_test.mbt   # 有效输入测试
├── lib_invalid_test.mbt # 无效输入测试
└── README.mbt.md    # 可执行文档
```

## 关键模式
- 两阶段设计: parse(全接受) → validate(语义检查)
- 标记状态: `\u0000` 前缀哨兵键
- 零拷贝 Token View: `ArrayView[Token]`
- 二义性在词法层解决

## 依赖
- `bobzhang/lexer` (可选，字符级词法基础)
- `moonbitlang/quickcheck` (属性测试)

## 参考项目
- bobzhang/toml (34 文件, 98.8% 合规率, 745 测试)