const hre = require("hardhat");

// ==== AYARLAR ====
const TOKEN_ADDRESS = "0x4cb8382b9dAF7992d3b27D32f7dB650C57881DaA";
const POOL_ADDRESS = "0x01be77f0a364bddafd34521892ea4745ebf9b5a2".toLowerCase();
const CHUNK_SIZE = 5000; // RPC "range too large" derse otomatik küçültülür

async function main() {
  const provider = hre.ethers.provider;

  const token = await hre.ethers.getContractAt(
    [
      "event Transfer(address indexed from, address indexed to, uint256 value)",
      "function decimals() view returns (uint8)",
      "function symbol() view returns (string)",
    ],
    TOKEN_ADDRESS
  );

  let decimals = 18;
  let symbol = "TOKEN";
  try {
    decimals = await token.decimals();
    symbol = await token.symbol();
  } catch (e) {
    console.log("decimals()/symbol() okunamadı, varsayılan 18 / TOKEN kullanılıyor.");
  }

  console.log(`Token: ${TOKEN_ADDRESS} (${symbol}, ${decimals} decimal)`);
  console.log(`Pool: ${POOL_ADDRESS}`);
  console.log("Transfer event'leri taranıyor, bu biraz zaman alabilir...\n");

  const latestBlock = await provider.getBlockNumber();
  let fromBlock = 0;
  let chunkSize = CHUNK_SIZE;
  const allLogs = [];

  const filter = token.filters.Transfer();

  while (fromBlock <= latestBlock) {
    const toBlock = Math.min(fromBlock + chunkSize, latestBlock);
    try {
      const logs = await token.queryFilter(filter, fromBlock, toBlock);
      allLogs.push(...logs);
      if (allLogs.length % 500 < logs.length) {
        console.log(`  ${fromBlock}-${toBlock} arası tarandı, toplam ${allLogs.length} transfer bulundu...`);
      }
      fromBlock = toBlock + 1;
    } catch (err) {
      chunkSize = Math.max(100, Math.floor(chunkSize / 2));
      console.warn(`  Aralık küçültülüyor -> ${chunkSize} blok (${err.message.slice(0, 80)})`);
    }
  }

  console.log(`\nToplam ${allLogs.length} Transfer event'i bulundu. Analiz ediliyor...\n`);

  // ==== SINIFLANDIRMA ====
  // wallet stats: { bought, sold, buyCount, sellCount }
  const stats = new Map();

  function getStat(addr) {
    if (!stats.has(addr)) {
      stats.set(addr, { bought: 0n, sold: 0n, buyCount: 0, sellCount: 0 });
    }
    return stats.get(addr);
  }

  let buyEvents = 0;
  let sellEvents = 0;
  let plainTransfers = 0;

  for (const log of allLogs) {
    const from = log.args.from.toLowerCase();
    const to = log.args.to.toLowerCase();
    const value = log.args.value;

    if (from === POOL_ADDRESS && to !== POOL_ADDRESS) {
      // BUY: pool -> wallet
      const s = getStat(to);
      s.bought += value;
      s.buyCount += 1;
      buyEvents++;
    } else if (to === POOL_ADDRESS && from !== POOL_ADDRESS) {
      // SELL: wallet -> pool
      const s = getStat(from);
      s.sold += value;
      s.sellCount += 1;
      sellEvents++;
    } else if (from !== POOL_ADDRESS && to !== POOL_ADDRESS) {
      // plain wallet-to-wallet transfer, not a trade — ignored in buy/sell stats
      plainTransfers++;
    }
  }

  const fmt = (v) => parseFloat(hre.ethers.formatUnits(v, decimals));

  const wallets = [...stats.entries()].map(([addr, s]) => {
    const net = s.bought - s.sold;
    return {
      address: addr,
      bought: fmt(s.bought),
      sold: fmt(s.sold),
      net: fmt(net),
      buyCount: s.buyCount,
      sellCount: s.sellCount,
      fullyExited: net <= 0n && s.sold > 0n,
      diamondHands: s.sellCount === 0 && s.buyCount > 0,
      activeTrader: s.buyCount > 1 && s.sellCount > 1,
    };
  });

  // ==== ÖZET ====
  console.log("======================================");
  console.log("ÖZET");
  console.log("======================================");
  console.log(`Toplam alım işlemi: ${buyEvents}`);
  console.log(`Toplam satım işlemi: ${sellEvents}`);
  console.log(`Cüzdan-cüzdan transfer (analiz dışı): ${plainTransfers}`);
  console.log(`Benzersiz cüzdan sayısı: ${wallets.length}`);
  console.log(`Elmas eller (hiç satmamış): ${wallets.filter(w => w.diamondHands).length}`);
  console.log(`Tamamen çıkmış (net <= 0): ${wallets.filter(w => w.fullyExited).length}`);
  console.log(`Aktif trader (1'den çok alım VE satım): ${wallets.filter(w => w.activeTrader).length}`);

  console.log("\n======================================");
  console.log("EN ÇOK TUTAN 15 CÜZDAN (net bakiye)");
  console.log("======================================");
  wallets
    .filter(w => w.net > 0)
    .sort((a, b) => b.net - a.net)
    .slice(0, 15)
    .forEach((w, i) => {
      console.log(`${i + 1}. ${w.address} — net: ${w.net.toFixed(2)} ${symbol} (alım: ${w.buyCount}, satım: ${w.sellCount})`);
    });

  console.log("\n======================================");
  console.log("EN ÇOK SATAN 15 CÜZDAN (toplam satılan miktar)");
  console.log("======================================");
  wallets
    .filter(w => w.sold > 0)
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 15)
    .forEach((w, i) => {
      console.log(`${i + 1}. ${w.address} — sattı: ${w.sold.toFixed(2)} ${symbol} (${w.fullyExited ? "TAMAMEN ÇIKTI" : "kısmi satış"})`);
    });

  console.log("\n======================================");
  console.log("EN AKTİF 15 TRADER (alım + satım sayısı)");
  console.log("======================================");
  wallets
    .sort((a, b) => (b.buyCount + b.sellCount) - (a.buyCount + a.sellCount))
    .slice(0, 15)
    .forEach((w, i) => {
      console.log(`${i + 1}. ${w.address} — ${w.buyCount} alım, ${w.sellCount} satım (net: ${w.net.toFixed(2)} ${symbol})`);
    });

  // JSON olarak da kaydet, ileride post için kullanmak üzere
  const fs = require("fs");
  fs.writeFileSync(
    "buildog_analysis.json",
    JSON.stringify({ symbol, decimals, buyEvents, sellEvents, plainTransfers, wallets }, null, 2)
  );
  console.log("\nTam veri buildog_analysis.json dosyasına kaydedildi.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
