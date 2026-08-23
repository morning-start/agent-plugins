---
name: moonbit-security
description: "Use ONLY in a MoonBit project (moon.mod / *.mbt present); do NOT use outside one. Use when designing or reviewing security for a MoonBit project — threat modeling, dependency vulnerability scanning, security design review, and security audit integration. Triggered by user phrases like 'security review', 'threat model', 'security audit', 'vulnerability scan', 'secure design', 'dependencies check', '安全审计', '安全设计', '依赖扫描'. Also triggered when verify E2 reports security findings. Do NOT use for verification gate checks (use moonbit-verify E2) — this skill is about SECURITY-BY-DESIGN, not final audit."
---

# Security — 安全左移

## 职责

为 MoonBit 项目提供设计阶段和开发阶段的安全保障。覆盖四个领域：

1. **威胁建模** — 在设计阶段识别安全风险（STRIDE 方法）
2. **安全设计审查** — 在代码审查前检查 API 和架构的安全性
3. **依赖漏洞扫描** — 检查第三方依赖的已知漏洞
4. **安全审计集成** — 对接 `moon-audit` 工具链

**Agent 在设计阶段介入 → 执行威胁建模 → 安全设计审查 → 依赖扫描 → 输出安全评估报告。**

## The Iron Law

```
SECURITY BY DESIGN, NOT BY AUDIT
```

安全必须在设计和开发阶段介入，不能只依赖最终的审计门禁。每个设计决策都应包含安全考量。威胁建模在架构确定后、实现开始前完成。

### 可观察信号（机械化自检）

"安全已左移" 必须满足以下全部信号，否则视为未执行安全设计：

- [ ] **威胁建模已完成**：对主要数据流和安全边界执行了 STRIDE 分析
- [ ] **安全需求已记录**：威胁缓解措施已写入设计文档
- [ ] **依赖已扫描**：所有第三方依赖已检查已知漏洞
- [ ] **审计命令可运行**：`moon-audit pipeline .` 可执行且输出可用

未满足以上任一信号 → Iron Law 触发：停止，补充安全设计后再继续。

## Red Flags — STOP and Re-evaluate

If you catch yourself doing any of these, you are violating the security contract:

- 替用户决定安全风险可接受度（只报告风险，让用户决策）
- 在实现完成后才做威胁建模（应在实现前完成）
- 声称"这个小项目不需要安全"
- 不检查依赖的许可证合规性
- 跳过输入验证和数据清理的设计审查
- 使用不安全的默认配置（如禁用认证、开放访问）

**All of these mean: Stop. Apply security design first.**

## 停止条件

- 项目尚无架构设计 → 先执行 `moonbit-plan` 再回来做安全
- `moon-audit` 不可用 → 报告缺失，安全审查降级为手动检查
- 用户明确表示"不需要安全审查" → 标记为 skipped，记录风险接受
- 依赖扫描发现 CVSS >= 7.0 的漏洞 → 阻断建议，报告用户决策

## 执行流程

### 1. 威胁建模（STRIDE）

在设计阶段对项目进行 STRIDE 威胁建模：

| 威胁类别 | 含义 | MoonBit 典型场景 | 缓解措施 |
|---------|------|-----------------|---------|
| **S**poofing（欺骗） | 伪造身份或数据 | 输入验证不足导致的数据注入 | 严格输入校验 + 类型约束 |
| **T**ampering（篡改） | 修改数据或代码 | FFI 调用的未校验外部数据 | 边界数据验证 + 安全检查 |
| **R**epudiation（抵赖） | 用户否认操作 | 缺少审计日志 | 结构化日志记录关键操作 |
| **I**nformation Disclosure（信息泄露） | 敏感数据暴露 | 错误处理泄露内部信息 | 统一的错误响应格式 |
| **D**enial of Service（拒绝服务） | 服务不可用 | 未限制资源消耗的递归/循环 | 输入大小限制 + 超时 |
| **E**levation of Privilege（权限提升） | 越权操作 | 错误的访问控制 | 最小权限原则 + 权限校验 |

**威胁建模步骤：**

```moonbit
/// Step 1: 识别资产
/// - 输入数据（文件、网络请求）
/// - 配置（密钥、token）
/// - 输出数据（计算结果、API 响应）

/// Step 2: 绘制数据流图
/// 外部实体 → 处理函数 → 数据存储
/// 每个数据流跨越安全边界时标记

/// Step 3: 应用 STRIDE 逐项检查
/// 每项威胁评估：可能性 (1-3) × 影响 (1-3) = 风险分数

/// Step 4: 记录缓解措施
/// 每项高/中风险威胁必须有对应的缓解措施
```

### 2. 安全设计审查清单

在设计审查和代码审查中检查以下项目：

#### 输入验证

