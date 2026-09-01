# 项目类型矩阵

> 本文件是 MoonBit 项目类型→需求映射的**单一权威源**。
> 技能文件引用本文件的对应章节，不重复内联类型表格。
> 类型检测逻辑详见 `references/type-detection.md`。

---

## 类型总览

| 类型 | 项目分类 | `moon.pkg` 标识 | preferred_target | 推荐架构 |
|------|---------|----------------|-----------------|---------|
| **lib** | library | 无 `pkgtype` | `native` | 简单模块 + 最小 API |
| **cli** | main | `pkgtype(kind: "executable")` | `native` | `main.mbt` (@argparse) + `lib.mbt` |
| **ffi** | library | 无 `pkgtype` | `native` | 四层 FFI (L0→L1→L2→L3)，`with_closed_*` RAII |
| **wasm** | library | 无 `pkgtype` | `wasm` | 四层 FFI，`extern "wasm"` + 内存操作 |
| **parser** | library | 无 `pkgtype` | `native` | 递归下降 + 分层（lexer→tokenize→parser→validate） |
| **async** | library | 无 `pkgtype` | `native` | 异步运行时（event_loop→task→io→socket→http） |

---

## 验证需求（verify 引用）

> 引用处：`moonbit-verify`

| 类型 | 基础测试（B） | Custom 测试（C） | 增强测试（E） | C1 API 稳定性 | C2 运行验证 | C3 消费验证 |
|------|--------------|-----------------|--------------|:---:|:---:|:---:|
| **lib** | B1-B4 | C1 + C3 | E1-E6 | ✅ | — | ✅ |
| **cli** | B1-B4 | C1 + C2 | E1-E6 | ✅ | ✅ | — |
| **ffi** | B1-B4 | C3 | E2-E6 | — | — | ✅ |
| **wasm** | B1-B4 | C3 | E1-E6 | — | — | ✅ |
| **parser** | B1-B4 | C1 + C3 | E1-E6 | ✅ | — | ✅ |
| **async** | B1-B4 | C1 + C3 | E1-E6 | ✅ | — | ✅ |

验证命令详见 `references/verification-commands.md`。

---

## TDD 策略

| 类型 | 验证目标 | 额外验证 | 文档要求 |
|------|---------|---------|---------|
| **lib** | `moon test --target native` | `moon check --target all` 跨平台 | pub fn 有 docstring |
| **cli** | `moon test --target native` | `moon run .` 验证可执行 + stdout 输出 | README 用法示例与实际输出一致 |
| **ffi** | `moon check --target native` | — | FFI 函数有使用说明 |
| **wasm** | `moon test --target wasm` | `moon check --target wasm-gc` | WASM 导出函数有文档 |
| **parser** | `moon test --target native` | valid/invalid/edge 分类测试 | 输入格式有说明 |
| **async** | `moon test --target native` | 并发测试、超时测试 | 并发模型有说明 |

---

## 测试策略（testing 引用）

> 引用处：`moonbit-testing`

| 类型 | 测试文件 | 分类 | 特殊关注 |
|------|---------|------|---------|
| **lib** | `lib_test.mbt` | valid/invalid/edge | 公共 API 覆盖 |
| **cli** | `lib_test.mbt` | 单元+集成 | 命令解析、stdout |
| **ffi** | `lib_test.mbt` | 内存安全 | alloc/free 对 |
| **wasm** | `lib_test.mbt` | 内存操作 | WASI 调用边界 |
| **parser** | `lib_valid_test.mbt` + `lib_invalid_test.mbt` | valid/invalid/edge | 官方测试套件 |
| **async** | `lib_test.mbt` | 并发/超时 | 协程取消 |

---

## 发布策略

| 类型 | 发布方式 | 专属验证 |
|------|---------|---------|
| **lib** | mooncake 包 | 临时 consumer 编译 + `moon check --target all` |
| **cli** | 可执行文件 + mooncake | `moon run .` + 输出验证 |
| **ffi** | mooncake 包 | 临时 consumer 编译 + ASan（可选） |
| **wasm** | WASM 模块 + mooncake | `moon check --target wasm-gc` |
| **parser** | mooncake 包 | `moon test -f "valid/invalid/edge"` |
| **async** | mooncake 包 | 并发测试、超时测试 |

