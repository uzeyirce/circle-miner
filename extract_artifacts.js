const fs = require('fs');
const path = require('path');

const artifactPath = path.join(__dirname, 'artifacts', 'contracts', 'BasePlayAdventure.sol', 'BasePlayAdventure.json');

if (!fs.existsSync(artifactPath)) {
  console.error("Artifact not found! Run 'npx hardhat compile' first.");
  process.exit(1);
}

const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));

const outputContent = `// Auto-generated from Hardhat compilation. Do not edit.
const CONTRACT_ABI = ${JSON.stringify(artifact.abi, null, 2)};
const CONTRACT_BYTECODE = "${artifact.bytecode}";
`;

fs.writeFileSync(path.join(__dirname, 'artifacts.js'), outputContent);
console.log("Extracted ABI and Bytecode to artifacts.js successfully!");
