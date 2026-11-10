#!/bin/bash

set -euo pipefail

npm run prod
VERSION=$(node -p "require('./package.json').version")

for platform in chrome edge firefox; do
    (
        cd "release/$platform"
        zip -q -r "../Authenticator-${VERSION}-$platform.zip" .
    )
done
