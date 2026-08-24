# tools/version — 版本管理

跨平台 SemVer 版本核心：严格 SemVer 解析 + 读写声明的版本字段（由根目录
`.version-bump.json` 驱动）。

```
version.mjs       版本核心：parseSemVer / checkVersions / auditVersions / bumpVersions
```

## 用法

```sh
node tools/version/version.mjs check    # 全仓版本一致性
node tools/version/version.mjs audit    # 逐文件版本审计
node tools/version/version.mjs bump <X.Y.Z>
```

`.version-bump.json` 声明哪些 manifest 文件参与版本提升（声明在项目根，与
`package.json` 同级——版本提升的对象是项目本身）。

## 边界

版本**分类**（feat!/feat/fix → major/minor/patch）与 CHANGELOG 写作在
`skills/pf-version/SKILL.md`；发布门禁在 `tools/release/`。
