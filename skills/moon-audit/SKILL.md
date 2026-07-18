---
name: moon-audit
description: "Static security audit for MoonBit projects — use when the user says 'security', 'audit', 'vulnerability', 'CWE', 'safe', 'is it secure', before publish, after major changes, or as CI gate. Scans 14 CWE rules (XSS, CRLF injection, CORS misconfiguration, Cookie missing attributes, DoS, path traversal, unsafe cast, panic reachable). Install via `moon add minie135/moon-audit`. Run before publish and after any major feature addition."
---

# Moon-Audit — 安全审查

## 职责

对 MoonBit 项目进行静态安全扫描，检测 14 条 CWE 安全规则。**Agent 执行，结果展示给用户。**

## 安装

```bash
# 方式 1: 作为库依赖（推荐）
moon add minie135/moon-audit

# 方式 2: 独立二进制
git clone https://github.com/I3eg1nner/moon-audit.git /tmp/moon-audit
cd /tmp/moon-audit
moon install && moon build --target native
# 二进制位于 _build/native/debug/build/src/main/main.exe
# 复制到 PATH: cp _build/native/debug/build/src/main/main.exe /usr/local/bin/moon-audit
```

## 快速开始

```bash
# 一键全流程（静态扫描 + 验证）
moon-audit pipeline /path/to/project

# 仅静态扫描
moon-audit /path/to/project

# JSON 输出
moon-audit --format json /path/to/project

# SARIF 输出（GitHub Code Scanning）
moon-audit --format sarif -o results.sarif /path/to/project

# 有 Error 漏洞时 exit 1（用于 CI 阻断）
moon-audit --fail-on-error /path/to/project
```

## 规则速查表

### 通用安全规则（6 条）

| CWE ID | 名称 | 默认 | 检测内容 | 修复建议 |
|--------|------|------|---------|---------|
| CWE-676 | unsafe-call | 关闭 | `unsafe_to_*`/`unsafe_from_*`/`unsafe_new` | 用安全类型转换替代 |
| CWE-248 | panic-reachable | 关闭 | 库代码中 `abort("message")` | 返回 `Result` 而非 abort |
| CWE-704 | unsafe-cast | 关闭 | `.cast()` 绕过类型系统 | 使用类型安全的转换 |
| CWE-116 | replace-escaping | 开启 | `String::replace()` 仅替换首次出现 | 用全局替换或专用转义库 |
| CWE-94 | eval-extern | 关闭 | `eval()`/`new Function()` | 避免动态执行 |
| CWE-22 | path-concat | 关闭 | 路径拼接可能导致目录穿越 | 用 `@fs.join_path` 安全拼接 |

### Web 框架规则（8 条，Import 门控）

| CWE ID | 名称 | 门控框架 | 检测内容 | 修复建议 |
|--------|------|---------|---------|---------|
| CWE-79 | cmark-unsafe | cmark | `render(safe=false)` 原始 HTML 注入 | 用 `safe=true` |
| CWE-79 | inner-html | rabbita | `inner_html()` 接收动态内容 | 用安全渲染 |
| CWE-79 | template-injection | mocket/crescent | HTML 响应字符串插值 | 用模板引擎转义 |
| CWE-113 | crlf-injection | 通用 | HTTP 响应头注入动态值 | 校验并过滤换行符 |
| CWE-942 | cors-credentials | mocket/crescent | `credentials=true` 且未限制 Origin | 明确允许的 Origin |
| CWE-614 | cookie-attrs | mocket/crescent | Cookie 缺少 HttpOnly/Secure/SameSite | 添加安全属性 |
| CWE-770 | no-body-limit | crescent | 无请求体大小限制 | 设置 `max_body_size` |
| CWE-346 | ws-origin | mocket/crescent | WebSocket 无 Origin 校验 | 校验 Origin 头 |

## 执行流程

### 1. Pre-check

```bash
# 确认 moon-audit 可用
moon-audit --help 2>&1 | head -3
# 如果失败: 安装 moon-audit（见上）

# 确认项目存在
test -f moon.mod.json && echo "OK" || echo "Not a MoonBit project"
```

### 2. 运行安全扫描

```bash
# 基础扫描
moon-audit /path/to/project

# 带输出格式
moon-audit --format json /path/to/project
```

### 3. 解读结果

