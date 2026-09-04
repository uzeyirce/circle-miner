require('dotenv').config();
const hre = require("hardhat");
const { ethers } = hre;

const VAULT = '0xB908AD7cdd1982BE5D21DC52046fA132C22846eE';
const V2 = '0x8a4E8a29904a38e320caAfc69cA21Ca2bC429856';

async function main(){
  const [signer] = await ethers.getSigners();
  const vault = new ethers.Contract(VAULT, [
    'function setGameContract(address) external',
    'function gameContract() view returns (address)'
  ], signer);

  console.log('Mevcut game contract:', await vault.gameContract());
  const tx = await vault.setGameContract(V2);
  console.log('tx:', tx.hash);
  await tx.wait();
  console.log('✅ Yeni game contract:', await vault.gameContract());
}
main().catch(e => { console.error(e); process.exit(1); });
