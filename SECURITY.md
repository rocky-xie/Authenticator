# Security Policy

## Supported version

当前支持版本为 `1.0.x`，支持分支为 `dev`。

## Reporting a vulnerability

请使用 [GitHub Security Advisories](https://github.com/rocky-xie/Authenticator/security/advisories/new) 私下报告安全问题。

不要在公开 Issue 中提供 OTP 密钥、二维码、恢复码、备份文件、密码、OAuth 凭据、访问令牌或可直接利用的攻击代码。

报告应包含受影响版本、复现步骤、影响范围，以及必要的最小化验证材料。

## Release checks

```bash
npm ci
npx tsc --noEmit
npm test
npm audit
npm run prod
```

生产包不得包含测试页面、源码映射、私有 OAuth 凭据、签名密钥或解密后的备份数据。
