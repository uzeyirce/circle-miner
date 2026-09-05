require('dotenv').config();
const hre = require("hardhat");
const { ethers } = hre;

const GAME = '0x8a4E8a29904a38e320caAfc69cA21Ca2bC429856';

async function main(){
  const [s] = await ethers.getSigners();
  const g = await ethers.getContractAt("BasePlayAdventureV2", GAME, s);

  console.log('Mevcut faucetEnabled:', await g.faucetEnabled());
  const tx = await g.setFaucetEnabled(false);
  console.log('tx:', tx.hash);
  await tx.wait();
  console.log('✅ Yeni faucetEnabled:', await g.faucetEnabled());
}

main().catch(e => { console.error(e.message); process.exit(1); });
