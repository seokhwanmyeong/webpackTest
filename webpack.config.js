const path = require("path");
const fs = require("fs");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const CombineJSPlugin = require("./CombineJSPlugin");

function findQuestionFolders(dir) {
  const items = fs.readdirSync(dir);
  const folders = [];

  items.forEach((item) => {
    const fullPath = path.join(dir, item);
    if (fs.statSync(fullPath).isDirectory()) {
      if (
        fs.existsSync(path.join(fullPath, "content")) &&
        fs.existsSync(path.join(fullPath, "images")) &&
        fs.existsSync(path.join(fullPath, "js", "main.js")) &&
        fs.existsSync(path.join(fullPath, "css"))
      ) {
        folders.push(fullPath);
      } else {
        folders.push(...findQuestionFolders(fullPath));
      }
    }
  });

  return folders;
}

function serializeToBSON(obj) {
  const buffer = [];
  const writeInt32 = (value) => {
    buffer.push(
      value & 255,
      (value >> 8) & 255,
      (value >> 16) & 255,
      (value >> 24) & 255
    );
  };
  const writeString = (str) => {
    const bytes = new TextEncoder().encode(str);
    writeInt32(bytes.length + 1);
    buffer.push(...bytes, 0);
  };
  const writeValue = (value) => {
    if (typeof value === "string") {
      buffer.push(0x02);
      writeString(value);
    } else if (typeof value === "number") {
      buffer.push(0x01);
      const view = new DataView(new ArrayBuffer(8));
      view.setFloat64(0, value, true);
      buffer.push(...new Uint8Array(view.buffer));
    } else if (typeof value === "boolean") {
      buffer.push(0x08, value ? 1 : 0);
    } else if (value === null) {
      buffer.push(0x0a);
    } else if (Array.isArray(value)) {
      buffer.push(0x04);
      const arrBuffer = serializeToBSON(value);
      buffer.push(...arrBuffer.slice(4)); // 길이 필드 제외
    } else if (typeof value === "object") {
      buffer.push(0x03);
      const objBuffer = serializeToBSON(value);
      buffer.push(...objBuffer.slice(4)); // 길이 필드 제외
    }
  };

  for (const [key, value] of Object.entries(obj)) {
    buffer.push(0x00);
    writeString(key);
    writeValue(value);
  }
  buffer.push(0x00);

  const length = buffer.length + 4;
  const result = new Uint8Array(length + 4); // 추가 4바이트 할당
  new DataView(result.buffer).setInt32(0, length, true);
  new DataView(result.buffer).setInt32(4, 6, true); // 추가 4바이트 (6,0,0,0)
  result.set(buffer, 8);

  return result;
}