```bash
# 查看报告
moon-audit summary /path/to/project
# 按 CWE/OWASP 分类聚合，显示漏洞数量

# 生成修复建议
moon-audit remediate -o fixes.md /path/to/project
# 包含 Before/After 代码示例

# 生成 PoC 验证脚本
moon-audit generate-poc -o poc.md /path/to/project
```

### 4. LLM 辅助分析（可选）

```bash
# 需要配置 .env 中的 API Key
moon-audit llm-analyze --format script /path/to/project
```

## Checkpoint: post-scan

```bash
# 验证扫描是否完成
test -f results.sarif && echo "✅ SARIF 报告已生成" || echo "⚠️ 无 SARIF 报告"
moon-audit summary /path/to/project 2>&1 | head -10
# 预期: 显示漏洞统计
# 如果失败: 检查 moon-audit 是否正确安装
```

## 错误恢复速查表

| 命令 | 诊断 | 修复 | 升级 |
|------|------|------|------|
| `moon-audit /path` | 命令未找到 | 安装 moon-audit: `moon add minie135/moon-audit` | 从 GitHub 源码构建 |
| `moon-audit --format sarif` | 输出文件未生成 | 检查 `-o` 参数路径 | 改用 JSON 格式 |
| `moon-audit --fail-on-error` | exit 1 阻断 CI | 检查漏洞详情，修复后重扫 | 临时关闭 `--fail-on-error` |
| `moon-audit pipeline` | 子命令失败 | `moon-audit /path` 单独运行静态扫描 | 查看工具日志 |
| `moon-audit summary` | 无输出 | 确认项目路径正确 | 运行 `moon-audit /path` 先扫描 |

## 幂等性

本技能可安全重复运行：

- **扫描命令**: 无状态，每次运行产生相同结果（同一工具链版本、同一规则配置下）
- **文件生成**: `-o` 输出文件会覆盖，不影响项目源码
- **配置**: `.moon-audit.json` 不变时，结果可复现

```bash
# Idempotency check: 重复扫描应产生相同结果
moon-audit --format json /path/to/project > /tmp/audit1.json
moon-audit --format json /path/to/project > /tmp/audit2.json
diff /tmp/audit1.json /tmp/audit2.json && echo "✅ 幂等性通过" || echo "⚠️ 结果有差异（可能因外部因素）"
```

## 配置

在项目根目录创建 `.moon-audit.json`：

```json
{
  "rules": {
    "CWE-116/replace-escaping": { "enabled": true, "severity": "error" },
    "CWE-79/cmark-unsafe": { "enabled": true, "severity": "error" },
    "CWE-942/cors-credentials": { "enabled": true, "severity": "error" },
    "CWE-614/cookie-attrs": { "enabled": true, "severity": "warning" },
    "CWE-770/no-body-limit": { "enabled": true, "severity": "warning" },
    "CWE-346/ws-origin": { "enabled": true, "severity": "warning" },
    "CWE-94/eval-extern": { "enabled": false },
    "CWE-79/inner-html": { "enabled": false },
    "CWE-22/path-concat": { "enabled": false }
  },
  "exclude": ["_build", ".mooncakes", "*_test.mbt"]
}
```

## CI 集成

```yaml
# .github/workflows/security.yml
name: Security Audit
on: [push, pull_request]

jobs:
  audit:
    runs-on: ubuntu-latest
    permissions:
      security-events: write
    steps:
      - uses: actions/checkout@v4
      - uses: I3eg1nner/moon-audit@main
        with:
          fail-on-findings: 'true'
          severity: 'error'
          upload-sarif: 'true'
```

## 编程调用

```moonbit
fn check_security(project_path : String) -> Unit {
  let config = @audit.Config::default()
  let result = @audit.scan_project(project_path, config)

  let errors = result.findings.filter(fn(f) { f.severity == @audit.Error })
  if errors.length() > 0 {
    println(@audit.format_text(result, false))
  }
}
```

## 输出

```json
{
  "status": "clean | issues_found | error",
  "findings": [
    {
      "cwe_id": "CWE-113",
      "severity": "error",
      "file": "src/http.mbt:42",
      "description": "CRLF injection in response header"
    }
  ],
  "summary": {
    "total": 3,
    "errors": 1,
    "warnings": 2,
    "info": 0
  }
}
```