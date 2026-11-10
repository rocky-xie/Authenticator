#!/bin/bash

set -euo pipefail

# Public releases intentionally use the credential-free build. Maintainers who
# enable cloud backup must inject their own OAuth configuration before this step.
npm run prod
tar -czf release.tar.gz release
