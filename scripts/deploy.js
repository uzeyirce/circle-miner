const hre = require("hardhat");

async function main() {
  console.log("Deploying BasePlayAdventure contract...");
  const BasePlayAdventure = await hre.ethers.getContractFactory("BasePlayAdventure");
  const contract = await BasePlayAdventure.deploy();
  
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  
  console.log("------------------------------------------------");
  console.log("BasePlayAdventure contract deployed successfully!");
  console.log("Contract Address:", address);
  console.log("------------------------------------------------");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
