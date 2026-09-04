require('dotenv').config();
const hre = require("hardhat");
const { ethers } = hre;
const V2 = '0x0e682f391241Eb774f97f17FA96E94750b621BAc';

async function main(){
  const [s] = await ethers.getSigners();
  const g = await ethers.getContractAt("BasePlayAdventureV2", V2, s);
  const [hasPending,,,, canReveal, expired] = await g.getPendingFlip(s.address);
  console.log({hasPending, canReveal, expired});
  if(!hasPending) return console.log('Bekleyen flip yok.');
  if(!expired) return console.log('Henuz expire olmadi, ~4 dakika bekle sonra tekrar calistir.');
  const tx = await g.forfeitExpiredFlip();
  await tx.wait();
  console.log('✅ Temizlendi, artik bahis yapabilirsin.');
}
main().catch(e => { console.error(e.message); process.exit(1); });
