require("dotenv").config();

const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

/*
============================================================
 CPLAY AIRDROP SPENDER ANALYSIS
============================================================

Airdrop wallets:
    holders_addresses.txt

Start block:
    11,675,331

CPLAY:
    0x8613155fF713c13F6C177275Af9bF195e69dEd34

GAME:
    0xd67d5a4559d07e8154E0B0dd2DB72597f727e748

VAULT:
    0xB908AD7cdd1982BE5D21DC52046fA132C22846eE

The script analyses:

1. CPLAY purchases
2. CPLAY transfers
3. Vault deposits
4. Lucky Flip games
5. 10 CPLAY games
6. Non-10 CPLAY games
7. Miner upgrades
8. Click upgrades
9. Total game spending
10. Player-by-player activity
11. CSV report

IMPORTANT:
Infura batch is disabled for this project.
We therefore disable ethers batching.
============================================================
*/

const RPC_URL =
  process.env.ARC_RPC_URL ||
  process.env.RPC_URL ||
  process.env.ARC_RPC ||
  "";

const START_BLOCK = 11675331;

const CPLAY =
  "0x8613155fF713c13F6C177275Af9bF195e69dEd34";

const GAME =
  "0xd67d5a4559d07e8154E0B0dd2DB72597f727e748";

const VAULT =
  "0xB908AD7cdd1982BE5D21DC52046fA132C22846eE";

const CHAIN_ID = 5042;

const CHUNK_SIZE = 2000;

const HOLDERS_FILE =
  path.join(process.cwd(), "holders_addresses.txt");

const OUTPUT_CSV =
  path.join(process.cwd(), "cplay-airdrop-spender-report.csv");

const OUTPUT_JSON =
  path.join(process.cwd(), "cplay-airdrop-spender-report.json");

if (!RPC_URL) {
  console.error("\nERROR: RPC URL bulunamadı.\n");
  console.error("`.env` içine örneğin şunu koy:");
  console.error(
    "ARC_RPC_URL=https://arc-mainnet.infura.io/v3/YOUR_PROJECT_ID\n"
  );
  process.exit(1);
}

/*
============================================================
 PROVIDER
============================================================
*/

// Infura batch disabled sorununu önlemek için
// staticNetwork + batchMaxCount: 1 kullanıyoruz.

const network = {
  name: "arc",
  chainId: CHAIN_ID
};

const provider = new ethers.JsonRpcProvider(
  RPC_URL,
  network,
  {
    staticNetwork: true,
    batchMaxCount: 1
  }
);

/*
============================================================
 ABIs
============================================================
*/

const ERC20_ABI = [
  "event Transfer(address indexed from,address indexed to,uint256 value)",
  "function balanceOf(address account) view returns(uint256)",
  "function decimals() view returns(uint8)",
  "function symbol() view returns(string)"
];

const GAME_ABI = [
  /*
   * Lucky Flip
   */
  "function coinFlip(bool heads,uint256 amount)",

  /*
   * Upgrades
   */
  "function buyClickUpgrade()",
  "function buyMinerUpgrade()",

  /*
   * Profile
   */
  "function getPlayerProfile(address player) view returns (uint256 balance,bool circleMinerEnabled,bool luckyFlipEnabled,uint256 allowance,uint256 vaultBalance,string username,uint256 totalWinnings,bool faucetClaimed,uint256 minerLevel,uint256 clickLevel,uint256 pendingRewards)",

  /*
   * Costs
   */
  "function getClickUpgradeCost(uint256 level) view returns(uint256)",
  "function getUpgradeCost(uint256 level) view returns(uint256)",

  /*
   * Events
   */
  "event CoinFlipResult(address indexed player,bool won,uint256 bet,uint256 payout)"
];

const token = new ethers.Contract(
  CPLAY,
  ERC20_ABI,
  provider
);

const game = new ethers.Contract(
  GAME,
  GAME_ABI,
  provider
);

/*
============================================================
 HOLDERS
============================================================
*/

