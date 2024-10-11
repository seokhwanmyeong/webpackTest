const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");
const util = require("util");
const exec = util.promisify(require("child_process").exec);
const projectRoot = path.resolve(__dirname);
const subjectRoot = path.resolve(__dirname, "ham");
const distPath = path.resolve(projectRoot, "dist");

function copyFolderSync(source, destination) {
  fs.mkdirSync(destination, { recursive: true });
  const items = fs.readdirSync(source);

  items.forEach((item) => {
    const sourcePath = path.join(source, item);
    const destinationPath = path.join(destination, item);

    if (item === "js") return;
    else if (fs.statSync(sourcePath).isDirectory()) {
      copyFolderSync(sourcePath, destinationPath);
    } else {
      fs.copyFileSync(sourcePath, destinationPath);
    }
  });
}

function copyProjectExceptJS(source, destination) {
  fs.mkdirSync(destination, { recursive: true });
  const items = fs.readdirSync(source);

  items.forEach((item) => {
    const sourcePath = path.join(source, item);
    const destinationPath = path.join(destination, item);

    if (fs.statSync(sourcePath).isDirectory()) {
      copyFolderSync(sourcePath, destinationPath);
    } else {
      fs.copyFileSync(sourcePath, destinationPath);
    }
  });
}

function copyPhaserMinFile(sourceFolder, destinationJsFolder) {
  const phaserMinPath = path.join(sourceFolder, "js", "phaser.min.js"); // 원본 폴더에서 phaser.min.js 경로
  const destinationPath = path.join(destinationJsFolder, "phaser.min.js"); // 복사될 경로

  // phaser.min.js 파일을 dist의 js 폴더로 복사
  fs.copyFileSync(phaserMinPath, destinationPath);
  console.log(`phaser.min.js copied to ${destinationPath}`);
}

function copySpineFile(sourceFolder, destinationJsFolder) {
  const phaserMinPath = path.join(sourceFolder, "js", "SpinePlugin.js"); // 원본 폴더에서 SpinePlugin.js 경로
  const destinationPath = path.join(destinationJsFolder, "SpinePlugin.js"); // 복사될 경로

  // phaser.min.js 파일을 dist의 js 폴더로 복사
  fs.copyFileSync(phaserMinPath, destinationPath);
  console.log(`SpinePlugin.js copied to ${destinationPath}`);
}

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

function toUnixPath(p) {
  return p.split(path.sep).join("/");
}

function processHtmlFile(htmlFilePath) {
  const html = fs.readFileSync(htmlFilePath, "utf-8");
  const $ = cheerio.load(html);

  // 삭제할 스크립트 태그들
  const scriptsToRemove = [
    "./js/udl.js",
    "./js/api.js",
    "./js/preload.js",
    "./js/bg.js",
    "./js/character.js",
    "./js/common.js",
    "./js/quize.js",
    "./js/main.js",
  ];

  // body 태그 내의 모든 스크립트 태그 검사 및 삭제
  $("body script").each((index, element) => {
    const src = $(element).attr("src");
    if (src && scriptsToRemove.includes(src)) {
      $(element).remove();
    }
  });

  // 수정된 HTML 저장
  const modifiedHtml = $.html();
  fs.writeFileSync(htmlFilePath, modifiedHtml);

  console.log(`Modified HTML file: ${htmlFilePath}`);
  console.log("Removed scripts:", scriptsToRemove);
}

function combineJSFiles(folder, tempPath) {
  const jsFolder = path.join(folder, "js");
  const tempJsFolder = path.join(tempPath, "js");
  const combinedJsPath = path.join(tempJsFolder, "combined.js");
  let combinedContent = "";

  // temp 폴더의 js 폴더 생성
  if (!fs.existsSync(tempJsFolder)) {
    fs.mkdirSync(tempJsFolder, { recursive: true });
  }

  // JS 파일 순서 정의 (api.js가 먼저 오도록)
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
  return combinedJsPath;
}

