#!/bin/bash

set -euo pipefail

VERSION=$(node -p "require('./manifests/manifest-chrome.json').version")
GIT_TAG="v${VERSION}"

if git rev-parse "$GIT_TAG" >/dev/null 2>&1; then
    echo "Tag $GIT_TAG already exists; nothing to do."
    exit 0
fi

git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
git config user.name "github-actions[bot]"
git tag "$GIT_TAG" -a -m "Release $GIT_TAG"
git push origin "$GIT_TAG"
