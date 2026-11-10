# Authenticator

<img align="right" width="96" height="96" src="images/icon.svg" alt="Authenticator icon">

[![CI](https://github.com/rocky-xie/Authenticator/actions/workflows/main.yml/badge.svg?branch=dev)](https://github.com/rocky-xie/Authenticator/actions/workflows/main.yml)
[![CodeQL](https://github.com/rocky-xie/Authenticator/actions/workflows/codeql-analysis.yml/badge.svg?branch=dev)](https://github.com/rocky-xie/Authenticator/actions/workflows/codeql-analysis.yml)

本地运行的浏览器双因素认证器，支持 TOTP、HOTP 和可选的智能辅助填充。当前维护基线为 `1.0.0`。

## 功能

- 标准 TOTP/HOTP：SHA-1、SHA-256、SHA-512、6/8 位验证码及自定义周期。
- Microsoft 365 软件 OATH MFA：SHA-1、6 位数字、30 秒周期。
- Microsoft 全球版及世纪互联中国版登录页面智能辅助填充。
- Steam、Battle.net、十六进制密钥及 GOST 算法兼容。
- 本地账户存储、密码加密、二维码导入和备份文件导入导出。
- Chrome、Edge 使用 Manifest V3；同时提供 Firefox 构建。

验证码计算以 Unix 时间为准，与显示时区无关。系统时钟不准确会造成验证码错误。

## 安装

需要 Node.js 24 和 npm：

```bash
npm ci
npm run prod
```

生成目录：

- `release/chrome`
- `release/edge`
- `release/firefox`

Chrome 安装：打开 `chrome://extensions`，启用“开发者模式”，选择“加载已解压的扩展程序”，然后选择 `release/chrome`。Edge 在 `edge://extensions` 中执行相同步骤。

压缩包必须先解压；Chrome 不能把普通 ZIP 直接作为商店扩展安装。

## 智能辅助填充

在插件设置中开启“验证码输入框智能辅助填充”。识别到 MFA/OTP 输入框后，输入框右侧会显示 Authenticator 图标：

1. 点击图标后才会请求当前验证码。
2. 多个账户可用时先选择账户。
3. 插件只填入内容，不发送 Enter、不点击按钮、不提交表单。

以下 Microsoft 登录域名默认可用，不需要“所有网站”权限：

- `login.microsoftonline.com`
- `login.live.com`
- `account.live.com`
- `mysignins.microsoft.com`
- `login.chinacloudapi.cn`
- `login.partner.microsoftonline.cn`
- `*.partner.microsoftonline.cn`

如需在其他网站使用，可在“设置 → 权限管理”中单独授予可选的网站访问权。关闭智能辅助填充后，原有复制和快捷键填充方式保持不变。

浏览器扩展只能运行在正常的 Chrome/Edge 网页中。Outlook、Teams 使用的 Windows WAM 或内嵌 WebView2 登录窗口不会加载浏览器扩展。

## Microsoft 365 MFA

扫描 Microsoft 提供的二维码后，必须返回 Microsoft 登记页面完成最终验证码确认。仅扫描二维码不代表认证器已经登记成功。

| 参数 | 推荐值 |
| --- | --- |
| 类型 | TOTP |
| 密钥 | Base32 |
| 算法 | SHA-1 |
| 位数 | 6 |
| 周期 | 30 秒 |

## Backup and restore

本地备份文件的导入、导出和加密不需要云服务。备份文件可能包含 OTP 密钥，应当像密码一样保护。

## Cloud backup

公开源码不包含 Google Drive、Dropbox 或 OneDrive 的私有 OAuth 凭据，因此默认构建中的云备份不可用。本地 OTP、二维码、密码保护和文件备份不受影响。

如需启用云备份，请注册自己的 OAuth 应用并填写 `src/models/credentials.ts` 及对应 Manifest 配置。不要向仓库提交客户端密钥、访问令牌或刷新令牌。

## 开发和验证

```bash
npm ci
npx tsc --noEmit
npm test
npm audit
npm run prod
```

回归测试覆盖 RFC 4226/6238、Microsoft 365 OATH、时间边界、OTPAuth URI、GOST、加密入口和智能填充域名匹配。

## 安全与隐私

- OTP 密钥、二维码解析和验证码生成均在本地完成。
- 智能辅助填充页面脚本不会获得 OTP 密钥。
- 加密账户未解锁时不会向页面提供验证码。
- 生产包不包含测试页面或源码映射。
- 不要在 Issue、日志或截图中公开密钥、二维码、恢复码、备份文件或密码。

安全问题请按照 [SECURITY.md](SECURITY.md) 私下报告。

## License

项目采用 MIT License，并保留原项目及第三方开源组件的版权和许可信息。
