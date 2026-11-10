# Contributing

开发分支为 `dev`。变更应保持账户数据、加密格式和 OTP 计算兼容，不得提交真实密钥或云服务凭据。

## Setup

使用 Node.js 24：

```bash
npm ci
```

## Required checks

```bash
npx prettier --check src sass scripts
npx tsc --noEmit
npm test
npm audit
npm run prod
```

生产构建提示缺少云服务 OAuth 凭据属于公开源码的预期行为。

## Pull requests

- 目标分支使用 `dev`。
- 说明用户可见行为、权限变化和安全影响。
- OTP、导入、存储或加密变更必须增加回归测试。
- 行为变化应同步更新 `README.md` 和 `CHANGELOG.md`。
- 不提交生成的 `release/`、`dist/`、`chrome/`、`edge/`、`firefox/` 或真实备份文件。