function loadHolders() {
  if (!fs.existsSync(HOLDERS_FILE)) {
    throw new Error(
      `holders file bulunamadı: ${HOLDERS_FILE}`
    );
  }

  const lines = fs
    .readFileSync(HOLDERS_FILE, "utf8")
    .split(/\r?\n/)
    .map(x => x.trim())
    .filter(Boolean);

  const valid = [];

  for (const line of lines) {
    try {
      const addr = ethers.getAddress(line);
      valid.push(addr);
    } catch (_) {
      console.warn(
        `Geçersiz adres atlandı: ${line}`
      );
    }
  }

  return [...new Set(valid)];
}

/*
============================================================
 PLAYER DATA
============================================================
*/

function createPlayer(address) {
  return {
    address,

    /*
     * Airdrop
     */
    airdropReceived: 0n,

    /*
     * CPLAY purchases
     */
    cplayBought: 0n,
    cplayBuyTransactions: 0,

    /*
     * Vault
     */
    vaultSent: 0n,

    /*
     * Flip
     */
    flipCount: 0,
    flip10Count: 0,
    flipOtherCount: 0,

    totalBets: 0n,
    totalPayouts: 0n,
    wins: 0,
    losses: 0,

    /*
     * Upgrades
     */
    minerUpgradeCount: 0,
    clickUpgradeCount: 0,

    minerUpgradeSpend: 0n,
    clickUpgradeSpend: 0n,

    /*
     * Generic game spending
     */
    gameSpend: 0n,

    /*
     * All outgoing CPLAY
     */
    totalOutgoing: 0n,

    /*
     * Flags
     */
    boughtCplay: false,
    played: false,
    played10: false,
    playedOther: false,
    boughtMiner: false,
    boughtClick: false,

    /*
     * First / last activity
     */
    firstActivityBlock: null,
    lastActivityBlock: null
  };
}

/*
============================================================
 HELPERS
============================================================
*/

function getPlayer(map, address) {
  const checksum = ethers.getAddress(address);

  if (!map.has(checksum)) {
    map.set(checksum, createPlayer(checksum));
  }

  return map.get(checksum);
}

function formatCplay(value) {
  return Number(
    ethers.formatUnits(value, 18)
  ).toLocaleString("en-US", {
    maximumFractionDigits: 4
  });
}

