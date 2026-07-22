const hre = require("hardhat");

async function main() {
  // The token now lives in a SEPARATE, externally-deployed ERC20 contract.
  // Paste its address here before deploying the game contract.
  const CPLAY_TOKEN_ADDRESS = process.env.CPLAY_TOKEN_ADDRESS || "0xPASTE_YOUR_EXTERNAL_TOKEN_ADDRESS_HERE";

  if (!CPLAY_TOKEN_ADDRESS || CPLAY_TOKEN_ADDRESS.includes("PASTE")) {
    throw new Error("Set CPLAY_TOKEN_ADDRESS env var (or edit this file) to your external $CPLAY token address first.");
  }

  console.log("Deploying BasePlayAdventure game contract...");
  console.log("Pointing it at external $CPLAY token:", CPLAY_TOKEN_ADDRESS);

  const BasePlayAdventure = await hre.ethers.getContractFactory("BasePlayAdventure");
  const contract = await BasePlayAdventure.deploy(CPLAY_TOKEN_ADDRESS);

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
