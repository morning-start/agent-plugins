---
name: moonbit-cd
description: "Use ONLY in a MoonBit project (moon.mod / *.mbt present); do NOT use outside one. Use when deploying or rolling back a MoonBit project — deployment strategy selection, artifact management, rollback planning, and release channel distribution (native binary / wasm / lib). Triggered AFTER evaluate approval, by user phrases like 'deploy', 'rollout', 'release to users', 'publish binary', 'distribute', 'deploy to production', 'set up CD', 'release channels'. Do NOT use for CI pipeline setup (use moonbit-ci) or release readiness (use moonbit-evaluate)."
---

# CD — 持续部署

## 职责

为 MoonBit 项目提供完整持续部署能力。覆盖四个领域：

1. **部署策略** — 蓝绿部署 / 金丝雀 / 滚动更新策略选择与执行
2. **制品管理** — native binary / wasm 模块 / mooncake 包的构建、签名、分发
3. **回滚预案** — 每个部署必须附带回滚计划
4. **发布渠道** — 区分 stable / beta / nightly 渠道的分发策略

**Agent 在 evaluate 批准后执行部署 → 生成部署清单 → 提供回滚预案 → 由用户确认执行。**

## The Iron Law

```
NO DEPLOYMENT WITHOUT ROLLBACK PLAN
```

任何部署操作前必须先生成回滚预案。回滚预案必须包含：回滚触发条件、回滚步骤、回滚后验证命令。没有回滚预案的部署不得执行。

### 可观察信号（机械化自检）

"有回滚预案" 必须满足以下全部信号，否则视为无预案：

- [ ] **回滚触发条件**：明确定义什么情况触发回滚（如错误率 > 5%、`moon run` 失败）
- [ ] **回滚步骤**：具体的 git 命令和部署命令序列（如 `git revert` + 重新构建 + 重新分发）
- [ ] **回滚后验证**：回滚完成后如何验证服务正常（如 `moon run` + `moon test --target native`）
- [ ] **耗时预估算**：回滚各步骤的预估耗时

未满足以上任一信号 → Iron Law 触发：停止，补充回滚预案后再继续。

## Red Flags — STOP and Re-evaluate

If you catch yourself doing any of these, you are violating the CD contract:

- 部署前未验证 evaluate 是否已批准
- 生成部署计划但不包含回滚预案
- 金丝雀部署无自动回滚条件（如错误率阈值）
- 覆盖已有部署配置而不展示 diff
- 直接向生产环境推送未经过 verify 的代码
- 替用户执行部署而不等待用户确认

**All of these mean: Stop. Verify evaluate passed + add rollback plan first.**

## 停止条件

- evaluate 未批准 → 提示先完成 evaluate 验收
- 用户未选择部署策略 → 等待用户输入
- 回滚预案不完整 → 补充回滚预案后再继续
- 缺少分发渠道凭证（如 mooncakes token）→ 提示配置凭证
- 用户说"暂不部署" → 标记部署计划为 pending

## 项目类型与部署策略

> 各类型的部署策略详见 `references/project-type-matrix.md`「部署策略」章节。

## 执行流程

### 1. 验证 evaluate 已批准

```bash
# CD only accepts a schema-valid evaluate approval.
CHECKPOINT_FILE=".agent-workplace/state/checkpoint.json"
if [ ! -f "$CHECKPOINT_FILE" ]; then
  echo "ERROR: $CHECKPOINT_FILE is required before CD"
  exit 1
fi

PYTHON_BIN="${PYTHON_BIN:-python}"
if ! command -v "$PYTHON_BIN" >/dev/null 2>&1; then
  PYTHON_BIN="python3"
fi

EVAL_STATE=$("$PYTHON_BIN" -c "import json; d=json.load(open('$CHECKPOINT_FILE', encoding='utf-8')); print(d.get('phase', 'unknown'), d.get('status', 'unknown'))" 2>/dev/null) || {
  echo "ERROR: invalid pipeline state; run validate-pipeline-state.py"
  exit 1
}
echo "Evaluate state: ${EVAL_STATE}"
if [ "$EVAL_STATE" != "evaluate approved" ]; then
  echo "ERROR: evaluate must approve before CD can proceed"
  exit 1
fi

# 检查工作区干净
git status --porcelain | head -5
```

### 2. 选择部署策略

根据项目类型和风险偏好，选择部署策略：

| 策略 | 适用场景 | 回滚时间 | 风险 |
|------|---------|---------|------|
| **直接发布** | lib / 低风险 | < 1 min | 低 |
| **金丝雀** | cli / 需要生产验证 | 2-5 min | 中 |
| **蓝绿部署** | wasm / 高可用要求 | < 30s | 低 |
| **滚动更新** | ffi / 多实例服务 | 5-15 min | 中 |

**金丝雀部署流程示例（cli 项目）：**

