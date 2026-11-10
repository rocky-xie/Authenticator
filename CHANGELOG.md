# Changelog

## 1.0.0 — 2026-11-10

首个重新整理后的稳定版本。

### Authentication

- 支持标准 TOTP/HOTP、Microsoft 365 软件 OATH、Steam、Battle.net 和 GOST。
- 保持原有账户数据、加密数据和备份文件兼容。
- 修正 OTPAuth URI 校验、时间边界和过期时钟偏差处理。

### Smart assisted autofill

- 可选识别 OTP/MFA 输入框并显示 Authenticator 图标。
- 仅在用户点击后填入验证码，从不自动提交表单。
- 支持多个候选账户选择；页面脚本不接触 OTP 密钥。
- 默认支持 Microsoft 全球版和世纪互联中国版认证域名。
- 将全网站权限申请移动到独立权限页面，修复点击开关导致工具栏弹窗关闭的问题。

### Security and maintenance

- 更新构建工具和运行依赖，完整 `npm audit` 为 0 个已知漏洞。
- 使用 Manifest V3、Vue 3 compatibility mode、Vuex 4、TypeScript 5 和 Webpack 5。
- 加固二维码、加密消息、账号文本和外部输入处理。
- 生产包不再包含测试页面、源码映射或无效调试入口。
- 清理过时链接、发布说明、翻译入口和未使用的历史资源。

### Interface

- 更新字体、颜色、卡片、按钮、设置页和权限页布局。
- 保留浅色、深色、高对比度及其他原有主题。
