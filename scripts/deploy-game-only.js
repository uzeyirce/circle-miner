const hre = require("hardhat");

async function main() {
  const CPLAY_TOKEN_ADDRESS = process.env.CPLAY_TOKEN_ADDRESS;
  const EXISTING_VAULT_ADDRESS = process.env.EXISTING_VAULT_ADDRESS;

  if (!CPLAY_TOKEN_ADDRESS) {
    throw new Error("Set CPLAY_TOKEN_ADDRESS env var first.");
  }
  if (!EXISTING_VAULT_ADDRESS) {
    throw new Error("Set EXISTING_VAULT_ADDRESS env var — the vault that already holds funds.");
  }

  console.log("Deploying BasePlayAdventure (game engine ONLY, reusing existing vault)...");
  console.log("Token:", CPLAY_TOKEN_ADDRESS);
  console.log("Existing Vault:", EXISTING_VAULT_ADDRESS);

  const BasePlayAdventure = await hre.ethers.getContractFactory("BasePlayAdventure");
  const game = await BasePlayAdventure.deploy(CPLAY_TOKEN_ADDRESS, EXISTING_VAULT_ADDRESS);
  await game.waitForDeployment();
  const gameAddress = await game.getAddress();
  console.log("New game contract deployed at:", gameAddress);

  console.log("Authorizing this game contract on the existing vault...");
  const vault = await hre.ethers.getContractAt("CPlayVault", EXISTING_VAULT_ADDRESS);
  const tx = await vault.setGameContract(gameAddress);
  await tx.wait();
  console.log("Vault now authorizes:", gameAddress);

  console.log("\n------------------------------------------------");
  console.log("DONE. New game contract address (use this in app.js):");
  console.log(gameAddress);
  console.log("------------------------------------------------");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