function csvEscape(value) {
  const str = String(value ?? "");

  if (
    str.includes(",") ||
    str.includes('"') ||
    str.includes("\n")
  ) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

function updateActivity(
  player,
  blockNumber
) {
  if (
    player.firstActivityBlock === null ||
    blockNumber < player.firstActivityBlock
  ) {
    player.firstActivityBlock = blockNumber;
  }

  if (
    player.lastActivityBlock === null ||
    blockNumber > player.lastActivityBlock
  ) {
    player.lastActivityBlock = blockNumber;
  }
}

/*
============================================================
 RPC LOG SCANNER
============================================================
*/

async function scanLogs(
  contractAddress,
  topics,
  fromBlock,
  toBlock
) {
  const logs = [];

  let from = fromBlock;

  while (from <= toBlock) {
    const to = Math.min(
      from + CHUNK_SIZE - 1,
      toBlock
    );

    process.stdout.write(
      `\rScanning ${from.toLocaleString()} -> ${to.toLocaleString()}`
    );

    try {
      const result =
        await provider.getLogs({
          address: contractAddress,
          topics,
          fromBlock: from,
          toBlock: to
        });

      logs.push(...result);
    } catch (error) {
      console.error(
        `\nRPC error ${from}-${to}:`,
        error.shortMessage ||
          error.message ||
          error
      );

      /*
       * Eğer chunk hata verirse daha küçük chunk
       * ile tekrar deniyoruz.
       */

      if (to - from > 100) {
        const smaller = await scanLogs(
          contractAddress,
          topics,
          from,
          Math.min(from + 499, to)
        );

        logs.push(...smaller);

        from += 500;
        continue;
      } else {
        throw error;
      }
    }

    from = to + 1;
  }

  console.log();

  return logs;
}

/*
============================================================
 TRANSFER ANALYSIS
============================================================
*/

async function analyseTransfers(
  holders,
  players,
  latestBlock
) {
  console.log("\n==============================================");
  console.log(" CPLAY TRANSFER ANALYSIS");
  console.log("==============================================");

  console.log(
    `Blocks: ${START_BLOCK.toLocaleString()} -> ${latestBlock.toLocaleString()}`
  );

  /*
   * ERC20 Transfer topic
   */
  const transferTopic =
    ethers.id(
      "Transfer(address,address,uint256)"
    );

  /*
   * Önce bütün Transfer eventlerini tarıyoruz.
   */

  const logs = await scanLogs(
    CPLAY,
    [transferTopic],
    START_BLOCK,
    latestBlock
  );

  console.log(
    `CPLAY Transfer logs found: ${logs.length.toLocaleString()}`
  );

  const holderSet = new Set(
    [...holders].map(x => x.toLowerCase())
  );

  const vaultLower =
    VAULT.toLowerCase();

  const gameLower =
    GAME.toLowerCase();

  const tokenInterface =
    new ethers.Interface(ERC20_ABI);

  for (const log of logs) {
    let parsed;

    try {
      parsed =
        tokenInterface.parseLog({
          topics: log.topics,
          data: log.data
        });
    } catch (_) {
      continue;
    }

    if (!parsed) continue;

    const from =
      parsed.args.from;

    const to =
      parsed.args.to;

    const value =
      parsed.args.value;

    const fromLower =
      from.toLowerCase();

    const toLower =
      to.toLowerCase();

    /*
     * Airdrop received
     */
    if (
      holderSet.has(toLower) &&
      fromLower !== ethers.ZeroAddress.toLowerCase()
    ) {
      const player =
        getPlayer(players, to);

      player.airdropReceived += value;

      updateActivity(
        player,
        log.blockNumber
      );
    }

    /*
     * CPLAY satın alma tespiti

       Bunun için holder -> olmayan adres
       şeklindeki transferleri değil,

       dışarıdan holder'a gelen CPLAY'yi
       satın alma adayı olarak işaretliyoruz.

       Airdrop dağıtıcısını hariç tutuyoruz.
    */

    if (
      holderSet.has(toLower) &&
      !holderSet.has(fromLower) &&
      fromLower !== ethers.ZeroAddress.toLowerCase()
    ) {
      const player =
        getPlayer(players, to);

      /*
       * Game veya vault'tan gelen ödüller
       * "purchase" sayılmıyor.
       */

      if (
        fromLower !== gameLower &&
        fromLower !== vaultLower
      ) {
        player.cplayBought += value;
        player.cplayBuyTransactions++;
        player.boughtCplay = true;
      }
    }

    /*
     * Vault'a giden CPLAY
     */

    if (
      toLower === vaultLower &&
      holderSet.has(fromLower)
    ) {
      const player =
        getPlayer(players, from);

      player.vaultSent += value;
      player.totalOutgoing += value;

      updateActivity(
        player,
        log.blockNumber
      );
    }

    /*
     * Holder -> Game

       Bunlar daha sonra game eventleriyle
       daha detaylı sınıflandırılacak.
    */

    if (
      toLower === gameLower &&
      holderSet.has(fromLower)
    ) {
      const player =
        getPlayer(players, from);

      player.gameSpend += value;
      player.totalOutgoing += value;

      updateActivity(
        player,
        log.blockNumber
      );
    }
  }
}

/*
============================================================
 GAME EVENT ANALYSIS
============================================================
*/

async function analyseGameEvents(
  holders,
  players,
  latestBlock
) {
  console.log("\n==============================================");
  console.log(" GAME EVENT ANALYSIS");
  console.log("==============================================");

  const coinFlipTopic =
    ethers.id(
      "CoinFlipResult(address,bool,uint256,uint256)"
    );

  const logs =
    await scanLogs(
      GAME,
      [coinFlipTopic],
      START_BLOCK,
      latestBlock
    );

  console.log(
    `CoinFlipResult logs found: ${logs.length.toLocaleString()}`
  );

  const iface =
    new ethers.Interface(GAME_ABI);

  const holderSet =
    new Set(
      [...holders].map(
        x => x.toLowerCase()
      )
    );

  for (const log of logs) {
    let parsed;

    try {
      parsed =
        iface.parseLog({
          topics: log.topics,
          data: log.data
        });
    } catch (_) {
      continue;
    }

    if (!parsed) continue;

    const playerAddress =
      parsed.args.player;

    const playerLower =
      playerAddress.toLowerCase();

    if (!holderSet.has(playerLower)) {
      continue;
    }

    const player =
      getPlayer(players, playerAddress);

    const won =
      parsed.args.won;

    const bet =
      parsed.args.bet;

    const payout =
      parsed.args.payout;

    player.flipCount++;
    player.totalBets += bet;
    player.totalPayouts += payout;

    player.played = true;

    if (
      bet === ethers.parseEther("10")
    ) {
      player.flip10Count++;
      player.played10 = true;
    } else {
      player.flipOtherCount++;
      player.playedOther = true;
    }

    if (won) {
      player.wins++;
    } else {
      player.losses++;
    }

    updateActivity(
      player,
      log.blockNumber
    );
  }
}

/*
============================================================
 METHOD-BASED GAME SPENDING
============================================================

CPLAY Transfer eventleri ile Game eventlerini
birleştiriyoruz.

Ancak upgrade fonksiyonlarının maliyetini
doğrudan eventten bilemiyorsak transaction
input + receipt üzerinden tespit ediyoruz.

Bunun için Game kontratına ait transaction
hash'lerini buluyoruz.
============================================================
*/

async function analyseGameTransactions(
  holders,
  players,
  latestBlock
) {
  console.log("\n==============================================");
  console.log(" GAME TRANSACTION ANALYSIS");
  console.log("==============================================");

  /*
   * Function selectors
   */

  const clickSelector =
    ethers.id(
      "buyClickUpgrade()"
    ).slice(0, 10);

  const minerSelector =
    ethers.id(
      "buyMinerUpgrade()"
    ).slice(0, 10);

  const coinFlipSelector =
    ethers.id(
      "coinFlip(bool,uint256)"
    ).slice(0, 10);

  console.log(
    `buyClickUpgrade selector: ${clickSelector}`
  );

  console.log(
    `buyMinerUpgrade selector: ${minerSelector}`
  );

  console.log(
    `coinFlip selector: ${coinFlipSelector}`
  );

  /*
   * getLogs ile Game adresindeki bütün logsları
   * tarıyoruz.

   * Transaction hashlerini buradan topluyoruz.
   */

  const allGameLogs =
    await scanLogs(
      GAME,
      [],
      START_BLOCK,
      latestBlock
    );

  console.log(
    `Game logs scanned: ${allGameLogs.length.toLocaleString()}`
  );

  const txHashes =
    [...new Set(
      allGameLogs.map(
        x => x.transactionHash
      )
    )];

  console.log(
    `Unique game txs: ${txHashes.length.toLocaleString()}`
  );

  const holderSet =
    new Set(
      [...holders].map(
        x => x.toLowerCase()
      )
    );

  let processed = 0;

  for (const txHash of txHashes) {
    processed++;

    if (
      processed % 50 === 0 ||
      processed === txHashes.length
    ) {
      process.stdout.write(
        `\rGame tx processing: ${processed}/${txHashes.length}`
      );
    }

    let tx;

    try {
      tx =
        await provider.getTransaction(
          txHash
        );
    } catch (_) {
      continue;
    }

    if (!tx) continue;

    const from =
      tx.from;

    const fromLower =
      from.toLowerCase();

    if (!holderSet.has(fromLower)) {
      continue;
    }

    const player =
      getPlayer(players, from);

    const data =
      tx.data || "";

    const selector =
      data.slice(0, 10);

    /*
     * CLICK UPGRADE
     */

    if (
      selector.toLowerCase() ===
      clickSelector.toLowerCase()
    ) {
      player.clickUpgradeCount++;
      player.boughtClick = true;

      updateActivity(
        player,
        tx.blockNumber
      );

      /*
       * Gerçek harcamayı CPLAY Transfer
       * zaten gameSpend'e yazdı.
       */
    }

    /*
     * MINER UPGRADE
     */

    if (
      selector.toLowerCase() ===
      minerSelector.toLowerCase()
    ) {
      player.minerUpgradeCount++;
      player.boughtMiner = true;

      updateActivity(
        player,
        tx.blockNumber
      );
    }
  }

  console.log();
}

/*
============================================================
 PROFILE ANALYSIS
============================================================

Sadece aktif kullanıcıların gerçek on-chain
profillerini okuyoruz.

RPC'yi gereksiz yere 1984 kez çağırmamak için
sadece aktivitesi olanları kontrol ediyoruz.
============================================================
*/

async function analyseProfiles(
  players
) {
  console.log("\n==============================================");
  console.log(" PLAYER PROFILE ANALYSIS");
  console.log("==============================================");

  const active =
    [...players.values()]
      .filter(p =>
        p.played ||
        p.boughtMiner ||
        p.boughtClick ||
        p.cplayBought ||
        p.vaultSent > 0n
      );

  console.log(
    `Active players: ${active.length}`
  );

  let processed = 0;

  for (const player of active) {
    processed++;

    if (
      processed % 25 === 0 ||
      processed === active.length
    ) {
      process.stdout.write(
        `\rProfiles: ${processed}/${active.length}`
      );
    }

    try {
      const result =
        await game.getPlayerProfile(
          player.address
        );

      player.onchainBalance =
        result[0];

      player.onchainMinerLevel =
        result[8];

      player.onchainClickLevel =
        result[9];

    } catch (_) {
      player.onchainBalance = 0n;
      player.onchainMinerLevel = 0n;
      player.onchainClickLevel = 0n;
    }
  }

  console.log();
}

/*
============================================================
 SUMMARY
============================================================
*/

function buildSummary(
  holders,
  players
) {
  const list =
    [...players.values()];

  /*
   * Only airdrop holders
   */
  const airdropPlayers =
    holders.map(
      address =>
        players.get(
          ethers.getAddress(address)
        ) ||
        createPlayer(
          ethers.getAddress(address)
        )
    );

  const active =
    airdropPlayers.filter(
      p =>
        p.played ||
        p.cplayBought ||
        p.boughtMiner ||
        p.boughtClick ||
        p.vaultSent > 0n
    );

  const played10 =
    airdropPlayers.filter(
      p => p.played10
    );

  const playedOther =
    airdropPlayers.filter(
      p => p.playedOther
    );

  const cplayBuyers =
    airdropPlayers.filter(
      p => p.cplayBought
    );

  const minerPlayers =
    airdropPlayers.filter(
      p => p.boughtMiner
    );

  const clickPlayers =
    airdropPlayers.filter(
      p => p.boughtClick
    );

  const vaultPlayers =
    airdropPlayers.filter(
      p => p.vaultSent > 0n
    );

  const totalBets =
    airdropPlayers.reduce(
      (a, p) => a + (p.totalBets || 0n),
      0n
    );

  const totalPayouts =
    airdropPlayers.reduce(
      (a, p) => a + (p.totalPayouts || 0n),
      0n
    );

  const totalPurchases =
    airdropPlayers.reduce(
      (a, p) => a + (p.cplayBought || 0n),
      0n
    );

  const totalVault =
    airdropPlayers.reduce(
      (a, p) => a + (p.vaultSent || 0n),
      0n
    );

  const totalGames =
    airdropPlayers.reduce(
      (a, p) => a + (p.flipCount || 0),
      0
    );

  console.log("\n");
  console.log("==============================================");
  console.log("          CPLAY AIRDROP SUMMARY");
  console.log("==============================================");

  console.log(
    `Airdrop wallets              : ${holders.length}`
  );

  console.log(
    `Active wallets               : ${active.length}`
  );

  console.log(
    `CPLAY buyers                 : ${cplayBuyers.length}`
  );

  console.log(
    `Players                      : ${active.filter(p => p.played).length}`
  );

  console.log(
    `10 CPLAY players             : ${played10.length}`
  );

  console.log(
    `Non-10 CPLAY players         : ${playedOther.length}`
  );

  console.log(
    `Miner buyers                 : ${minerPlayers.length}`
  );

  console.log(
    `Click upgrade buyers         : ${clickPlayers.length}`
  );

  console.log(
    `Vault users                  : ${vaultPlayers.length}`
  );

  console.log(
    `Total games                  : ${totalGames.toLocaleString()}`
  );

  console.log(
    `Total CPLAY bet              : ${formatCplay(totalBets)}`
  );

  console.log(
    `Total CPLAY payout           : ${formatCplay(totalPayouts)}`
  );

  console.log(
    `Total CPLAY purchased        : ${formatCplay(totalPurchases)}`
  );

  console.log(
    `Total CPLAY sent to vault    : ${formatCplay(totalVault)}`
  );

  /*
   * 10 CPLAY / Other
   */

  const tenGames =
    airdropPlayers.reduce(
      (a, p) => a + p.flip10Count,
      0
    );

  const otherGames =
    airdropPlayers.reduce(
      (a, p) => a + p.flipOtherCount,
      0
    );

  console.log(
    `10 CPLAY games               : ${tenGames.toLocaleString()}`
  );

  console.log(
    `Other amount games           : ${otherGames.toLocaleString()}`
  );

  /*
   * Top spenders
   */

  console.log("\n==============================================");
  console.log(" TOP GAME SPENDERS");
  console.log("==============================================");

  const top =
    [...airdropPlayers]
      .filter(
        p =>
          p.totalBets > 0n ||
          p.boughtMiner ||
          p.boughtClick
      )
      .sort(
        (a, b) => {
          const av =
            a.totalBets +
            a.minerUpgradeSpend +
            a.clickUpgradeSpend;

          const bv =
            b.totalBets +
            b.minerUpgradeSpend +
            b.clickUpgradeSpend;

          if (bv > av) return 1;
          if (bv < av) return -1;
          return 0;
        }
      )
      .slice(0, 25);

  top.forEach(
    (p, index) => {
      console.log(
        `${String(index + 1).padStart(2)}. ${p.address} | bets=${formatCplay(p.totalBets)} | games=${p.flipCount} | miner=${p.minerUpgradeCount} | click=${p.clickUpgradeCount}`
      );
    }
  );

  /*
   * Purchased CPLAY
   */

  console.log("\n==============================================");
  console.log(" CPLAY BUYERS");
  console.log("==============================================");

  const buyers =
    [...cplayBuyers]
      .sort(
        (a, b) =>
          b.cplayBought > a.cplayBought
            ? 1
            : b.cplayBought < a.cplayBought
              ? -1
              : 0
      );

  buyers
    .slice(0, 50)
    .forEach(
      (p, index) => {
        console.log(
          `${String(index + 1).padStart(2)}. ${p.address} | bought=${formatCplay(p.cplayBought)} CPLAY | games=${p.flipCount} | miner=${p.minerUpgradeCount} | click=${p.clickUpgradeCount}`
        );
      }
    );

  /*
   * Miner buyers
   */

  console.log("\n==============================================");
  console.log(" MINER BUYERS");
  console.log("==============================================");

  minerPlayers.forEach(
    (p, index) => {
      console.log(
        `${String(index + 1).padStart(2)}. ${p.address} | miner upgrades=${p.minerUpgradeCount} | games=${p.flipCount} | bought=${formatCplay(p.cplayBought)}`
      );
    }
  );

  /*
   * 10 CPLAY
   */

  console.log("\n==============================================");
  console.log(" 10 CPLAY PLAYERS");
  console.log("==============================================");

  played10.forEach(
    (p, index) => {
      console.log(
        `${String(index + 1).padStart(2)}. ${p.address} | games=${p.flip10Count} | total bets=${formatCplay(p.totalBets)}`
      );
    }
  );

  /*
   * Other
   */

  console.log("\n==============================================");
  console.log(" NON-10 CPLAY PLAYERS");
  console.log("==============================================");

  playedOther.forEach(
    (p, index) => {
      console.log(
        `${String(index + 1).padStart(2)}. ${p.address} | games=${p.flipOtherCount} | total bets=${formatCplay(p.totalBets)}`
      );
    }
  );

  return {
    airdropWallets: holders.length,
    activeWallets: active.length,
    cplayBuyers: cplayBuyers.length,
    players: active.filter(p => p.played).length,
    tenCplayPlayers: played10.length,
    otherPlayers: playedOther.length,
    minerBuyers: minerPlayers.length,
    clickUpgradeBuyers: clickPlayers.length,
    vaultUsers: vaultPlayers.length,
    totalGames,
    totalBets,
    totalPayouts,
    totalPurchases,
    totalVault
  };
}

/*
============================================================
 CSV
============================================================
*/

function writeCSV(
  holders,
  players
) {
  const rows = [];

  rows.push([
    "address",
    "airdrop_received",
    "cplay_bought",
    "buy_transactions",
    "vault_sent",
    "played",
    "flip_count",
    "flip_10_count",
    "flip_other_count",
    "total_bets",
    "total_payouts",
    "wins",
    "losses",
    "miner_upgrade_count",
    "click_upgrade_count",
    "bought_miner",
    "bought_click",
    "onchain_miner_level",
    "onchain_click_level",
    "onchain_balance",
    "first_activity_block",
    "last_activity_block"
  ].join(","));

  for (const address of holders) {
    const checksum =
      ethers.getAddress(address);

    const p =
      players.get(checksum) ||
      createPlayer(checksum);

    rows.push([
      p.address,
      formatCplay(p.airdropReceived),
      formatCplay(p.cplayBought),
      p.cplayBuyTransactions,
      formatCplay(p.vaultSent),
      p.played,
      p.flipCount,
      p.flip10Count,
      p.flipOtherCount,
      formatCplay(p.totalBets),
      formatCplay(p.totalPayouts),
      p.wins,
      p.losses,
      p.minerUpgradeCount,
      p.clickUpgradeCount,
      p.boughtMiner,
      p.boughtClick,
      p.onchainMinerLevel ?? 0,
      p.onchainClickLevel ?? 0,
      formatCplay(p.onchainBalance ?? 0n),
      p.firstActivityBlock ?? "",
      p.lastActivityBlock ?? ""
    ].map(csvEscape).join(","));
  }

  fs.writeFileSync(
    OUTPUT_CSV,
    rows.join("\n")
  );

  console.log(
    `\nCSV written: ${OUTPUT_CSV}`
  );
}

/*
============================================================
 JSON
============================================================
*/

function writeJSON(
  holders,
  players,
  summary
) {
  const output = {
    generatedAt:
      new Date().toISOString(),

    chainId:
      CHAIN_ID,

    startBlock:
      START_BLOCK,

    cplay:
      CPLAY,

    game:
      GAME,

    vault:
      VAULT,

    summary: {
      ...summary,

      totalBets:
        formatCplay(
          summary.totalBets
        ),

      totalPayouts:
        formatCplay(
          summary.totalPayouts
        ),

      totalPurchases:
        formatCplay(
          summary.totalPurchases
        ),

      totalVault:
        formatCplay(
          summary.totalVault
        )
    },

    players:
      holders.map(
        address => {
          const checksum =
            ethers.getAddress(address);

          const p =
            players.get(checksum) ||
            createPlayer(checksum);

          return {
            address: p.address,

            airdropReceived:
              formatCplay(
                p.airdropReceived
              ),

            cplayBought:
              formatCplay(
                p.cplayBought
              ),

            cplayBuyTransactions:
              p.cplayBuyTransactions,

            vaultSent:
              formatCplay(
                p.vaultSent
              ),

            played:
              p.played,

            flipCount:
              p.flipCount,

            flip10Count:
              p.flip10Count,

            flipOtherCount:
              p.flipOtherCount,

            totalBets:
              formatCplay(
                p.totalBets
              ),

            totalPayouts:
              formatCplay(
                p.totalPayouts
              ),

            wins:
              p.wins,

            losses:
              p.losses,

            minerUpgradeCount:
              p.minerUpgradeCount,

            clickUpgradeCount:
              p.clickUpgradeCount,

            boughtMiner:
              p.boughtMiner,

            boughtClick:
              p.boughtClick,

            onchainMinerLevel:
              String(
                p.onchainMinerLevel ?? 0n
              ),

            onchainClickLevel:
              String(
                p.onchainClickLevel ?? 0n
              ),

            onchainBalance:
              formatCplay(
                p.onchainBalance ?? 0n
              ),

            firstActivityBlock:
              p.firstActivityBlock,

            lastActivityBlock:
              p.lastActivityBlock
          };
        }
      )
  };

  fs.writeFileSync(
    OUTPUT_JSON,
    JSON.stringify(
      output,
      null,
      2
    )
  );

  console.log(
    `JSON written: ${OUTPUT_JSON}`
  );
}

/*
============================================================
 MAIN
============================================================
*/

async function main() {
  console.log(`
==============================================
       CPLAY AIRDROP SPENDER ANALYSIS
==============================================
RPC: ${RPC_URL.replace(
    /\/v3\/[^/]+/,
    "/v3/**hidden**"
  )}
CPLAY: ${CPLAY}
Game: ${GAME}
Vault: ${VAULT}
Starting block: ${START_BLOCK.toLocaleString()}
Chain ID: ${CHAIN_ID}
`);

  /*
   * Network
   */

  const networkInfo =
    await provider.getNetwork();

  console.log(
    `Connected chain ID: ${networkInfo.chainId}`
  );

  if (
    networkInfo.chainId !==
    BigInt(CHAIN_ID)
  ) {
    throw new Error(
      `Wrong chain. Expected ${CHAIN_ID}, got ${networkInfo.chainId}`
    );
  }

  /*
   * Latest block
   */

  const latestBlock =
    await provider.getBlockNumber();

  console.log(
    `Latest block: ${latestBlock.toLocaleString()}`
  );

  /*
   * Holders
   */

  const holders =
    loadHolders();

  console.log(
    `Holders found: ${holders.length}`
  );

  /*
   * Player map
   */

  const players =
    new Map();

  for (const address of holders) {
    players.set(
      ethers.getAddress(address),
      createPlayer(
        ethers.getAddress(address)
      )
    );
  }

  /*
   * 1
   * CPLAY transfers
   */

  await analyseTransfers(
    holders,
    players,
    latestBlock
  );

  /*
   * 2
   * CoinFlipResult
   */

  await analyseGameEvents(
    holders,
    players,
    latestBlock
  );

  /*
   * 3
   * Upgrade transactions
   */

  await analyseGameTransactions(
    holders,
    players,
    latestBlock
  );

  /*
   * 4
   * On-chain profiles
   */

  await analyseProfiles(
    players
  );

  /*
   * 5
   * Summary
   */

  const summary =
    buildSummary(
      holders,
      players
    );

  /*
   * 6
   * CSV
   */

  writeCSV(
    holders,
    players
  );

  /*
   * 7
   * JSON
   */

  writeJSON(
    holders,
    players,
    summary
  );

  console.log("\n==============================================");
  console.log(" ANALYSIS COMPLETE");
  console.log("==============================================");

  console.log(
    `CSV : ${OUTPUT_CSV}`
  );

  console.log(
    `JSON: ${OUTPUT_JSON}`
  );

  console.log();
}

main()
  .catch(error => {
    console.error("\nERROR:\n");

    console.error(
      error?.stack ||
      error?.shortMessage ||
      error?.message ||
      error
    );

    process.exit(1);
  });
