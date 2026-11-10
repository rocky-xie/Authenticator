# Changelog

All notable changes maintained by this fork are documented here.

## 8.0.3 — 2026-11-10

### Compatibility

- Preserved existing OTP storage and encryption behavior.
- Verified Microsoft 365 software OATH compatibility against RFC 6238 vectors.
- Corrected TOTP boundary calculation to use whole Unix seconds.
- Ignore stale clock offsets and retain timezone-independent OTP generation.
- Preserve HOTP counters when importing OTPAuth URIs.

### Dependencies and build

- Migrated from Vue 2 to Vue 3 compatibility mode and Vuex 4.
- Replaced abandoned Argon2, GOST, QR reader, drag-and-drop, SVG, and license
  generation dependencies with maintained implementations or local tooling.
- Updated TypeScript, Webpack, Sass, Puppeteer, Mocha, Chai, and Sinon.
- Excluded tests and source maps from production packages.
- Added reproducible Chrome, Edge, and Firefox production builds.

### Security

- Added strict OTPAuth URI parsing, input limits, scheme/type validation, and
  supported-algorithm filtering.
- Hardened Argon2 iframe messaging with request identifiers, source validation,
  input validation, timeouts, and listener cleanup.
- Removed dynamic HTML rendering of account-controlled data.
- Stopped including OTP secrets in error messages.
- Removed rate-limited `otp.ee` redirect links.
- Reduced the production dependency audit to zero known vulnerabilities.
