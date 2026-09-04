require('dotenv').config();
const hre = require("hardhat");
const { ethers } = hre;

const VAULT = '0xB908AD7cdd1982BE5D21DC52046fA132C22846eE';
const V2 = '0x0e682f391241Eb774f97f17FA96E94750b621BAc';

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
