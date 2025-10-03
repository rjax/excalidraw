const { execSync } = require("child_process");

const excalidrawDir = `${__dirname}/../packages/excalidraw`;
const excalidrawPackage = `${excalidrawDir}/package.json`;

const publish = () => {
  try {
    console.info("Installing the dependencies in root folder...");
    execSync(`yarn  --frozen-lockfile`);
    console.info("Installing the dependencies in excalidraw directory...");
    execSync(`yarn --frozen-lockfile`, { cwd: excalidrawDir });
    console.info("Building ESM Package...");
    execSync(`yarn run build:esm`, { cwd: excalidrawDir });
    console.info("Publishing the package...");
    execSync(`yarn --cwd ${excalidrawDir} publish`);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

const release = async (version) => {
  if (version) {
    console.info(`Running prerelease for version ${version}...`);
    execSync(`node ${__dirname}/prerelease.js ${version}`, { stdio: 'inherit' });
  }
  
  // Re-read package.json in case it was updated by prerelease
  const pkg = require(excalidrawPackage);
  publish();
  console.info(`Published ${pkg.version}!`);
};

const nextVersion = process.argv.slice(2)[0];
if (!nextVersion) {
  console.error("Pass the next version to release!");
  process.exit(1);
}

release(nextVersion);
