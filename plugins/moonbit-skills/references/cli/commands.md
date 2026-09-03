# MoonBit 命令参考

> 本文件是**常用命令速查**；全量命令的深度说明（用法/选项/与技能映射）见 [`reference/overview.md`](reference/overview.md) 及 `reference/` 下各主题文件。命令以实际 `moon --help` 为准。

## 核心命令

```bash
# 类型检查
moon check --target native --warn-list +73
# 失败: moon explain --diagnostic E####

# 运行测试
moon test --target native
# 失败: moon test --target native -f "test_name"
# 过滤: moon test --target native -f "test_name"

# 格式化
moon fmt --check
# 失败: moon fmt  # 自动修复

# 包信息
moon info --target native
# 失败: 先 moon check 确保类型正确
```

## 运行命令

```bash
# 运行主包（当前目录）
moon run .

# 运行子目录中的主包
moon run cmd/main

# 从标准输入运行代码（快速实验）
echo 'fn main { println("Hello!") }' | moon run -

# 从命令行参数运行代码（单行）
moon run -e 'fn main { println("Hello, MoonBit!") }'

# 多行代码运行
moon run --target native -e "$(cat <<'EOF'
fn main {
  println("Hello, MoonBit!")
}
EOF
)"

# 构建项目
moon build --target native
# 构建所有目标: moon build --target all
```

## 项目命令

```bash
# 创建新项目
moon new my-package

# 添加依赖
moon add moonbitlang/quickcheck
# 升级已有依赖: moon add --upgrade moonbitlang/quickcheck

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

# 并行运行测试（0.8.0+）
moon test -j 4

# 列出所有待运行测试（0.8.0+）
moon test --outline

# 运行指定范围测试（0.8.0+，左闭右开）
moon test --index 0-2

# 性能剖析（0.10.0+，macOS 调用 xctrace，Linux 支持）
moon test --profile
moon run --profile

# CLI 应用集成测试（0.10.0+）
moon cram test

# 证明验证（0.9.0+，需 moon.pkg 启用 proof-enabled）
moon prove
```

## 脚本命令

```bash
# 直接执行临时脚本（0.9.2+）
moon run -e 'fn main { println("hello") }'

# 从标准输入运行（0.8.3+）
echo 'fn main {println("hello")}' | moon run -

# 多行 heredoc
moon run - <<'EOF'
fn main {
  println("Hello, MoonBit!")
}
EOF
```

## 新后端命令

```bash
# 启用新 MoonBit native 后端（0.10.0+，macOS Apple Silicon / Linux x86-64 / Windows MSVC）
export MOONBIT_NEW_NATIVE=1
moon build --target native

# 禁用新 native 后端，使用 C 后端
export MOONBIT_NEW_NATIVE=0
moon build --target native

# 运行 WASM 包（0.10.0+）
moon runwasm Yoorkin/cowsay -- hello

# 限制错误/警告数量（0.10.0+）
moon check --diagnostic-limit 20

# 将警告视为错误（0.10.4+）
moon check --deny-warn
```

## 工作区命令

```bash
# 创建工作区（0.9.0+）
moon work init

# 添加模块到工作区（0.9.0+）
moon work use path/to/module

# 同步工作区版本（0.9.0+）
moon work sync

# 指定 moon.work 文件位置（0.9.2+）
export MOON_WORK=path/to/moon.work

# 关闭 workspace 行为（0.9.2+）
export MOON_WORK=off
```

## 包管理命令

```bash
# 添加依赖（0.10.0+ 再次添加已有依赖只警告，不隐式更新）
moon add moonbitlang/quickcheck

# 显式更新依赖（0.10.0+）
moon add --upgrade moonbitlang/quickcheck

# 安装包（0.10.4+ 推荐显式指定包名）
moon install moonbitlang/quickcheck

# 全局安装可执行程序（0.8.0+）
moon install moonbitlang/quickcheck
```

## 配置迁移

```bash
# 自动迁移 moon.mod.json → moon.mod（0.10.0+）
moon fmt

# 自动迁移 moon.pkg.json → moon.pkg（0.10.0+）
moon fmt

# 迁移 options("is-main": true) → pkgtype(kind: "executable")
# 手动修改 moon.pkg:
#   pkgtype(kind: "executable")

# 迁移 options("native-stub": [...]) → pkgtype(kind: "foreign_library")
# 手动修改 moon.pkg:
#   pkgtype(kind: "foreign_library")
```

## 诊断命令

```bash
# 发现新 API（0.10.0+）
moon ide doc '<query>'

# 文件结构概览
moon ide outline

# 查找引用
moon ide find-references <symbol>

# 语义重命名（同名符号加 --loc）
moon ide rename <symbol> <new_name> --loc filename:line:col

# 警告 79: 检查需要添加 extend 的 impl（0.10.4+）
moon check --warn-list +79
```

## 错误码速查

错误码统一管理在 [`references/errors/error-codes.json`](../errors/error-codes.json)，字段格式与维护流程见 [`error-codes-schema.md`](../errors/error-codes-schema.md)，用结构化 JSON 格式存储，方便程序化查询和自动修复。

```bash
# 查看具体错误码的详细解释
moon explain --diagnostic E0002
```