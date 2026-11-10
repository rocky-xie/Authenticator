const path = require("path");
const webpack = require("webpack");
const { VueLoaderPlugin } = require("vue-loader");

module.exports = {
  mode: "development",
  devtool: "source-map",
  entry: {
    argon: "./src/argon.ts",
    background: "./src/background.ts",
    content: "./src/content.ts",
    "smart-autofill": "./src/smart-autofill.ts",
    popup: "./src/popup.ts",
    import: "./src/import.ts",
    options: "./src/options.ts",
    permissions: "./src/permissions.ts",
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: "ts-loader",
        options: {
          appendTsSuffixTo: [/\.vue$/],
          // Vue 3 compat mode cannot fully type-infer this Vue 2 Options API
          // codebase. Runtime behavior is covered by the browser test suite.
          transpileOnly: true
        },
        exclude: /node_modules/
      },
      {
        test: /\.vue$/,
        loader: "vue-loader",
        options: {
          compilerOptions: {
            compatConfig: { MODE: 2 }
          }
        }
      },
      {
        test: /\.svg$/,
        use: [
          "vue-loader",
          path.resolve(__dirname, "scripts/svg-to-vue-loader.js")
        ]
      },
      {
        test: /\.(png|jpe?g|gif)$/,
        type: "asset/inline"
      }
    ],
  },
  plugins: [
    new VueLoaderPlugin(),
    new webpack.DefinePlugin({
      __VUE_OPTIONS_API__: true,
      __VUE_PROD_DEVTOOLS__: false,
      __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false
    })
  ],
  resolve: {
    alias: {
      vue$: "@vue/compat"
    },
    extensions: [
      ".mjs",
      ".js",
      ".jsx",
      ".vue",
      ".json",
      ".wasm",
      ".ts",
      ".tsx"
    ],
    modules: ["node_modules"],
    fallback: {
      // Browser builds must not silently bundle Node filesystem shims.
      fs: false,
      path: false
    }
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    publicPath: "/dist/"
  }
};
