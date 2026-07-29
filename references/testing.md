# 测试参考

## 官方测试机制

- 测试块: `test "name" { ... }`，类型 `() -> Unit raise Error`
- `moon test` 以模块根目录为 CWD
- `"panic"` 前缀测试预期触发 panic
- `moon test --update` 自动更新快照

## 黑盒 vs 白盒测试

| 后缀 | 访问范围 | moon.pkg 字段 |
|---|---|---|
| `_test.mbt` | 黑盒（仅公开成员） | `import` + `test-import` |
| `_wbtest.mbt` | 白盒（全部成员） | `import` + `wbtest-import` |
| 内联 `test` 块 | 白盒（与所在文件一致） | 无需单独文件 |

## 快照测试

- Show 快照: `debug_inspect(x, content="...")`
- JSON 快照: `json_inspect(x, content=[...])`
- 任意快照: `t.write()` + `t.snapshot(filename="...")`
- 快照存于 `__snapshot__/` 目录

## 按项目类型的测试组织

| 类型 | 测试文件组织 |
|---|---|
| lib / cli / wasm / c-ffi | `lib_test.mbt`（黑盒单元测试） |
| parser | `lib_test.mbt` + `lib_valid_test.mbt` + `lib_invalid_test.mbt` |
| performance | `lib_test.mbt` + `bench_test.mbt`（命名前缀 `bench_`） |

## 测试文件命名约定

- 默认: `<lib>_test.mbt`
- 按类别: `<lib>_<category>_test.mbt`（如 `valid`/`invalid`/`edge`）
- 性能: `bench_test.mbt`，测试名 `bench_<scenario>_<variant>`
- 白盒: `<lib>_wbtest.mbt`

## 决策路径

| 场景 | 推荐做法 |
|---|---|
| 新项目起步 | 单个 `lib_test.mbt`，内联 `test` 块 |
| 测试 > 200 行或类别明显 | 按类别拆 `<lib>_<category>_test.mbt` |
| 需要性能回归保护 | 加 `bench_test.mbt`，命名前缀隔离 |
| 必须验证私有实现 | 谨慎使用 `_wbtest.mbt`，优先重构 |
| 跨平台项目 | 同一文件用 `moon test --target native/wasm` |

## 过滤运行

```
moon test src/parser/ --filter 'valid*'
moon test --target native -f "bench_"
moon test --index 0-2
moon test --outline
```

## 核心原则

- 不使用单独 `tests/` 目录，测试文件与被测代码同包同目录
- 单一 `lib_test.mbt` 是默认值，类别差异显著时才分文件
- 黑盒测试优先（验证用户视角），白盒测试克制使用
