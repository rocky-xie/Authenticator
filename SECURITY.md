# Security Policy

## Supported version

This fork supports the latest commit on the `dev` branch and release artifacts
published by [rocky-xie/Authenticator](https://github.com/rocky-xie/Authenticator).
The current fork version is 8.0.3 and is based on upstream extension version 8.0.2.

Browser-store builds published by the upstream project have a separate release
and support lifecycle.

## Reporting a vulnerability

Report a potential vulnerability privately through
[GitHub Security Advisories](https://github.com/rocky-xie/Authenticator/security/advisories/new).
Do not open a public issue containing an OTP secret, QR code, recovery code,
backup file, password, OAuth credential, or working exploit.

Please include affected versions, reproduction steps, impact, and a minimal
proof of concept where appropriate. This is a volunteer-maintained fork, so no
fixed response-time guarantee is offered.

## Security checks

Before a release, maintainers should run:

```bash
npm ci
npm audit --omit=dev
PUPPETEER_EXEC_PATH=/usr/bin/chromium npm test
npm run prod
```

Production packages must not contain test pages, source maps, private OAuth
credentials, signing keys, or decrypted backup data.
