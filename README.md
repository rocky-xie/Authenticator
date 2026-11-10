# Authenticator — security-maintained fork

<img align="right" width="100" height="100" src="images/icon.svg" alt="Authenticator icon">

[![CI](https://github.com/rocky-xie/Authenticator/actions/workflows/main.yml/badge.svg?branch=dev)](https://github.com/rocky-xie/Authenticator/actions/workflows/main.yml)
[![CodeQL](https://github.com/rocky-xie/Authenticator/actions/workflows/codeql-analysis.yml/badge.svg?branch=dev)](https://github.com/rocky-xie/Authenticator/actions/workflows/codeql-analysis.yml)

浏览器内的 TOTP/HOTP 双因素认证器。本仓库是
[Authenticator-Extension/Authenticator](https://github.com/Authenticator-Extension/Authenticator)
的安全维护 Fork。当前 Fork 版本为 `8.0.3`，基于上游 `8.0.2`，重点更新了依赖、构建链和输入安全，且保持原有账户数据与 OTP 逻辑兼容。

> This is a security-maintained fork of Authenticator. It preserves the original
> extension behavior while modernizing dependencies and hardening untrusted input.

## 当前状态

- Chrome/Edge 使用 Manifest V3；同时保留 Firefox 构建。
- Vue 3 compatibility mode、Vuex 4、TypeScript 5 和 Webpack 5。
- 支持标准 TOTP/HOTP、SHA-1/SHA-256/SHA-512、Steam/Battle.net 和 GOST。
- 兼容 Microsoft 365 软件 OATH MFA：Base32 密钥、SHA-1、6 位数字、30 秒周期。
- TOTP 使用 Unix 时间计算，与显示时区无关；过期的时钟偏差不会继续生效。
- 默认在浏览器本地保存账户；可选密码保护使用 Argon2id。
- 已移除 Vue 2、`argon2-browser`、`node-gost-crypto`、`qrcode-reader`、
  `vue2-dragula` 等停止维护或不再适合使用的依赖。
- 生产依赖执行 `npm audit --omit=dev` 时为 0 个已知漏洞。
- 不再依赖 `otp.ee` 跳转地址，帮助、源码和问题反馈直接指向 GitHub。

## 安装到 Chrome / Edge

### 从源码构建

环境要求：Node.js 24、npm，以及用于运行扩展测试的 Chrome/Chromium。

```bash
npm ci
npm run prod
```

构建输出：

- `release/chrome`：Chrome 可加载目录
- `release/edge`：Edge 可加载目录
- `release/firefox`：Firefox 可加载目录

Chrome 安装步骤：

1. 打开 `chrome://extensions`。
2. 启用“开发者模式”。
3. 点击“加载已解压的扩展程序”。
4. 选择 `release/chrome` 目录。

Edge 使用 `edge://extensions` 并选择 `release/edge`，操作相同。

> Chrome 不能直接把源码 ZIP 当作商店扩展安装。请先解压，再选择包含
> `manifest.json` 的目录。

### 官方商店版本

Chrome、Firefox 和 Edge 商店中的同名扩展由原上游项目发布，不一定包含本
Fork 的安全升级。需要本 Fork 的行为时，请使用上面的源码构建方式。

## Microsoft 365 MFA

本项目支持 Microsoft 365/Entra ID 的标准软件 OATH TOTP。登记时必须完成
Microsoft 页面上的最终验证码确认步骤；仅扫描二维码并不代表认证器已经登记成功。

建议参数：

| 参数 | 值     |
| ---- | ------ |
| 类型 | TOTP   |
| 密钥 | Base32 |
| 算法 | SHA-1  |
| 位数 | 6      |
| 周期 | 30 秒  |

若验证码不匹配，请先检查系统时间同步，而不是修改时区。验证码计算使用 Unix 时间，
中国、日本、欧洲或其他时区在同一时刻应生成相同结果。

## 云备份说明

仓库不包含 Google Drive、Dropbox 或 OneDrive 的私有 OAuth 凭据。默认源码构建会
显示警告；因为缺少 OAuth 客户端信息，这些云服务不可用。本地 OTP、加密、二维码
导入和备份文件导入/导出不受影响。

如需启用云备份，请注册自己的 OAuth 应用，并填写
`src/models/credentials.ts` 和对应 Manifest 配置。不要提交客户端密钥或发布凭据。

## 开发

```bash
# 安装锁定版本的依赖
npm ci

# 构建单个平台
npm run chrome
npm run firefox
npm run edge

# Chrome 监听构建，输出到 test/chrome
npm run dev:chrome

# 在真实 Chrome/Chromium 中运行回归测试
PUPPETEER_EXEC_PATH=/usr/bin/chromium npm test

# 生产依赖安全审计
npm audit --omit=dev
```

测试覆盖 Microsoft 365/RFC 6238 时间边界、OTPAuth URI、HOTP counter、时钟偏差、
GOST 兼容性、密码页面和主要菜单行为。

更多开发规则见 [CONTRIBUTING.md](CONTRIBUTING.md)，版本变更见
[CHANGELOG.md](CHANGELOG.md)。

## 安全与隐私

- 不要在 Issue、日志或截图中公开 OTP 密钥、二维码、恢复码或备份密码。
- 扫描二维码和生成验证码均在本地完成。
- 生产包不包含测试页面或源码映射。
- 安全问题请按照 [SECURITY.md](SECURITY.md) 私下报告。

## 上游与许可

本 Fork 保留原项目的 MIT 许可和贡献者历史。上游项目：
[Authenticator-Extension/Authenticator](https://github.com/Authenticator-Extension/Authenticator)。

项目仍感谢卢森堡大学信息安全团队对原项目安全工作的支持，以及所有原项目维护者、
翻译者和贡献者。
