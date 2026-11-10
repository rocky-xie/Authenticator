#!/bin/bash

# Extension build script
# Syntax:
#   build.sh <platform>
# Platforms:
#   'chrome', 'firefox', 'edge', 'test', or 'prod'

PLATFORM=$1
CREDS=$(cat ./src/models/credentials.ts | tr -d '\n')
CREDREGEX='^.*".+".*".+".*".+".*".+".*".+".*$'
set -e

if [[ $PLATFORM != "chrome" ]] && [[ $PLATFORM != "firefox" ]] && [[ $PLATFORM != "edge" ]] && [[ $PLATFORM != "prod" ]] && [[ $PLATFORM != "test" ]]; then
    echo "Invalid platform type. Supported platforms are 'chrome', 'firefox', 'test', and 'prod'"
    exit 1
fi

echo "Removing old build files..."
rm -rf build dist
rm -rf firefox chrome edge release test
echo "Checking style..."
if find ./src ./sass -type f \
    \( -name '*.js' -o -name '*.ts' -o -name '*.vue' -o -name '*.scss' \) \
    -print0 | xargs -0 ./node_modules/.bin/prettier --check 1> /dev/null ; then
    true
else
    find ./src ./sass -type f \
        \( -name '*.js' -o -name '*.ts' -o -name '*.vue' -o -name '*.scss' \) \
        -print0 | xargs -0 ./node_modules/.bin/prettier --write
fi

if ! [[ $CREDS =~ $CREDREGEX ]] ; then
    if [[ ${REQUIRE_RELEASE_CREDENTIALS:-0} = "1" ]]; then
        echo -e "\e[7m\033[33mError: Missing cloud-provider credentials in credentials.ts\033[0m"
        exit 1
    else
        echo -e "\e[7m\033[33mWarning: Cloud backup providers are disabled because credentials.ts is incomplete\033[0m"
    fi
fi

echo "Compiling..."
if [[ $PLATFORM = "prod" ]]; then
    ./node_modules/webpack-cli/bin/cli.js --config webpack.prod.js
elif [[ $PLATFORM = "test" ]]; then
    ./node_modules/webpack-cli/bin/cli.js --config webpack.dev.js
    ./node_modules/.bin/tsc --target ES2015 --esModuleInterop --moduleResolution node --module commonjs scripts/test-runner.ts
else
    ./node_modules/webpack-cli/bin/cli.js
fi
if [[ $PLATFORM = "prod" ]]; then
    ./node_modules/sass/sass.js --no-source-map sass:css
else
    ./node_modules/sass/sass.js sass:css
fi
cp ./sass/DroidSansMono.woff2 ./css/
if [[ $PLATFORM = "test" ]]; then
    cp ./sass/mocha.css ./css/
fi

if [[ $PLATFORM = "prod" ]]; then
    echo "Generating licenses file..."
    node ./scripts/generate-licenses.js
fi

postCompile () {
    mkdir $1
    cp -r dist css images _locales LICENSE view $1

    if [[ $PLATFORM == "test" ]]; then
        cp manifests/manifest-$1-testing.json $1/manifest.json
    else
        cp manifests/manifest-$1.json $1/manifest.json
    fi

    if [[ $1 = "chrome" ]] || [[ $1 = "edge" ]]; then
        cp manifests/schema-chrome.json $1/schema.json
    fi

    if [[ $PLATFORM != "test" ]]; then
        rm -f "$1/view/test.html" "$1/css/mocha.css" \
            "$1/css/content.css.map" "$1/css/import.css.map" \
            "$1/css/permissions.css.map" "$1/css/popup.css.map" \
            "$1/css/mocha.css.map"
    fi
}

if [[ $PLATFORM = "prod" ]]; then
    postCompile "chrome"
    postCompile "firefox"
    postCompile "edge"
    mkdir release
    mv chrome firefox edge release
elif [[ $PLATFORM = "test" ]]; then
    postCompile "chrome"
    mkdir test
    mv chrome test
else
    postCompile $PLATFORM
fi

echo -e "\033[0;32mDone!\033[0m"
