# 性能剖析模式

## 适用场景

需要量化代码性能、对比实现方案、定位性能瓶颈的场景。MoonBit 性能工具链仍在发展中，本模式聚焦当前可用的测量手段和原则，避免过早优化。

## 核心原则

1. **先测量，再优化**：不凭直觉优化，所有优化决策必须有数据支撑。
2. **对比基线**：优化前后必须有可对比的测量值，无基线的优化无法验证。
3. **测量可观察行为**：测量的是端到端耗时或吞吐量，不是中间层指标。
4. **避免微基准陷阱**：单点微基准易被编译器优化或运行时 JIT 误导，需结合实际场景。
5. **native 为主**：性能测量以 `--target native` 为准，WASM 目标受运行时影响较大，不适合性能基准。

## 可用测量手段

### 1. 系统级计时（最可靠）

```bash
# 单次运行耗时（wall clock）
time moon run .

# 多次取最小值（减少噪声）
min_time=999999
for i in 1 2 3 4 5 7 8 9 10; do
  t=$( { /usr/bin/time -f '%e' moon run . 2>&1 > /dev/null; } 2>&1 )
  if (( $(echo "$t < $min_time" | bc -l) )); then min_time=$t; fi
done
echo "min wall time: ${min_time}s"
```

### 2. moon test 计时（粗粒度）

```bash
# moon test 默认输出每个 test 的通过状态，可用 -v 观察耗时分布
moon test --target native -v 2>&1 | grep -E "test|passed"
```

### 3. 内联计时（精细粒度）

在测试或 main 中插入计时点，输出每个阶段的耗时：

```moonbit
fn main {
  let t0 = @time.now()
  // 待测代码段 A
  let data = load_data()
  let t1 = @time.now()
  // 待测代码段 B
  let result = process(data)
  let t2 = @time.now()
  println("load: \(t1 - t0) ns")
  println("process: \(t2 - t1) ns")
  println("total: \(t2 - t0) ns")
}
```

### 4. inspect! 输出中间状态

用 `inspect!` 输出集合大小、分配计数等可观察指标，辅助定位瓶颈：

```moonbit
test "memory_profile" {
  let result = heavy_computation()
  inspect!(result.len(), content: "1000000")
}
```

## MoonBit 性能注意事项

### 值类型 vs 引用类型

- `struct` 默认值语义，复制成本低，适合小对象和高频分配路径。
- `enum`、`String`、`Array`、`Map` 为引用类型，堆分配有开销。
- 大 `struct` 频繁复制可能比 `enum` 包装的引用更慢，需测量验证。

### 闭包与迭代器

- 闭包捕获变量会引入隐式堆分配，热路径慎用。
- `for x in iter` 语法糖生成的迭代器可能比手写 `while` + 索引慢，性能敏感场景对比两种写法。

### 字符串操作

- `String` 拼接 `s1 + s2` 会分配新字符串，循环拼接是常见瓶颈。
- 大量拼接考虑 `StringBuilder`（`@fmt.StringBuilder`）或预分配 `Array[Byte]` 再转 `String`。

### 错误处理开销

- MoonBit 的错误处理无异常栈展开开销，`raise`/`try` 在性能上等价于 early return。
- 性能敏感路径无需为错误处理让步，但避免在热循环中频繁构造 `Result::Err` 包装。

## 基准测试组织

测试文件组织和命名约定详见 [`references/testing.md`](../testing.md)。

本项目类型要点:
- `bench_test.mbt` 独立性能测试，`bench_` 前缀过滤

```
src/
├── main.mbt              # 正常实现
├── lib.mbt               # 核心逻辑
├── lib_test.mbt          # 功能测试
└── bench_test.mbt        # 性能测试（命名隔离，便于过滤）
```

- 命名约定：`bench_<scenario>_<variant>`，如 `bench_sort_baseline`、`bench_sort_optimized`。
- 用 `moon test --target native -f "bench_"` 过滤运行。
- 每个 bench 测试输出固定格式的耗时行，便于脚本解析对比。

## 对比基线工作流

```bash
# 1. 在优化前记录基线（保存输出）
moon test --target native -f "bench_" 2>&1 | tee /tmp/bench_before.txt

# 2. 实施优化

# 3. 重新测量
moon test --target native -f "bench_" 2>&1 | tee /tmp/bench_after.txt

# 4. 对比
diff /tmp/bench_before.txt /tmp/bench_after.txt
```

## 与 verify 集成

- `verify` E3 检查项记录测试时间，可作为性能回归的粗粒度信号。
- 若 bench_test.mbt 的耗时显著退化（> 20%），应在 code-review 阶段提示。
- 性能基线数据不纳入硬性门禁，避免环境噪声导致误报。

## 未来工具规划（待生态稳定）

MoonBit 官方尚未发布标准化的 bench 工具（如 `moonbench` 或 `@bench` 属性）。以下为预期方向，待官方推出后补充：

- `@bench` 属性或 `bench "name" { ... }` 块：声明式基准测试。
- `moon bench --target native`：运行基准并输出标准化报告（mean、p50、p99、标准差）。
- CI 集成：性能回归自动报警，与 git history 对比。

> 当前不应自行实现 bench 框架，避免与未来官方工具冲突。性能测量以本文档的计时手段为准。

## 反模式

- **过早优化**：无测量数据的"性能改进"通常引入复杂度而无收益。
- **单次测量**：单次运行受系统噪声影响大，至少取 5-10 次的最小值。
- **微基准神话**：在隔离环境测得的"快 3 倍"可能在真实场景被其他瓶颈掩盖。
- **WASM 性能比较**：WASM 目标的性能数据受宿主运行时影响，不可作为 native 性能的依据。
- **优化不可观察行为**：优化编译器已自动处理的代码（如常量折叠）无实际收益。
