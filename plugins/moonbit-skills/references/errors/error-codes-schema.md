# error-codes.json 数据格式规范

本文件定义 [`references/errors/error-codes.json`](./error-codes.json) 的字段格式，供 `moonbit-verify` 及错误码解释按需参考，保持参考文件职责单一。

## 数组结构

- 顶层为数组，每个元素是一个错误码对象
- 按 `code` 字段排序（新错误码追加到对应位置，保持升序）

## 字段定义

| 字段 | 必填 | 类型 | 说明 |
|------|------|------|------|
| `code` | 是 | string | 编译器错误码（如 `E0001`、`E0101`） |
| `warning_name` | 是 | string | 错误的英文标识名（如 `unused_function`、`type_mismatch`） |
| `category` | 是 | string | 错误类别（见下方可选值） |
| `severity` | 是 | string | 严重程度：`error` 或 `warning` |
| `desc` | 是 | string | 错误描述（中文，简洁清晰） |
| `fix` | 是 | string | 修复方案（一句话，可操作） |
| `url` | 否 | string | 官方文档链接（优先补充） |
| `example` | 否 | string | 简短的错误示例代码 |

## category 可选值

| 值 | 含义 |
|----|------|
| `unused` | 未使用相关警告 |
| `type-error` | 类型错误 |
| `type-inference` | 类型推断相关 |
| `pattern-matching` | 模式匹配相关 |
| `syntax` | 语法错误 |
| `name-resolution` | 名称解析错误 |
| `visibility` | 可见性错误 |
| `module` | 模块相关错误 |
| `ffi` | FFI 相关错误 |
| `wasm` | WASM 相关错误 |
| `style` | 代码风格警告 |
| `logic` | 逻辑警告 |
| `compatibility` | 兼容性警告 |

> 完整可选值以 `references/errors/error-codes.json` 现有条目为准。新增类别需在文件顶部注释声明。

## 示例

```json
{
  "code": "E0123",
  "warning_name": "错误的英文标识名",
  "category": "type-error",
  "severity": "error",
  "desc": "两句话描述错误含义",
  "fix": "一句话修复方案",
  "url": "https://docs.moonbitlang.cn/language/error_codes/E0123.html",
  "example": "简短的代码示例（可选）"
}
```

## 维护流程

1. 检查错误码是否已存在（按 `code` 字段查找）
2. 若不存在，按上述格式追加新条目
3. 若已存在但信息不完整，补充缺失字段
4. 更新后用 Node 验证 JSON 格式：
   ```bash
   node -e "JSON.parse(require('fs').readFileSync('references/errors/error-codes.json', 'utf8'))"
   ```
   Windows PowerShell 中若双引号不兼容，使用：
   ```powershell
   node -e "JSON.parse(require('fs').readFileSync('references/errors/error-codes.json', 'utf8'))"
   ```

## 目的

下次遇到相同错误码时，Agent 可以快速查表定位修复，而不需要重新分析。非编译器报错（逻辑错误、API 误用等）不需要记录错误码。
