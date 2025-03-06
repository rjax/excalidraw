const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const packagePath = path.join(process.cwd(), 'packages', 'excalidraw');
const pkg = JSON.parse(fs.readFileSync(path.join(packagePath, 'package.json')));

// Create git tag
const tag = `v${pkg.version}`;
execSync(`git tag ${tag}`);
execSync(`git push origin ${tag}`);

// Push changes
execSync('git push');

console.log(`Tagged and pushed version ${pkg.version}`);