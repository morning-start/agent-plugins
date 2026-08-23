# 验证命令参考

> 本文件是 MoonBit 验证命令序列的**单一权威源**。技能文件引用本文件，不重复内联命令。
> 格式规范：各命令序列均有名称标签，技能中用 `引用 verification-commands.md「序列名」` 引用。

---

## 命名序列

### full-verify — 全量验证（所有项目必选）

```bash
moon fmt --check && moon check --warn-list +73 && moon test
```

**用途**：TDD VERIFY 阶段、任务验收、批次检查点、pre-push hook
**引用处**：implement、task、writing-plans、verify、code-review

### full-verify-native — 全量验证（native 目标）

```bash
moon fmt --check && moon check --warn-list +73 && moon test --target native
```

**用途**：默认目标验证、CI 流水线
**引用处**：evaluate、moonbit-ci

### full-verify-with-info — 全量验证 + API 签名

```bash
moon fmt --check && moon check --warn-list +73 && moon test --target native && moon info --target native
```

**用途**：发布前验证、evaluate 验收
**引用处**：evaluate、cd

### fmt-check — 格式检查（L1 轻度）

```bash
moon fmt --check
```

**用途**：pre-commit hook、快速检查
**引用处**：init、verify

### type-check — 类型检查

```bash
moon check --warn-list +73
```

**用途**：pre-commit hook、类型安全验证
**引用处**：init、verify

### api-surface — API 签名检查

```bash
moon info --target native
```

**用途**：C1 验证（API 稳定性）、文档生成、重构安全检查
**引用处**：verify、evaluate、docs、cd

### api-surface-diff — API 变更检测

```bash
moon info --target native && git diff --exit-code
```

**用途**：C1 验证 — 检测公共 API 是否发生变化
**引用处**：verify、evaluate

### cross-platform-check — 跨平台验证

```bash
moon check --target all
```

**用途**：E1 增强验证（跨平台兼容）
**引用处**：verify、evaluate

### debug-chain — 调试链（失败诊断）

```bash
moon test --target native 2>&1 | tail -50
moon check --target native --warn-list +73 2>&1
moon explain --diagnostic E####
```

**用途**：测试失败或类型错误时的诊断流程
**引用处**：implement、verify

### dep-verify — 依赖变更验证

```bash
moon add <pkg> && moon check && moon test && moon-audit
```

**用途**：依赖管理契约 — 添加/更新依赖后的完整验证链
**引用处**：implement、security

### audit-scan — 安全审计

```bash
moon-audit pipeline .
```

**用途**：E2 增强验证（安全审计）
**引用处**：verify、security、init

### consumer-verify — 消费者编译验证（lib 项目）

```bash
# 创建临时 consumer 包
mkdir -p /tmp/moonbit-consumer && cd /tmp/moonbit-consumer
moon new --lib consumer && moon add <target-pkg>
echo 'fn main { ... }' > consumer/main.mbt
moon check --target native
```

**用途**：C3 验证 — lib/ffi/wasm/parser/async 项目的消费验证
**引用处**：verify、evaluate

### run-verify — 可执行验证（main 项目）

```bash
moon run .
```

**用途**：C2 验证 — main/cli 项目的运行验证
**引用处**：verify、evaluate

---

## 常用工具命令

| 命令 | 用途 | 引用处 |
|------|------|--------|
| `moon add minie135/moon-audit` | 安装安全审计工具 | verify、evaluate、init、security、implement |
| `moon explain --diagnostic E####` | 解释编译器错误码 | implement、verify、code-review、task |
| `moon test -f "test_name"` | 运行单个测试 | implement、task、writing-plans |
| `moon test --update` | 刷新快照测试 | testing |
| `moon coverage analyze > uncovered.log` | 查看未覆盖代码 | verify |
| `moon ide peek-def` / `find-references` | 语义导航 | implement、refactor |
