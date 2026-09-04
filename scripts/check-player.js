require('dotenv').config();
const { ethers } = require('ethers');

const GAME_ADDRESS = '0xd67d5a4559d07e8154E0B0dd2DB72597f727e748';
const PLAYER = '0xdBeA182351AdF7C70EeD58E1787ef22371F7ec75';
const CHUNK_SIZE = 2000;
const LOOKBACK_BLOCKS = 500000;

const ABI = [
  'event CoinFlipResult(address indexed player, bool betHeads, bool won, uint256 betAmount, uint256 devFee, uint256 payout, uint256 seed)',
  'function totalWinnings(address) view returns (uint256)'
];

async function main(){
  const provider = new ethers.JsonRpcProvider(process.env.ARC_RPC_URL, undefined, { batchMaxCount: 1 });
  const contract = new ethers.Contract(GAME_ADDRESS, ABI, provider);

  const latest = await provider.getBlockNumber();
  const start = Math.max(0, latest - LOOKBACK_BLOCKS);
  console.log(`Taranıyor: ${start} -> ${latest}\nOyuncu: ${PLAYER}\n`);

  const filter = contract.filters.CoinFlipResult(PLAYER);
  const events = [];

  for(let from = start; from <= latest; from += CHUNK_SIZE){
    const to = Math.min(from + CHUNK_SIZE - 1, latest);
    try{
      const logs = await contract.queryFilter(filter, from, to);
      events.push(...logs);
    }catch(err){
      console.error(`  [${from}-${to}] HATA: ${err.message}`);
    }
  }

  if(events.length === 0){
    console.log('Bu adres için hiç flip bulunamadı (aralığı büyütmek gerekebilir).');
    return;
  }

  events.sort((a,b) => a.blockNumber - b.blockNumber);

  let totalBet = 0n, totalPayout = 0n, totalFee = 0n, wins = 0;

  console.log('--- FLIP GEÇMİŞİ ---');
  for(const ev of events){
    const { betHeads, won, betAmount, devFee, payout } = ev.args;
    totalBet += betAmount;
    totalPayout += payout;
    totalFee += devFee;
    if(won) wins++;
    console.log(
      `blok ${ev.blockNumber} | ${betHeads ? 'HEADS' : 'TAILS'} | ${won ? 'WIN ' : 'LOSS'} | ` +
      `bahis: ${ethers.formatEther(betAmount)} | ödeme: ${ethers.formatEther(payout)} | tx: ${ev.transactionHash}`
    );
  }

  const net = totalPayout - totalBet;

  console.log('\n--- ÖZET ---');
  console.log(`Toplam flip     : ${events.length}`);
  console.log(`Kazanç / Kayıp  : ${wins} / ${events.length - wins}`);
  console.log(`Kazanma oranı   : ${(wins/events.length*100).toFixed(1)}%`);
  console.log(`Toplam bahis    : ${ethers.formatEther(totalBet)} CPLAY`);
  console.log(`Toplam ödeme    : ${ethers.formatEther(totalPayout)} CPLAY`);
  console.log(`NET             : ${net >= 0n ? '+' : ''}${ethers.formatEther(net)} CPLAY`);

  const onChainWinnings = await contract.totalWinnings(PLAYER);
  console.log(`\nKontrattaki totalWinnings: ${ethers.formatEther(onChainWinnings)} CPLAY`);
}

main().catch(console.error);
