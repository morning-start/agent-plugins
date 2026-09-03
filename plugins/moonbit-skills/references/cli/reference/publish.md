# Moon CLI — 账户与发布

> 分类速查见 [`overview.md`](./overview.md)；完整命令↔技能映射见 [`mapping.md`](./mapping.md)。

## moon login / moon whoami / moon register

```
Usage: moon login          # 登录（交互式）
Usage: moon whoami         # 显示登录状态与用户名
Usage: moon register       # 在 mooncakes.io 注册账号
```

- **深度说明**：发布前置三件套：注册 → 登录 → 确认身份。`whoami` 验证当前凭证。
- **要点**：`moon publish` 前必须 login 成功。

## moon publish — 发布当前模块

```
Usage: moon publish [OPTIONS]
  --frozen  不同步依赖
```

- **深度说明**：把当前模块发布到 mooncakes.io（lib 项目的发布方式）。发布前应完成全量验证 + SemVer 决策。
- **要点**：发布不可逆，版本号一经发布不可改写（注册表不可变语义）。

## moon package [--list] — 打包当前模块

```
Usage: moon package [OPTIONS]
  --list  列出打包内容
```

- **深度说明**：打包当前模块为可分发包（发布前预览包含哪些文件）。`--list` 查看内容清单。
