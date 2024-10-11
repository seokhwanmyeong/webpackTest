const fs = require("fs");
const path = require("path");

class CombineJSPlugin {
  constructor(options) {
    this.folder = options.folder;
    this.tempDir = options.tempDir;
    this.folderId = options.folderId;
  }

  apply(compiler) {
    compiler.hooks.beforeRun.tapAsync(
      "CombineJSPlugin",
      (compilation, callback) => {
        const jsFolder = path.join(this.folder, "js");
        if (!fs.existsSync(this.tempDir)) {
          fs.mkdirSync(this.tempDir, { recursive: true });
        }
        const combinedJsPath = path.join(
          this.tempDir,
          `combined_${this.folderId}.js`
        );
        let combinedContent = "";

        const jsFiles = [
          "api.js",
          "preload.js",
          "bg.js",
          "character.js",
          "common.js",
          "quize.js",
          "udl.js",
          "main.js",
        ];

        jsFiles.forEach((file) => {
          const filePath = path.join(jsFolder, file);
          if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, "utf-8");
            combinedContent += `// ${file}\n${content}\n\n`;
          }
        });

        fs.writeFileSync(combinedJsPath, combinedContent);
        console.log(`Combined JS file created: ${combinedJsPath}`);

        // Update the entry point to use the combined file
        compiler.options.entry = combinedJsPath;

        callback();
      }
    );
  }
}

module.exports = CombineJSPlugin;