module.exports = (env) => {
  const questionFolders = findQuestionFolders(path.resolve(__dirname, "ham"));

  return questionFolders.map((folder) => {
    const relativePath = path.relative(path.resolve(__dirname, "ham"), folder);
    const tempDir = path.resolve(__dirname, "temp", relativePath);
    const folderId = path.basename(folder);

    return {
      mode: "production",
      entry: {
        main: path.resolve(tempDir, `combined_${folderId}.js`),
      },
      output: {
        filename: "js/[name].js",
        path: path.resolve(__dirname, "dist", relativePath),
        clean: true,
      },
      module: {
        rules: [
          {
            test: /\.js$/,
            exclude: /node_modules/,
            use: {
              loader: "babel-loader",
              options: {
                presets: ["@babel/preset-env"],
              },
            },
          },
          {
            test: /\.css$/,
            use: ["style-loader", "css-loader"],
          },
          // {
          //   test: /\.json$/,
          //   type: "javascript/auto",
          //   use: "json-loader",
          // },
          {
            test: /\.(png|jpg|gif)$/,
            type: "asset/resource",
            generator: {
              filename: "images/[name][ext]",
            },
          },
          {
            test: /\.mp3$/,
            type: "asset/resource",
            generator: {
              filename: "media/[name][ext]",
            },
          },
        ],
      },
      plugins: [
        new CombineJSPlugin({
          folder: folder,
          tempDir: tempDir,
          folderId: folderId,
        }),
        // new webpack.ProgressPlugin(),
        new HtmlWebpackPlugin({
          template: path.resolve(folder, "index.html"),
          filename: "index.html",
          inject: "body",
          scriptLoading: "blocking",
          minify: true,
          chunks: ["main"],
          templateParameters: {
            binaryJsonPlugin: '<script src="js/BinaryJsonPlugin.js"></script>',
            bson: '<script src="https://cdnjs.cloudflare.com/ajax/libs/bson/4.0.0/bson.min.js"></script>',
          },
          templateContent: (templateParams, compilation) => {
            const htmlContent = fs.readFileSync(
              path.resolve(folder, "index.html"),
              "utf8"
            );
            return htmlContent
              .replace(
                /<script src="\.\/js\/(udl|api|preload|bg|character|common|quize|main)\.js"><\/script>/g,
                ""
              )
              .replace(
                "</body>",
                `${templateParams.bson}${templateParams.binaryJsonPlugin}</body>`
              );
          },
        }),
        new CopyWebpackPlugin({
          patterns: [
            {
              from: path.resolve(folder, "images"),
              to: "images",
            },
            {
              from: path.resolve(folder, "media"),
              to: "media",
            },
            {
              from: path.resolve(folder, "css"),
              to: "css",
            },
            {
              from: path.resolve(folder, "js", "phaser.min.js"),
              to: "js/phaser.min.js",
            },
            {
              from: path.resolve(folder, "js", "SpinePlugin.js"),
              to: "js/SpinePlugin.js",
            },
            {
              from: path.resolve(folder, "content"),
              to: "content",
              // transform(content, path) {
              //   if (path.endsWith(".json")) {
              //     console.log(`Processing JSON file: ${path}`);
              //     try {
              //       const jsonContent = content.toString("utf8");
              //       console.log(
              //         `Raw JSON content (first 200 characters): ${jsonContent.substring(
              //           0,
              //           200
              //         )}`
              //       );
              //       const json = JSON.parse(jsonContent);
              //       console.log(`Successfully parsed JSON for ${path}`);
              //       const wrappedJson = Array.isArray(json)
              //         ? { data: json }
              //         : json;
              //       const serialized = serializeToBSON(wrappedJson);
              //       console.log(`Serialized BSON length: ${serialized.length}`);
              //       return Buffer.from(serialized);
              //     } catch (error) {
              //       console.error(`Error processing JSON file: ${path}`, error);
              //       console.log(
              //         `Problematic content: ${content.toString("utf8")}`
              //       );
              //       return content; // JSON 파싱에 실패하면 원본 내용을 그대로 반환
              //     }
              //   }
              //   return content;
              // },
              // transform(content, path) {
              //   if (path.endsWith(".json")) {
              //     console.log(`Processing JSON file: ${path}`);
              //     try {
              //       const jsonContent = content.toString("utf8");
              //       console.log(
              //         `Raw JSON content (first 200 characters): ${jsonContent.substring(
              //           0,
              //           200
              //         )}`
              //       );
              //       const json = JSON.parse(jsonContent);
              //       console.log(`Successfully parsed JSON for ${path}`);
              //       const wrappedJson = Array.isArray(json)
              //         ? { data: json }
              //         : json;

              //       // Uncomment the next line to use BSON serialization
              //       // const serialized = serializeToBSON(wrappedJson);

              //       // For now, just stringify the JSON
              //       const serialized = JSON.stringify(wrappedJson);

              //       console.log(
              //         `Serialized content length: ${serialized.length}`
              //       );
              //       return Buffer.from(serialized);
              //     } catch (error) {
              //       console.error(`Error processing JSON file: ${path}`, error);
              //       console.log(
              //         `Problematic content: ${content.toString("utf8")}`
              //       );
              //       return content; // JSON 파싱에 실패하면 원본 내용을 그대로 반환
              //     }
              //   }
              //   return content;
              // },
              transform(content, path) {
                if (path.endsWith(".json")) {
                  console.log(`Processing JSON file: ${path}`);
                  try {
                    const jsonContent = content.toString("utf8");
                    console.log(
                      `Raw JSON content (first 200 characters): ${jsonContent.substring(
                        0,
                        200
                      )}`
                    );
                    const json = JSON.parse(jsonContent);
                    console.log(`Successfully parsed JSON for ${path}`);
                    const wrappedJson = Array.isArray(json)
                      ? { data: json }
                      : json;

                    // Use BSON serialization
                    const serialized = serializeToBSON(wrappedJson);

                    console.log(`Serialized BSON length: ${serialized.length}`);
                    return Buffer.from(serialized);
                  } catch (error) {
                    console.error(`Error processing JSON file: ${path}`, error);
                    console.log(
                      `Problematic content: ${content.toString("utf8")}`
                    );
                    return content; // JSON 파싱에 실패하면 원본 내용을 그대로 반환
                  }
                }
                return content;
              },
            },
            {
              from: path.resolve(__dirname, "BinaryJsonPlugin.js"),
              to: "js/BinaryJsonPlugin.js",
            },
          ],
        }),
        new webpack.ProvidePlugin({
          BinaryJsonPlugin: path.resolve(__dirname, "BinaryJsonPlugin.js"),
        }),
        new webpack.BannerPlugin({
          banner: `
          (function() {
            const originalGame = Phaser.Game;
            Phaser.Game = function(config) {
              const extendedConfig = {
                ...config,
                plugins: {
                  ...config.plugins,
                  global: [
                    ...(config.plugins && config.plugins.global ? config.plugins.global : []),
                    { key: 'BinaryJsonPlugin', plugin: BinaryJsonPlugin, start: true }
                  ]
                }
              };
              return new originalGame(extendedConfig);
            };
          })();
        `,
          raw: true,
          entryOnly: true,
        }),
      ],
      optimization: {
        minimize: true,
        minimizer: [
          new TerserPlugin({
            terserOptions: {
              format: {
                comments: false,
              },
              compress: {
                drop_console: false,
                pure_funcs: [],
                // drop_console: true,
                // pure_funcs: ["console.log"],
              },
              mangle: true,
            },
            extractComments: false,
          }),
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
  });
};
