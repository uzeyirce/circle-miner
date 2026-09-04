require('dotenv').config();
const hre = require("hardhat");
const { ethers } = hre;

const V1 = '0xd67d5a4559d07e8154E0B0dd2DB72597f727e748';
const V2 = '0x8a4E8a29904a38e320caAfc69cA21Ca2bC429856';

// Migrate edilecek adresleri elle yaz — tarama yok
const PLAYERS = [
  '0x909D92d9A3650E4B5243419D641eA5809ba48D11', // sen (DEV)
  '0xdBeA182351AdF7C70EeD58E1787ef22371F7ec75', // diger oyuncu
];

const V1_ABI = [
  'function minerStates(address) view returns (uint256 level, uint256 lastClaimTime)',
  'function clickLevels(address) view returns (uint256)',
  'function totalWinnings(address) view returns (uint256)',
  'function usernames(address) view returns (string)'
];

async function main(){
  const [signer] = await ethers.getSigners();
  const v1 = new ethers.Contract(V1, V1_ABI, signer.provider);
  const v2 = await ethers.getContractAt("BasePlayAdventureV2", V2, signer);

  const addrs = [], minerLevels = [], clickLvls = [], winnings = [];
  const nameAddrs = [], names = [];

  console.log('V1 state okunuyor...\n');
  for(const p of PLAYERS){
    const state = await v1.minerStates(p);
    const click = await v1.clickLevels(p);
    const win   = await v1.totalWinnings(p);
    const name  = await v1.usernames(p);

    console.log(`${p}`);
    console.log(`  miner L${state.level} | click L${click} | winnings ${ethers.formatEther(win)} CPLAY | "${name}"`);

    addrs.push(p);
    minerLevels.push(state.level);
    clickLvls.push(click);
    winnings.push(win);
    if(name && name.length > 0){ nameAddrs.push(p); names.push(name); }
  }

  console.log('\nV2\'ye yaziliyor...');
  const tx1 = await v2.migratePlayers(addrs, minerLevels, clickLvls, winnings);
  console.log('migratePlayers tx:', tx1.hash);
  await tx1.wait();
  console.log('✅ Oyuncu state migrate edildi');

  if(nameAddrs.length){
    const tx2 = await v2.migrateUsernames(nameAddrs, names);
    console.log('migrateUsernames tx:', tx2.hash);
    await tx2.wait();
    console.log('✅ Kullanici adlari migrate edildi');
  }

  console.log('\nSIRADAKI: vault.setGameContract("' + V2 + '")');
}

main().catch(e => { console.error(e); process.exit(1); });
