require('dotenv').config();
const hre = require("hardhat");
const { ethers } = hre;

const V2 = '0x0e682f391241Eb774f97f17FA96E94750b621BAc';

async function main(){
  const [signer] = await ethers.getSigners();
  const v2 = await ethers.getContractAt("BasePlayAdventureV2", V2, signer);

  const tx = await v2.migrateUsernames(
    ['0x909D92d9A3650E4B5243419D641eA5809ba48D11',
     '0xdBeA182351AdF7C70EeD58E1787ef22371F7ec75'],
    ['DEV', 'joker']
  );
  console.log('tx:', tx.hash);
  await tx.wait();
  console.log('✅ Kullanici adlari migrate edildi');
}

main().catch(e => { console.error(e); process.exit(1); });
