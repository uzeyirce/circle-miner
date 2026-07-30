const hre = require("hardhat");

async function main() {
  const CPLAY_TOKEN_ADDRESS = process.env.CPLAY_TOKEN_ADDRESS || "0xPASTE_YOUR_EXTERNAL_TOKEN_ADDRESS_HERE";

  if (!CPLAY_TOKEN_ADDRESS || CPLAY_TOKEN_ADDRESS.includes("PASTE")) {
    throw new Error("Set CPLAY_TOKEN_ADDRESS env var to your external $CPLAY token address first.");
  }

  console.log("========================================");
  console.log("STEP 1: Deploying CPlayVault...");
  console.log("========================================");
  const CPlayVault = await hre.ethers.getContractFactory("CPlayVault");
  const vault = await CPlayVault.deploy(CPLAY_TOKEN_ADDRESS);
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  console.log("CPlayVault deployed at:", vaultAddress);

  console.log("========================================");
  console.log("STEP 2: Deploying BasePlayAdventure (game engine)...");
  console.log("========================================");
  const BasePlayAdventure = await hre.ethers.getContractFactory("BasePlayAdventure");
  const game = await BasePlayAdventure.deploy(CPLAY_TOKEN_ADDRESS, vaultAddress);
  await game.waitForDeployment();
  const gameAddress = await game.getAddress();
  console.log("BasePlayAdventure deployed at:", gameAddress);

  console.log("========================================");
  console.log("STEP 3: Authorizing the game contract on the vault...");
  console.log("========================================");
  const tx = await vault.setGameContract(gameAddress);
  await tx.wait();
  console.log("Vault now authorizes:", gameAddress);

  console.log("\n------------------------------------------------");
  console.log("DEPLOYMENT COMPLETE");
  console.log("------------------------------------------------");
  console.log("Token:   ", CPLAY_TOKEN_ADDRESS);
  console.log("Vault:   ", vaultAddress);
  console.log("Game:    ", gameAddress);
  console.log("------------------------------------------------");
  console.log("Next: approve + fund the vault from your dev-buy wallet:");
  console.log(`  await token.approve("${vaultAddress}", amount)`);
  console.log(`  await vault.fund(amount)`);
  console.log("------------------------------------------------");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
