const path = require("path");
const webpack = require("webpack");
const src = path.resolve(__dirname, "./example");
const dist = path.resolve(__dirname, "./dist");
const CopyWebpackPlugin = require("copy-webpack-plugin");

/* eslint-disable no-process-env */
module.exports = env => {
  const DEBUG = !env || !env.prod;
  return {
    context: src,
    cache: DEBUG,
    devtool: DEBUG ? "cheap-module-eval-source-map" : "sourcemap",
    entry: {
      app: [src + "/polyfills.js", src + "/app.js"],
    },
    output: {
      path: dist,
      filename: "[name].bundle.js",
    },
    resolve: {
      extensions: [".js", ".jsx", ".css"],
      modules: [
        src,
        path.join(__dirname, "./node_modules"),
        path.join(__dirname, "./node_modules/funcx-library"),
      ],
      alias: {
        "@": __dirname,
      },
    },

    module: {
      rules: [
        {
          test: /.jsx?$/,
          exclude: {
            include: /node_modules/,
            exclude: [/node_modules\/mingo\//, /node_modules\/funcx-library\//],
          },
          loader: "babel-loader",
          query: {
            presets: ["react", "env"].map(name =>
              require.resolve("babel-preset-" + name)
            ),
            plugins: [
              "transform-decorators-legacy",
              "transform-class-properties",
              "transform-object-rest-spread",
            ].map(name => require.resolve("babel-plugin-" + name)),
          },
        },
      ],
    },

    devServer: {
      contentBase: dist,
      port: 3008,
      host: "0.0.0.0",
      disableHostCheck: true,
      historyApiFallback: true,
      compress: true,
    },
    plugins: [
      new CopyWebpackPlugin([
        {
          from: src + "/index.html",
          to: "index.html",
        },
      ]),
    ].filter(item => item),
  };
};
