const path = require("path");
const util = require("util");
const exec = util.promisify(require("child_process").exec);
const fs = require("fs").promises;
const projectRoot = path.resolve(__dirname);

function toUnixPath(p) {
  return p.split(path.sep).join("/");
}

async function runWebpack() {
  try {
    const webpackConfigPath = toUnixPath(
      path.join(projectRoot, "webpack.config.js")
    );
    const command = `npx webpack --config ${webpackConfigPath}`;

    console.log(`Running command: ${command}`);
    const { stdout, stderr } = await exec(command);
    console.log("Webpack output:");
    console.log(stdout);
    if (stderr) {
      console.error("Webpack errors:");
      console.error(stderr);
    }
    console.log("Webpack build completed successfully");

    // 빌드 결과 확인
    // await checkBuildResults();
  } catch (error) {
    console.error("Webpack build failed:");
    console.error(error);
  }
}

async function checkBuildResults() {
  const distPath = path.join(projectRoot, "dist");
  try {
    const files = await fs.readdir(distPath, { recursive: true });
    console.log("Files generated in dist folder:");
    files.forEach((file) => console.log(file));

    // main.bundle.js 파일 찾기
    const bundleFiles = files.filter((file) => file.endsWith("main.bundle.js"));
    if (bundleFiles.length > 0) {
      console.log("Found main.bundle.js files:");
      bundleFiles.forEach((file) => console.log(file));
    } else {
      console.log("No main.bundle.js files found.");
    }
  } catch (error) {
    console.error("Error checking build results:", error);
  }
}

async function main() {
  await runWebpack();
  console.log("Project build complete!");
}

main().catch(console.error);
