#!/bin/bash

set -euo pipefail

# Keep CI read-only: generate missing locale keys, then fail if the generated
# files were not already committed.
node ./scripts/i18n.js

if ! git diff --quiet -- _locales; then
    echo "Translation files are out of date. Run this script locally, review the generated locale changes, and commit them."
    git diff --stat -- _locales
    exit 1
fi

echo "Translation files are up to date."
