import { createPublicClient, http, parseAbiItem } from 'viem';
import { base } from 'viem/chains';

const publicClient = createPublicClient({
  chain: base,
  transport: http('https://mainnet.base.org'),
});

const MESSAGE_TRANSMITTER = '0x81D40F21F12A8F0E3252Bccb954D722d4c464B64';

async function findOldDomain26() {
  const latest = await publicClient.getBlockNumber();
  // ~50,000-100,000 blok öncesine bak (Base'de ~2sn/blok, yani ~1-2 gün önce)
  const fromBlock = latest - 100000n;
  const toBlock = latest - 90000n; // eski bir pencere, finality kesin geçmiş olur

  console.log(`Eski blok aralığı taranıyor: ${fromBlock} -> ${toBlock}`);

  const logs = await publicClient.getLogs({
    address: MESSAGE_TRANSMITTER,
    event: parseAbiItem('event MessageSent(bytes message)'),
    fromBlock,
    toBlock,
  });

  for (const log of logs) {
    const messageBytes = log.args.message;
    if (!messageBytes) continue;
    const hex = messageBytes.slice(2);
    const destDomain = parseInt(hex.slice(16, 24), 16);
    if (destDomain === 26) {
      console.log("✅ Eski domain-26 mesajı bulundu!");
      console.log("tx hash:", log.transactionHash);
      console.log("block:", log.blockNumber);
      return log.transactionHash;
    }
  }
  console.log("Bu pencerede domain-26 mesajı bulunamadı, aralığı genişletmek gerekebilir.");
}

findOldDomain26().catch(console.error);
