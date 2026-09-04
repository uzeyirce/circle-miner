const hre = require("hardhat");

async function main() {
  const TOKEN = process.env.CPLAY_TOKEN_ADDRESS;
  const VAULT = "0xB908AD7cdd1982BE5D21DC52046fA132C22846eE";

  if (!TOKEN) throw new Error("CPLAY_TOKEN_ADDRESS not set in .env");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);
  console.log("Token   :", TOKEN);
  console.log("Vault   :", VAULT);
  console.log("\nDeploying BasePlayAdventureV2...");

  const Game = await hre.ethers.getContractFactory("BasePlayAdventureV2");
  const game = await Game.deploy(TOKEN, VAULT);
  await game.waitForDeployment();

  const addr = await game.getAddress();

  console.log("\n✅ V2 deployed at:", addr);
  console.log("\n--- SONRAKI ADIMLAR ---");
  console.log("1. Oyuncu state migration (henuz vault'u cevirmeden)");
  console.log("2. vault.setGameContract('" + addr + "')  <-- kritik an, V1 odeme yapamaz olur");
  console.log("3. app.js -> GAME_ADDRESS['5042'] = '" + addr + "'");
  console.log("\nGeri donmek istersen: vault.setGameContract('0xd67d5a4559d07e8154E0B0dd2DB72597f727e748')");
}

main().catch(e => { console.error(e); process.exit(1); });
