# MoonBit 命令参考

## 核心命令

```bash
# 类型检查
moon check --target native --warn-list +73
# 失败: moon check --explain E####

# 运行测试
moon test --target native
# 失败: moon test --target native -- --show-output
# 过滤: moon test --target native -f "test_name"

# 格式化
moon fmt --check
# 失败: moon fmt  # 自动修复

# 包信息
moon info --target native
# 失败: 先 moon check 确保类型正确
```

## 项目命令

```bash
# 创建新项目
moon new my-package

# 添加依赖
moon add moonbitlang/quickcheck
# 失败: moon add moonbitlang/quickcheck --version 0.11.2

# 发布
moon publish
# 前提: moon check --target all 通过
```

## IDE 命令

```bash
# 语义导航（比 grep 更精确）
moon ide find-references <symbol>    # 查找引用
moon ide rename <symbol> <new_name>  # 语义重命名
moon ide outline                     # 文件结构概览
moon ide peek-def <symbol>           # 跳转到定义
moon ide doc                         # 生成文档

# 如果多个符号同名，使用 --loc 定位
moon ide rename <symbol> <new_name> --loc filename:line:col
```

## 测试命令

```bash
# 精确测试过滤
moon test [dirname|filename] --filter 'glob'
# 示例: moon test src/parser/ --filter 'valid*'

# 更新快照测试
moon test --update

# 指定目录
moon test src/parser_test.mbt
```

## 错误码速查

| 代码 | 含义 | 修复 |
|------|------|------|
| E0001 | 语法错误 | 检查标点符号 |
| E0002 | 类型不匹配 | 检查函数签名 |
| E0003 | 未绑定变量 | 检查导入和可见性 |
| E0004 | 缺少模块 | 检查 moon.pkg 导入 |
| E0005 | 可见性错误 | 添加 pub |

```bash
moon check --explain E0002
```