- [ ] 所有外部输入（文件、网络、环境变量）有类型约束和长度限制
- [ ] FFI 边界数据有校验逻辑（非 `unsafe` 直接传递）
- [ ] 反序列化使用类型安全的解析器（如 `@toml`、`@json`）
- [ ] 正则表达式输入有长度限制（防止 ReDoS）

#### 认证与授权

- [ ] 敏感操作有权限校验
- [ ] token / API key 不硬编码在代码中，通过环境变量注入
- [ ] 默认拒绝（whitelist）模式

#### 数据保护

- [ ] 敏感数据（密码、密钥）不在日志中输出
- [ ] 临时文件不使用可预测的名称和路径
- [ ] 内存中的敏感数据用完即清理（`unsafe` 覆盖）

#### 错误处理

- [ ] 错误信息不泄露内部实现细节
- [ ] 未捕获的 panic 有全局兜底
- [ ] 内部错误与用户可见的错误分离

### 3. 依赖漏洞扫描

```bash
# 扫描依赖的已知漏洞
if command -v moon-audit &> /dev/null; then
  moon-audit pipeline .
else
  echo "WARNING: moon-audit not installed — manual dependency check required"
  echo "Install with: moon add minie135/moon-audit"
fi

# 检查 moon.mod 中的依赖列表
if [ -f moon.mod ]; then
  echo "=== 依赖清单 ==="
  cat moon.mod | head -20
  echo "=== 许可证检查 ==="
  # 列出所有依赖及其许可证（手动确认）
fi
```

**依赖管理要点：**
- 记录每个依赖的版本和许可证
- 检查依赖是否有已知 CVE（通过手动查阅或集成工具）
- 依赖版本尽量使用精确版本而非范围版本

### 4. 安全审计日志

```moonbit
/// 审计日志记录（安全关键操作）
pub fn audit_log(action : String, user : String, resource : String, result : String) -> Unit {
  let ts = @time.now().to_string()
  println("[AUDIT] {ts} {user} {action} {resource}: {result}")
  // 生产环境中应输出到独立的审计日志流
}
```

**安全关键的审计事件：**
- 配置变更
- 权限变更
- 敏感数据访问
- 认证成功/失败
- 外部网络请求（出站）
- 文件系统操作

## 项目类型与安全重点

> 各类型的安全重点详见 `references/project-type-matrix.md`「安全重点」章节。

## 与其它技能的边界

| 技能 | moonbit-security 不做什么 |
|------|-------------------------|
| `moonbit-verify` | 不替代 verify E2 最终审计门禁（E2 只做门禁检查） |
| `moonbit-cd` | 不做部署安全配置（部署安全由 cd 承载） |
| `moonbit-design` (plan) | 不做架构设计（security 在设计之上叠加安全视角） |
| `moonbit-docs` | 不写安全文档（但安全设计结果应记录到 ADR） |

## 用户 vs Agent 分工

| 谁 | 做什么 |
|---|--------|
| **Agent** | 执行威胁建模（STRIDE）、安全设计审查、依赖漏洞扫描、生成安全评估报告 |
| **用户** | 确认威胁缓解措施、决定是否接受风险、配置 moon-audit、审查 CVSS >= 7.0 的漏洞 |

## 输出

```json
{
  "status": "security_reviewed | skipped | blocked",
  "project_type": "cli",
  "threat_modeling": {
    "method": "STRIDE",
    "threats_identified": 5,
    "high_risk": 1,
    "medium_risk": 3,
    "low_risk": 1,
    "threats": [
      {"category": "T", "description": "日志文件中可写入任意内容", "risk": "high", "mitigation": "限制日志输入长度+过滤控制字符"}
    ]
  },
  "dependency_scan": {
    "dependencies_count": 3,
    "vulnerabilities_found": 0,
    "license_issues": 0
  },
  "design_review": {
    "checks_passed": 8,
    "checks_failed": 1,
    "failures": ["输入验证: 缺少正则表达式长度限制"]
  },
  "moon_audit_available": true,
  "next": "implement | plan (redesign)"
}
```

## 错误恢复

| 问题 | 诊断 | 修复 |
|------|------|------|
| `moon-audit` 不可用 | command not found | 提示安装，安全审查降级为手动检查 |
| 依赖扫描发现高危漏洞 | CVSS >= 7.0 | 报告漏洞详情，建议修复版本或替代库 |
| 威胁建模发现设计缺陷 | 高风险 STRIDE 威胁 | 返回 `moonbit-plan` 重新设计架构 |
| 安全审查与用户意图冲突 | 用户拒绝实施缓解措施 | 记录用户风险接受决策，标记为 accepted_risk |

## 下一步

安全审查完成后，Agent 通常回到 `moonbit-implement` 继续开发，或回到 `moonbit-plan` 修订设计以解决发现的威胁。在 verify 阶段，`moon-audit pipeline .` 作为 E2 安全门禁执行最终检查。
