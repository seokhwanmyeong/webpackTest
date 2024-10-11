const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const JsonMinimizerPlugin = require("json-minimizer-webpack-plugin");

module.exports = (env) => {
  return {
    mode: "production",
    entry: path.join(env.entry, "combined.js"),
    output: {
      filename: "js/main.bundle.js",
      path: path.resolve(__dirname, env.outputPath),
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: [
            {
              loader: "babel-loader",
              options: {
                presets: ["@babel/preset-env"],
              },
            },
          ],
        },
        {
          test: /\.css$/,
          use: ["style-loader", "css-loader"],
        },
        {
          test: /\.(png|jpg|gif)$/,
          use: [
            {
              loader: "file-loader",
              options: {
                name: "[name].[ext]",
                outputPath: "images/",
              },
            },
          ],
        },
        {
          test: /\.json$/,
          type: "javascript/auto",
          use: ["json-loader"],
        },
        {
          test: /\.mp3$/,
          use: [
            {
              loader: "file-loader",
              options: {
                name: "[name].[ext]",
                outputPath: "media/",
              },
            },
          ],
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: `${env.htmlPath}/index.html`,
        filename: "index.html",
        inject: "body",
        scriptLoading: "blocking",
      }),
      new webpack.optimize.AggressiveMergingPlugin(),
    ],
    optimization: {
      minimize: true,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            format: {
              comments: false,
            },
          },
          extractComments: false,
        }),
        new JsonMinimizerPlugin(),
      ],
    },
    resolve: {
      extensions: [".js"],
    },
    externals: {
      phaser: "Phaser",
      "./SpinePlugin.js": "SpinePlugin",
    },
  };
};
