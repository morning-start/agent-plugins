# MoonBit Skills

工程化 MoonBit 开发技能集合：Agent 执行流程，用户决定架构和发布。

## 工作流

```text
plan → scaffold → implement → verify → evaluate
```

- `plan/`：澄清需求、选择主类型和能力、设计架构与 API
- `scaffold/`：从 `templates/` 生成最小可验证项目
- `implement/`：按任务执行 TDD；调试包含有限修复循环
- `verify/`：格式、类型、测试、API 信息和安全审计门禁
- `evaluate/`：最终验收、README/CI 准备和发布清单

## 支持类型

- `lib`
- `cli`
- `c-ffi`
- `wasm`

`parser` 和 `async` 是能力维度：使用 `lib` 或 `cli` 作为主类型，再添加对应依赖和目录。

## 插件入口

- Claude Code：`.claude-plugin/plugin.json`
- Codex：`.codex-plugin/plugin.json`
- Hooks：`hooks/hooks.json`

SessionStart 会注入 `skills/plan/SKILL.md`。PreCommit 和 PreCompletion 会执行 MoonBit 基础检查；非 MoonBit 项目会跳过。发布或 CI 可设置 `MOONBIT_STRICT_AUDIT=1`，在 `moon-audit` 不可用时阻断。

## 评估

持久化用例和 assertions 位于 `evals/evals.json`。生成的结果放在被忽略的 `workspace/`，清理和目录约定见 `scripts/README.md`。

运行插件元数据一致性检查：

```bash
python scripts/check-plugin-metadata.py
```

## 已知边界

- MoonBit 工具链必须由使用者安装并保持版本兼容。
- `c-ffi` 需要用户提供真实 C 库 API、头文件和 ABI 约束。
- `wasm-gc` 验证取决于当前 MoonBit 工具链是否支持该 target。
- `moon-audit` 不可用时，默认本地提交允许 warning；严格模式会阻断。