---

## 部署策略

| 类型 | 制品类型 | 推荐部署策略 | 分发渠道 |
|------|---------|-------------|---------|
| **lib** | mooncake 包 | 直接发布（单一版本） | mooncakes.io |
| **cli** | native binary | 金丝雀 / 滚动更新 | GitHub Releases + 包管理器 |
| **wasm** | wasm 模块 | 蓝绿部署 | CDN + 版本化管理 |
| **ffi** | 动态库/静态库 | 滚动更新 | 包管理器 + 版本化 |
| **parser/async** | mooncake 包 | 直接发布（单一版本） | mooncakes.io |

---

## 文档需求

| 类型 | 文档要求 |
|------|---------|
| **lib** | pub fn docstring + README + CHANGELOG + ADR（按需） |
| **cli** | README + CLI --help + CHANGELOG + ADR（按需） |
| **ffi** | FFI 绑定说明 + 编译依赖 + 平台兼容性 |
| **wasm** | WASM 接口文档 + 运行时要求 |
| **parser** | 语言/格式规范文档 + 示例 |
| **async** | 并发模型说明 + 超时/错误行为 |

---

## 安全重点

| 类型 | 重点关注 |
|------|---------|
| **lib** | 输入验证、反序列化安全、API 权限设计 |
| **cli** | 环境变量注入、文件路径遍历、子进程安全 |
| **wasm** | 宿主环境安全边界、内存安全、沙箱逃逸 |
| **ffi** | 缓冲区溢出、指针安全、C 库已知漏洞 |
| **parser** | ReDoS、输入大小限制、编码处理 |
| **async** | 竞争条件、死锁、资源泄露 |

---

## Git Hooks 配置

| 类型 | pre-commit (L1) | pre-push (L2) |
|------|----------------|---------------|
| **lib** | `moon check --target native` | `moon test --target native` |
| **cli** | `moon check --target native` | `moon test --target native` |
| **ffi** | `moon check --target native` | `moon test --target native`（如有） |
| **wasm** | `moon check --target wasm` + `moon check --target wasm-gc` | `moon test --target wasm` |

---

## 骨架生成（scaffold 引用）

> 引用处：`moonbit-scaffold`

| 类型 | preferred_target | supported_targets | moon.pkg | 主文件 | 特殊文件 |
|------|-----------------|-------------------|----------|--------|---------|
| **lib** | `native` | `["native", "wasm", "js"]` | (empty) | `lib.mbt` | — |
| **cli** | `native` | `["native"]` | `pkgtype(kind: "executable")` | `main.mbt` | — |
| **ffi** | `native` | `["native"]` | (empty) | `ffi.mbt` + `lib.mbt` | `wrapper.c` |
| **wasm** | `wasm` | `["wasm", "wasm-gc"]` | (empty) | `ffi.mbt` | — |

能力扩展模块：

| 能力 | 模块文件 |
|------|---------|
| `parser` | `tokenize.mbt`（lexer）、`parser.mbt`（parser）、`validate.mbt`（validate） |
| `async` | `event_loop.mbt`（event_loop）、`task.mbt`（task）、`io.mbt`（io） |

---

## 需求追问清单（plan 引用）

> 引用处：`moonbit-plan`

| 类型 | 追问 |
|------|------|
| **cli** | 命令/子命令？参数格式？标准 I/O？目标 native-only |
| **ffi** | 链接哪个 C 库？API 数量？alloc/free 对？目标 native-only |
| **wasm** | WASI 版本？需要哪些 WASI 调用？目标 wasm/wasm-gc |
| **parser** | 解析什么格式？版本？需要序列化？有官方测试套件？ |
| **async** | 需要哪些高层服务(HTTP/WebSocket/fs)？需要 TLS？目标 native-only |
| **lib** | 核心功能？API 最小表面？目标 native,wasm,js |
