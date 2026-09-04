require('dotenv').config();
const { ethers } = require('ethers');

const GAME_ADDRESS = '0xd67d5a4559d07e8154E0B0dd2DB72597f727e748';
const CHUNK_SIZE = 2000; // RPC log limiti aşılmasın diye parça parça çek
const LOOKBACK_BLOCKS = 200000; // gerekirse artırırız

const EVENT_ABI = [
  'event CoinFlipResult(address indexed player, bool betHeads, bool won, uint256 betAmount, uint256 devFee, uint256 payout, uint256 seed)'
];

async function main(){
const provider = new ethers.JsonRpcProvider(process.env.ARC_RPC_URL, undefined, {
  batchMaxCount: 1 // her isteği ayrı ayrı gönder, batch'leme
});
 const contract = new ethers.Contract(GAME_ADDRESS, EVENT_ABI, provider);

  const latest = await provider.getBlockNumber();
  const fromStart = Math.max(0, latest - LOOKBACK_BLOCKS);

  console.log(`Taranıyor: blok ${fromStart} -> ${latest} (${latest - fromStart} blok)`);

  const allEvents = [];
  for(let from = fromStart; from <= latest; from += CHUNK_SIZE){
    const to = Math.min(from + CHUNK_SIZE - 1, latest);
    try{
      const logs = await contract.queryFilter(contract.filters.CoinFlipResult(), from, to);
      allEvents.push(...logs);
      if(logs.length) process.stdout.write(`  [${from}-${to}] +${logs.length} flip\n`);
    }catch(err){
      console.error(`  [${from}-${to}] HATA: ${err.message}`);
    }
  }

  console.log(`\nToplam flip: ${allEvents.length}\n`);
  if(allEvents.length === 0){
    console.log('Hiç flip bulunamadı — LOOKBACK_BLOCKS aralığını artırmak gerekebilir.');
    return;
  }

  // --- Genel dağılım ---
  let totalWon = 0;
  const byPlayer = {};

  for(const ev of allEvents){
    const { player, won } = ev.args;
    if(won) totalWon++;
    if(!byPlayer[player]) byPlayer[player] = [];
    byPlayer[player].push({ won, block: ev.blockNumber, tx: ev.transactionHash });
  }

  const winRate = (totalWon / allEvents.length * 100).toFixed(2);
  console.log(`GENEL KAZANMA ORANI: ${winRate}% (beklenen ~50%)`);
  console.log(`Toplam oyuncu: ${Object.keys(byPlayer).length}\n`);

  // --- Şüpheli seriler: art arda 5+ kayıp yaşayan oyuncular ---
  console.log('--- 5+ ARDIŞIK KAYIP YAŞAYAN OYUNCULAR ---');
  let foundAny = false;

  for(const [player, flips] of Object.entries(byPlayer)){
    flips.sort((a,b) => a.block - b.block);
    let streak = 0, maxStreak = 0;
    for(const f of flips){
      streak = f.won ? 0 : streak + 1;
      maxStreak = Math.max(maxStreak, streak);
    }
    if(maxStreak >= 5){
      foundAny = true;
      const wins = flips.filter(f => f.won).length;
      console.log(`${player} — ${flips.length} flip, ${wins} kazanç, en uzun kayıp serisi: ${maxStreak}`);
    }
  }
  if(!foundAny) console.log('(yok)');
}

main().catch(console.error);
