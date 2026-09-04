require('dotenv').config();
const hre = require("hardhat");
const { ethers } = hre;

const GAME = '0x8a4E8a29904a38e320caAfc69cA21Ca2bC429856';

async function main(){
  const [s] = await ethers.getSigners();
  const g = await ethers.getContractAt("BasePlayAdventureV2", GAME, s);

  console.log('--- MEVCUT AYARLAR ---');
  console.log('baseMiningRate  :', ethers.formatEther(await g.baseMiningRate()), 'CPLAY/sn/level');
  console.log('coinflipPayout  :', Number(await g.coinflipPayoutBps()) / 10000, 'x');
  console.log('minerUpgradeBase:', ethers.formatEther(await g.minerUpgradeBase()), 'CPLAY');
  console.log('clickUpgradeBase:', ethers.formatEther(await g.clickUpgradeBase()), 'CPLAY');
  console.log('protocolFee     :', Number(await g.protocolFeeBps()) / 100, '%');

  // ==== DEGISTIRMEK ISTEDIKLERINI ACIP DUZENLE ====

  // Mining hizini 2x daha artir (0.005 -> 0.010 CPLAY/sn/level)
  let tx = await g.setBaseMiningRate(ethers.parseEther('0.01'));
  await tx.wait(); console.log('✅ baseMiningRate guncellendi');
  console.log('Yeni deger:', ethers.formatEther(await g.baseMiningRate()), 'CPLAY/sn/level');

  // Payout 2x (20000 bps) — DIKKAT: house edge sifirlanir
  // let tx = await g.setCoinflipPayoutBps(20000);
  // await tx.wait(); console.log('✅ payout 2x yapildi');

  // Payout 1.9x (daha dengeli alternatif)
  // let tx = await g.setCoinflipPayoutBps(19000);
  // await tx.wait(); console.log('✅ payout 1.9x yapildi');

  // Upgrade maliyetlerini yariya indir
  // let tx = await g.setMinerUpgradeBase(ethers.parseEther('50'));
  // await tx.wait(); console.log('✅ miner upgrade maliyeti dusuruldu');
}

main().catch(e => { console.error(e.message); process.exit(1); });
