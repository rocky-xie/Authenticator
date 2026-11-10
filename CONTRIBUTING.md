# Contributing

Development happens on the `dev` branch. Keep changes focused, preserve existing
stored-account compatibility, and never commit real OTP secrets or OAuth credentials.

## Setup

Use Node.js 24 and npm:

```bash
npm ci
```

## Required checks

```bash
npx prettier --check "src/**/*.{ts,vue}" "sass/**/*.scss" "scripts/*.{js,ts}"
npm audit --omit=dev
PUPPETEER_EXEC_PATH=/usr/bin/chromium npm test
npm run prod
```

Set `PUPPETEER_EXEC_PATH` to the Chrome or Chromium executable available on your
system. Production builds may warn that cloud-provider credentials are missing;
that is expected for public source builds.

## OTP compatibility

Changes to OTP generation or import must include regression tests. At minimum,
retain RFC 4226/6238 behavior, Microsoft 365's common SHA-1/6-digit/30-second
profile, timezone independence, existing GOST vectors, and stored-data compatibility.

## Pull requests

- Target `dev`.
- Describe user-visible behavior and security impact.
- Update `README.md` and `CHANGELOG.md` when behavior or dependencies change.
- Do not include generated `release/`, `dist/`, `chrome/`, `edge/`, or `firefox/`
  directories.