async function buildQuestion(folder, tempPath) {
  console.log(`Building folder: ${folder}`);
  try {
    const combinedJsPath = combineJSFiles(folder, tempPath);
    const entryPath = toUnixPath(path.dirname(combinedJsPath));
    const tempOutputPath = toUnixPath(tempPath);
    const webpackConfigPath = toUnixPath(
      path.join(projectRoot, "webpack.config.js")
    );
    const command = `npx webpack --config ${webpackConfigPath} --env entry=${entryPath} --env outputPath=${tempOutputPath} --env htmlPath=${folder}`;

    console.log(`Running command: ${command}`);
    await exec(command);
    console.log(`Successfully built: ${folder}`);

    const distJsPath = path.join(
      distPath,
      folder.replace(subjectRoot, ""),
      "js"
    );
    if (!fs.existsSync(distJsPath)) {
      fs.mkdirSync(distJsPath, { recursive: true });
    }

    const tempJsPath = path.join(tempPath, "js");
    if (fs.existsSync(tempJsPath)) {
      const sourceFile = path.join(tempJsPath, "main.bundle.js");
      const destinationFile = path.join(distJsPath, "main.bundle.js");
      fs.copyFileSync(sourceFile, destinationFile);
    }

    // index.html 파일 처리
    const tempHtmlFile = path.join(tempPath, "index.html");
    const distHtmlFile = path.join(
      distPath,
      folder.replace(subjectRoot, ""),
      "index.html"
    );

    if (fs.existsSync(tempHtmlFile)) {
      processHtmlFile(tempHtmlFile);
      console.log(`Processed HTML file: ${distHtmlFile}`);
      fs.copyFileSync(tempHtmlFile, distHtmlFile);
      console.log(`index.html copied to ${path.dirname(distHtmlFile)}`);
    } else {
      console.log(`Temp HTML file not found: ${tempHtmlFile}`);
    }

    copySpineFile(folder, distJsPath);
    copyPhaserMinFile(folder, distJsPath);
  } catch (error) {
    console.error(`Failed to build: ${folder}`, error.message);
  }
}

async function runWebpack() {
  const questionFolders = findQuestionFolders(subjectRoot);
  const tempPath = path.resolve(projectRoot, "temp");
  const tempJsPath = path.join(tempPath, "js");

  if (!fs.existsSync(tempPath)) {
    fs.mkdirSync(tempPath, { recursive: true });
  }

  // questionFolders.forEach((folder) => {
  //   console.log(`Building folder: ${folder}`);
  //   try {
  //     const combinedJsPath = combineJSFiles(folder, tempPath);
  //     const entryPath = toUnixPath(path.dirname(combinedJsPath));
  //     const tempOutputPath = toUnixPath(tempPath);
  //     const webpackConfigPath = toUnixPath(
  //       path.join(projectRoot, "webpack.config.js")
  //     );
  //     // Webpack 명령 실행 (dist에 js 번들링)
  //     const command = `npx webpack --config ${webpackConfigPath} --env entry=${entryPath} --env outputPath=${tempOutputPath} --env htmlPath=${folder}`;

  //     console.log(`Running command: ${command}`);
  //     execSync(command, { stdio: "inherit" });
  //     console.log(`Successfully built: ${folder}`);

  //     const distJsPath = path.join(
  //       distPath,
  //       folder.replace(subjectRoot, ""),
  //       "js"
  //     );
  //     if (!fs.existsSync(distJsPath)) {
  //       fs.mkdirSync(distJsPath, { recursive: true });
  //     }

  //     if (fs.existsSync(tempJsPath)) {
  //       const sourceFile = path.join(tempJsPath, "main.bundle.js");
  //       const destinationFile = path.join(distJsPath, "main.bundle.js");

  //       fs.copyFileSync(sourceFile, destinationFile);
  //     }

  //     // index.html 파일 복사
  //     const tempHtmlFile = path.join(tempPath, "index.html");
  //     const distHtmlFile = path.join(
  //       distPath,
  //       folder.replace(subjectRoot, ""),
  //       "index.html"
  //     );

  //     if (fs.existsSync(tempHtmlFile)) {
  //       processHtmlFile(tempHtmlFile);
  //       console.log(`Processed HTML file: ${distHtmlFile}`);
  //       fs.copyFileSync(tempHtmlFile, distHtmlFile);
  //       console.log(`index.html copied to ${path.dirname(distHtmlFile)}`);
  //     } else {
  //       console.log(`Temp HTML file not found: ${tempHtmlFile}`);
  //     }

  //     copySpineFile(folder, distJsPath);
  //     copyPhaserMinFile(folder, distJsPath);
  //   } catch (error) {
  //     console.error(`Failed to build: ${folder}`, error.message);
  //   }
  // });
  await Promise.all(
    questionFolders.map((folder) => buildQuestion(folder, tempPath))
  );
  fs.rmdirSync(tempPath, { recursive: true });
}

async function main() {
  copyProjectExceptJS(subjectRoot, distPath);
  await runWebpack();
  console.log("Project build complete!");
}

main().catch(console.error);