```bash
# 1. 构建制品
moon build --target native
cp target/native/release/build/main ./dist/myapp-v{version}-canary

# 2. 发布金丝雀版本（占 10% 流量）
echo "Deploy canary (10%): myapp-v{version}-canary"
echo "Monitor for 5 min — error rate < 5% and all health checks pass"

# 3. 验证金丝雀
./dist/myapp-v{version}-canary --version
./dist/myapp-v{version}-canary --help | head -3

# 4. 全量发布（金丝雀验证通过后）
echo "Full rollout: myapp-v{version}"
```

### 3. 制品管理

```bash
# 构建目标产物
# lib 项目
moon build --target native
ls target/native/release/build/*.tar 2>/dev/null || echo "lib: mooncake package"

# cli 项目 — 构建可执行文件
moon build --target native
ls target/native/release/build/main 2>/dev/null || echo "cli: check binary"

# wasm 项目 — 构建 wasm 模块
moon build --target wasm-gc
ls target/wasm-gc/release/build/*.wasm 2>/dev/null || echo "wasm: check .wasm output"

# 生成制品清单
echo "Artifact: $(ls target/*/release/build/* 2>/dev/null | head -3)"
echo "Checksum: $(sha256sum target/*/release/build/* 2>/dev/null | head -3)"
```

**制品清单要求：**
- 制品名称和版本号
- SHA256 校验和
- 构建时间戳和工具链版本
- 分发目标（mooncakes / GitHub Releases / CDN）

### 4. 生成回滚预案

每个部署必须附带回滚预案，格式如下：

```markdown
## 回滚预案

### 触发条件
- 错误率 > 5%（部署后 15 分钟内）
- 用户报告关键功能不可用
- `moon run` 无法正常启动

### 回滚步骤
1. `git revert HEAD` — 回退代码
2. `moon build --target {target}` — 重新构建
3. 重新发布制品至对应渠道

### 回滚后验证
1. `moon test --target native` — 全量测试通过
2. `moon run .` — 可执行且输出预期
3. `moon info --target native` — API 表面一致

### 预估耗时
- git revert: < 1 min
- 重新构建: 1-3 min
- 重新分发: 1-5 min
- 总计: < 10 min
```

### 5. 发布渠道配置

| 渠道 | 用途 | 版本规则 | 自动部署 |
|------|------|---------|---------|
| **nightly** | 每日构建 | `{date}+{short_sha}` | 是（CI 触发） |
| **beta** | 预发布验证 | `{version}-beta.N` | 手动 |
| **stable** | 正式发布 | semver | 手动（evaluate 批准后） |

### 6. 生成部署清单

```markdown
## 部署清单

- [x] evaluate 已批准
- [ ] 用户确认版本号: {version}
- [ ] 部署策略: {strategy}
- [ ] 制品已构建并校验
- [ ] 分发渠道: {channel}
- [ ] 回滚预案已生成
- [ ] 用户确认执行部署
```

## 与其它技能的边界

| 技能 | moonbit-cd 不做什么 |
|------|-------------------|
| `moonbit-ci` | 不做 CI 流水线配置（ci 只到构建阶段） |
| `moonbit-evaluate` | 不判定"可发布"（evaluate 负责验收 + SemVer） |
| `moonbit-verify` | 不替代验证门禁（verify 负责质量门禁） |
| `moonbit-docs` | 不维护 CHANGELOG 和 release notes（docs 负责维护；evaluate 负责校验） |

## 用户 vs Agent 分工

| 谁 | 做什么 |
|---|--------|
| **Agent** | 验证 evaluate 批准、选择部署策略、管理制品、生成回滚预案、生成部署清单 |
| **用户** | 选择部署策略、确认执行部署、配置分发凭证、监控部署后状态、触发回滚（如需） |

## 输出

```json
{
  "status": "deployment_planned | deployed | rollback_planned",
  "project_type": "cli",
  "deployment": {
    "strategy": "canary",
    "artifact": "myapp-v1.2.3-linux-x86_64",
    "checksum": "sha256:a1b2c3d4e5f6...",
    "channel": "stable"
  },
  "rollback_plan": {
    "trigger": "error_rate > 5%",
    "steps": ["git revert HEAD", "moon build --target native", "re-distribute"],
    "estimated_duration": "10 min"
  },
  "user_approval_required": true,
  "next": "monitor | implement (hotfix)"
}
```

## 错误恢复

| 问题 | 诊断 | 修复 |
|------|------|------|
| evaluate 未批准 | 管线状态文件显示验证失败 | 返回 evaluate 完成验收 |
| 构建失败 | `moon build` 报错 | 修复构建错误后重试 |
| 分发失败 | 凭证缺失或网络错误 | 检查凭证配置和网络连接 |
| 部署后发现 bug | 生产环境问题 | 执行回滚预案 → 创建 hotfix 分支 → 回到 implement 修复 |
| 回滚失败 | git conflict 或构建失败 | 手动介入，选择上一个已知良好的 tag 回退 |
| 缺少分发凭证 | mooncakes token 未配置 | 提示用户配置 `MOONCAKES_TOKEN` 环境变量 |

## 下一步

部署完成或用户说"回滚"后，如果需要修复部署中发现的问题，回到 `moonbit-implement`（Bug Fix Mode）修复。如果部署成功，进入生产监控阶段（参见 `references/patterns/observability.md`）。
