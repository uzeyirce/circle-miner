/**
 * Arc Cyber Miner & Lucky Flip
 * Web3 Client Logic using Ethers.js v6
 */

// Application State
let provider = null;
let signer = null;
let contract = null;
let walletAddress = null;
let currentChainId = null;
let localClicks = 0;
let pendingClaimLocal = 0.0;
let miningUpdateInterval = null;

// Game Profile State from On-chain
let profileState = {
  balance: 0n,
  circleMinerEnabled: true,
  luckyFlipEnabled: true,
  allowance: 0n,
  vaultBalance: 0n,
  username: "",
  totalWinnings: 0n,
  faucetClaimed: false,
  minerLevel: 0n,
  clickLevel: 0n,
  pendingRewards: 0n,
  lastUpdated: 0
};

// Default deployed addresses for ease of use
// GAME contract — the contract with faucet/mining/coinflip logic (this repo's contract)
const DEFAULT_CONTRACTS = {
  "5042": "0xd67d5a4559d07e8154E0B0dd2DB72597f727e748", // Arc Mainnet — game engine contract (Circle Miner + Lucky Flip, Vault-backed)
  "31337": "0x5FbDB2315678afecb367f032d93F642f64180aa3"  // Hardhat Localhost default
};

// TOKEN contract — the EXTERNAL $CPLAY ERC20 token (deployed separately, already live on Arc Mainnet)
const CPLAY_TOKEN_ADDRESS = {
  "5042": "0x8613155fF713c13F6C177275Af9bF195e69dEd34",
  "31337": "0x5FbDB2315678afecb367f032d93F642f64180aa3"
};

// Minimal standard ERC20 ABI — enough to read balance/allowance and approve spending.
const ERC20_ABI = [
  "function balanceOf(address account) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)"
];

let tokenContract = null; // set alongside `contract` once connected

// Get active contract address from LocalStorage or default to Arc Testnet
function getContractAddress(chainId) {
  const chainStr = String(chainId);
  localStorage.removeItem(`base_cyber_contract_${chainStr}`);
  return DEFAULT_CONTRACTS[chainStr] || DEFAULT_CONTRACTS["5042"];
}

function saveContractAddress(chainId, address) {
  localStorage.setItem(`base_cyber_contract_${String(chainId)}`, address);
}

// Page Elements
const btnConnect = document.getElementById('btn-connect');
const btnDisconnect = document.getElementById('btn-disconnect');
const tokenDisplay = document.getElementById('token-display');
const playerBalanceEl = document.getElementById('player-balance');
const networkWarning = document.getElementById('network-warning');
const btnSwitchNetwork = document.getElementById('btn-switch-network');
const walletAddressAbbr = document.getElementById('wallet-address-abbr');
const usernameDisplay = document.getElementById('username-display');
const vaultBalanceValEl = document.getElementById('vault-balance-val');
const totalWinningsValEl = document.getElementById('total-winnings-val');
const usernameInput = document.getElementById('username-input');
const btnSetUsername = document.getElementById('btn-set-username');
const leaderboardTbody = document.getElementById('leaderboard-tbody');
const btnFaucet = document.getElementById('btn-faucet');

// Miner Elements
const clickCrystal = document.getElementById('click-crystal');
const localClicksEl = document.getElementById('local-clicks');
const miningPendingEl = document.getElementById('mining-pending');
const btnClaimMining = document.getElementById('btn-claim-mining');
const clickLevelLbl = document.getElementById('click-level-lbl');
const clickUpgradeCost = document.getElementById('click-upgrade-cost');
const btnUpgradeClick = document.getElementById('btn-upgrade-click');
const minerLevelLbl = document.getElementById('miner-level-lbl');
const minerUpgradeCost = document.getElementById('miner-upgrade-cost');
const btnUpgradeMiner = document.getElementById('btn-upgrade-miner');

// Flip Elements
const coinVisual = document.getElementById('coin-visual');
const btnBetHeads = document.getElementById('btn-bet-heads');
const btnBetTails = document.getElementById('btn-bet-tails');
const betAmountInput = document.getElementById('bet-amount');
const btnBetMax = document.getElementById('btn-bet-max');
const btnRoll = document.getElementById('btn-roll');
const flipStatusMsg = document.getElementById('flip-status-msg');

// Tx Log Elements
const txTbody = document.getElementById('tx-tbody');
const txCountEl = document.getElementById('tx-count');
const txEmptyRow = document.getElementById('tx-empty-row');

let transactionsCount = 0;
let betChoice = "heads"; // default choice

/* ==========================================================================
   Tab Navigation Logic
   ========================================================================== */
const tabButtons = document.querySelectorAll('.nav-tab');
const tabPanels = document.querySelectorAll('.tab-panel');

tabButtons.forEach(button => {
  button.addEventListener('click', () => {
    const tabId = button.getAttribute('data-tab');
    
    tabButtons.forEach(btn => btn.classList.remove('active'));
    tabPanels.forEach(panel => panel.classList.remove('active'));
    
    button.classList.add('active');
    document.getElementById(tabId).classList.add('active');
  });
});

/* ==========================================================================
   Ethers.js Smart Contract & Wallet Connections
   ========================================================================== */
async function initWeb3() {
  if (typeof window.ethereum !== 'undefined') {
    try {
      provider = new ethers.BrowserProvider(window.ethereum);
      
      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });
      
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          connectWallet();
        }
      });
      
      const accounts = await provider.listAccounts();
      if (accounts.length > 0) {
        await connectWallet();
      }
    } catch (e) {
      console.error("Failed to initialize provider:", e);
    }
  } else {
    btnConnect.addEventListener('click', () => {
      alert("Ethereum wallet not detected. Please install Coinbase Wallet or MetaMask.");
    });
  }
}

async function connectWallet() {
  try {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    walletAddress = accounts[0];
    
    signer = await provider.getSigner();
    const network = await provider.getNetwork();
    currentChainId = network.chainId;
    
    btnConnect.innerHTML = `<i class="fa-solid fa-circle-nodes"></i> Connected: ${walletAddress.substring(0, 6)}...${walletAddress.substring(38)}`;
    btnConnect.classList.remove('btn-connect');
    btnConnect.classList.add('btn-outline');
    btnDisconnect.classList.remove('hidden');
    
    walletAddressAbbr.textContent = `${walletAddress.substring(0, 10)}...${walletAddress.substring(34)}`;
    tokenDisplay.classList.remove('hidden');
    
    if (currentChainId === 5042n || currentChainId === 31337n) {
      networkWarning.classList.add('hidden');

      const contractAddress = getContractAddress(currentChainId);
      const tokenAddress = CPLAY_TOKEN_ADDRESS[String(currentChainId)];

      contract = new ethers.Contract(contractAddress, CONTRACT_ABI, signer);
      tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
      
      await fetchPlayerProfile();
      await loadLeaderboard();
      startPassiveMiningTimer();
    } else {
      networkWarning.classList.remove('hidden');
      disableGameControls();
    }
  } catch (error) {
    console.error("Wallet connection failed:", error);
  }
}

function disconnectWallet() {
  walletAddress = null;
  signer = null;
  contract = null;
  btnConnect.innerHTML = `<i class="fa-solid fa-wallet"></i> Connect Wallet`;
  btnConnect.classList.add('btn-connect');
  btnConnect.classList.remove('btn-outline');
  btnDisconnect.classList.add('hidden');
  walletAddressAbbr.textContent = "Not Connected";
  tokenDisplay.classList.add('hidden');
  disableGameControls();
  if (miningUpdateInterval) {
    clearInterval(miningUpdateInterval);
  }

  if (window.ethereum && window.ethereum.request) {
    window.ethereum.request({
      method: 'wallet_revokePermissions',
      params: [{ eth_accounts: {} }],
    }).catch(() => {});
  }
}

btnDisconnect.addEventListener('click', disconnectWallet);

function disableGameControls() {
  btnClaimMining.disabled = true;
  btnUpgradeClick.disabled = true;
  btnUpgradeMiner.disabled = true;
  btnRoll.disabled = true;
  btnSetUsername.disabled = true;
}

async function switchNetwork() {
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x13B3' }], // 5042 = 0x13B3
    });
  } catch (switchError) {
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: '0x13B3',
              chainName: 'Arc Mainnet',
              nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
              rpcUrls: ['https://arc-mainnet.infura.io/v3/de58e8647ba54873a65e6b8d2d7bade7'],
              blockExplorerUrls: ['https://arc.exploreme.pro'],
            },
          ],
        });
      } catch (addError) {
        console.error("Could not add network:", addError);
      }
    }
    console.error("Failed to switch network:", switchError);
  }
}

btnSwitchNetwork.addEventListener('click', switchNetwork);
btnConnect.addEventListener('click', connectWallet);

/* ==========================================================================
   Game Operations & UI Sync
   ========================================================================== */

async function loadLeaderboard() {
  const activeContract = contract;
  if (!activeContract) return;
  try {
    leaderboardTbody.innerHTML = '<tr><td colspan="3" class="leaderboard-empty">Loading leaderboard…</td></tr>';

    const filter = activeContract.filters.CoinFlipResult();
    const CHUNK = 9000;
    const latestBlock = await activeContract.runner.provider.getBlockNumber();
    const events = [];
    let from = 0;
    while (from <= latestBlock) {
      if (!activeContract) break;
      const to = Math.min(from + CHUNK, latestBlock);
      const chunkEvents = await activeContract.queryFilter(filter, from, to);
      events.push(...chunkEvents);
      from = to + 1;
    }

    const uniquePlayers = [...new Set(events.map(e => e.args.player))];

    if (uniquePlayers.length === 0) {
      leaderboardTbody.innerHTML = '<tr><td colspan="3" class="leaderboard-empty">No plays yet — be the first!</td></tr>';
      return;
    }

    const playerData = await Promise.all(uniquePlayers.map(async (addr) => {
      const [winnings, name] = await Promise.all([
        activeContract.totalWinnings(addr),
        activeContract.usernames(addr)
      ]);
      return { address: addr, winnings, name };
    }));

    const ranked = playerData
      .filter(p => p.winnings > 0n)
      .sort((a, b) => (b.winnings > a.winnings ? 1 : a.winnings > b.winnings ? -1 : 0))
      .slice(0, 25);

    if (ranked.length === 0) {
      leaderboardTbody.innerHTML = '<tr><td colspan="3" class="leaderboard-empty">No winners yet — be the first!</td></tr>';
      return;
    }

    leaderboardTbody.innerHTML = ranked.map((p, i) => {
      const displayName = p.name && p.name.length > 0
        ? p.name
        : `${p.address.slice(0, 6)}...${p.address.slice(-4)}`;
      const winningsFormatted = Number(parseFloat(ethers.formatEther(p.winnings)).toFixed(2)).toLocaleString();
      return `<tr>
        <td>${i + 1}</td>
        <td class="monospace">${displayName}</td>
        <td>${winningsFormatted} CPLAY</td>
      </tr>`;
    }).join('');
  } catch (error) {
    console.error("Leaderboard load error:", error);
    leaderboardTbody.innerHTML = '<tr><td colspan="3" class="leaderboard-empty">Could not load leaderboard.</td></tr>';
  }
}

async function fetchPlayerProfile() {
  if (!contract || !walletAddress) return;

  try {
    // Manuel eth_call ile getPlayerProfile sorgusu
    const abi = [
      "function getPlayerProfile(address) view returns (uint256,bool,bool,uint256,uint256,string,uint256,bool,uint256,uint256,uint256)"
    ];
    const iface = new ethers.Interface(abi);
    const callData = iface.encodeFunctionData("getPlayerProfile", [walletAddress]);

    const rawResult = await window.ethereum.request({
      method: "eth_call",
      params: [{
        to: contract.address,
        data: callData
      }, "latest"]
    });

    const decoded = iface.decodeFunctionResult("getPlayerProfile", rawResult);
    const result = Array.from(decoded);

    console.log("✅ Player profile result:", result);

    if (result.length !== 11) {
      throw new Error(`Unexpected result length: ${result.length}`);
    }

    profileState.balance = result[0];
    profileState.circleMinerEnabled = result[1];
    profileState.luckyFlipEnabled = result[2];
    profileState.allowance = result[3];
    profileState.vaultBalance = result[4];
    profileState.username = result[5];
    profileState.totalWinnings = result[6];
    profileState.faucetClaimed = result[7];
    profileState.minerLevel = result[8];
    profileState.clickLevel = result[9];
    profileState.pendingRewards = result[10];
    profileState.lastUpdated = Date.now();

    // Update UI Elements
    const formattedBalance = parseFloat(ethers.formatEther(profileState.balance)).toFixed(2);
    playerBalanceEl.textContent = Number(formattedBalance).toLocaleString();

    vaultBalanceValEl.textContent = `${Number(parseFloat(ethers.formatEther(profileState.vaultBalance)).toFixed(2)).toLocaleString()} CPLAY`;

    if (profileState.username && profileState.username.length > 0) {
      usernameDisplay.textContent = profileState.username;
      usernameInput.placeholder = "Change username";
    } else {
      usernameDisplay.textContent = "— not set —";
      usernameInput.placeholder = "Set a username";
    }
    usernameInput.value = "";
    btnSetUsername.disabled = true;

    totalWinningsValEl.textContent = `${Number(parseFloat(ethers.formatEther(profileState.totalWinnings)).toFixed(2)).toLocaleString()} CPLAY`;

    btnRoll.disabled = !profileState.luckyFlipEnabled || profileState.balance < ethers.parseEther("10");

    if (profileState.circleMinerEnabled) {
      clickLevelLbl.textContent = profileState.clickLevel.toString();
      minerLevelLbl.textContent = profileState.minerLevel.toString();

      const clickCost = await contract.getClickUpgradeCost(profileState.clickLevel);
      clickUpgradeCost.textContent = parseFloat(ethers.formatEther(clickCost)).toFixed(0);
      btnUpgradeClick.disabled = profileState.balance < clickCost;

      const minerCost = await contract.getUpgradeCost(profileState.minerLevel);
      minerUpgradeCost.textContent = parseFloat(ethers.formatEther(minerCost)).toFixed(0);
      btnUpgradeMiner.disabled = profileState.balance < minerCost;

      pendingClaimLocal = parseFloat(ethers.formatEther(profileState.pendingRewards));
      updateMiningDisplay();
    }

  } catch (error) {
    console.error("Error reading profile stats:", error);
    if (typeof flipStatusMsg !== "undefined") {
      flipStatusMsg.textContent = "Contract read failed. Check if address is correct.";
    }
  }
}

// Ticks the pending-claim display between profile refreshes, mirroring the
// contract's exact formula so the number shown is what you'll actually get.
function startPassiveMiningTimer() {
  if (miningUpdateInterval) {
    clearInterval(miningUpdateInterval);
  }

  miningUpdateInterval = setInterval(() => {
    const minerLevel = Number(profileState.minerLevel || 0n);
    const clickLevel = Number(profileState.clickLevel || 0n);

    if (minerLevel > 0) {
      const baseRatePerSec = 0.001 * minerLevel;
      const ratePerSec = baseRatePerSec * (1 + clickLevel * 0.1);
      pendingClaimLocal += ratePerSec * 0.1; // her 100ms'de bir
    }

    updateMiningDisplay(); // her zaman güncelle
  }, 100);
}

function updateMiningDisplay() {
  miningPendingEl.textContent = pendingClaimLocal.toFixed(4);
  btnClaimMining.disabled = pendingClaimLocal <= 0.0001;
}

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

/* ==========================================================================
   Clicker Energy Mining
   ========================================================================== */
clickCrystal.addEventListener('click', (e) => {
  const mult = 1 + Number(profileState.clickLevel);
  localClicks += 1;
  localClicksEl.textContent = localClicks;
  updateMiningDisplay();
  createClickParticle(e);
});

function createClickParticle(e) {
  const rect = clickCrystal.getBoundingClientRect();
  const x = e.clientX || (rect.left + rect.width / 2);
  const y = e.clientY || (rect.top + rect.height / 2);
  
  const floating = document.createElement('div');
  floating.className = 'floating-click-val';
  floating.style.left = `${x}px`;
  floating.style.top = `${y}px`;
  
  const mult = 1 + Number(profileState.clickLevel);
  floating.textContent = `+${mult}`;
  
  document.body.appendChild(floating);
  
  setTimeout(() => {
    floating.remove();
  }, 800);
}

/* ==========================================================================
   On-chain Blockchain Transactions
   ========================================================================== */

function logTransaction(actionName, txHash, status) {
  txEmptyRow.classList.add('hidden');
  transactionsCount++;
  txCountEl.textContent = `${transactionsCount} Transaction${transactionsCount > 1 ? 's' : ''}`;
  
  const tr = document.createElement('tr');
  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
  
  let statusBadge = '';
  if (status === 'pending') {
    statusBadge = '<span class="tx-status-badge pending"><i class="fa-solid fa-spinner fa-spin"></i> Pending</span>';
  } else if (status === 'success') {
    statusBadge = '<span class="tx-status-badge success"><i class="fa-solid fa-circle-check"></i> Success</span>';
  } else {
    statusBadge = '<span class="tx-status-badge failed"><i class="fa-solid fa-circle-xmark"></i> Failed</span>';
  }
  
  const explorerUrl = currentChainId === 5042n 
    ? `https://arc.exploreme.pro/tx/${txHash}` 
    : `#`;
    
  const txLink = txHash !== 'N/A' 
    ? `<a href="${explorerUrl}" target="_blank" class="monospace text-glow-blue">${txHash.substring(0, 10)}...</a>`
    : '<span class="text-muted">N/A</span>';
    
  tr.innerHTML = `
    <td>${timeStr}</td>
    <td class="font-weight-bold">${actionName}</td>
    <td>${statusBadge}</td>
    <td>Gas estimate processing...</td>
    <td>${txLink}</td>
  `;
  
  txTbody.insertBefore(tr, txTbody.firstChild);
  
  return tr;
}

function updateTransactionLog(row, status, gasDetails) {
  const statusTd = row.cells[2];
  const gasTd = row.cells[3];
  
  if (status === 'success') {
    statusTd.innerHTML = '<span class="tx-status-badge success"><i class="fa-solid fa-circle-check"></i> Success</span>';
  } else {
    statusTd.innerHTML = '<span class="tx-status-badge failed"><i class="fa-solid fa-circle-xmark"></i> Failed</span>';
  }
  gasTd.textContent = gasDetails || 'N/A';
}

// 1. Set Username
usernameInput.addEventListener('input', () => {
  btnSetUsername.disabled = !contract || usernameInput.value.trim().length === 0;
});

btnSetUsername.addEventListener('click', async () => {
  if (!contract) return;
  const name = usernameInput.value.trim();
  if (!name || name.length > 20) {
    alert("Username must be 1-20 characters.");
    return;
  }

  btnSetUsername.disabled = true;
  const logRow = logTransaction("Set Username", "N/A", "pending");

  try {
    const tx = await contract.setUsername(name);
    logRow.cells[4].innerHTML = `<a href="https://arc.exploreme.pro/tx/${tx.hash}" target="_blank" class="monospace text-glow-blue">${tx.hash.substring(0, 10)}...</a>`;

    const receipt = await tx.wait();
    updateTransactionLog(logRow, "success", `Gas used: ${receipt.gasUsed.toString()}`);
    usernameInput.value = "";
    await fetchPlayerProfile();
    await loadLeaderboard();
  } catch (error) {
    console.error("Set username error:", error);
    updateTransactionLog(logRow, "failed", error.reason || "Rejected");
    btnSetUsername.disabled = false;
  }
});

// 2. Buy Click Upgrade
btnUpgradeClick.addEventListener('click', async () => {
  if (!contract) return;
  btnUpgradeClick.disabled = true;

  try {
    const cost = await contract.getClickUpgradeCost(profileState.clickLevel);
    const approved = await ensureApproval(cost);
    if (!approved) { btnUpgradeClick.disabled = false; return; }

    const logRow = logTransaction("Upgrade Super-Click Mult", "N/A", "pending");
    const tx = await contract.buyClickUpgrade();
    logRow.cells[4].innerHTML = `<a href="https://arc.exploreme.pro/tx/${tx.hash}" target="_blank" class="monospace text-glow-blue">${tx.hash.substring(0, 10)}...</a>`;
    
    const receipt = await tx.wait();
    updateTransactionLog(logRow, "success", `Gas used: ${receipt.gasUsed.toString()}`);
    await fetchPlayerProfile();
  } catch (error) {
    console.error("Upgrade click error:", error);
    btnUpgradeClick.disabled = false;
  }
});

// 3. Buy Miner Upgrade
btnUpgradeMiner.addEventListener('click', async () => {
  if (!contract) return;
  btnUpgradeMiner.disabled = true;

  try {
    const cost = await contract.getUpgradeCost(profileState.minerLevel);
    const approved = await ensureApproval(cost);
    if (!approved) { btnUpgradeMiner.disabled = false; return; }

    const logRow = logTransaction("Upgrade Circle Mining Rig", "N/A", "pending");
    const tx = await contract.buyMinerUpgrade();
    logRow.cells[4].innerHTML = `<a href="https://arc.exploreme.pro/tx/${tx.hash}" target="_blank" class="monospace text-glow-blue">${tx.hash.substring(0, 10)}...</a>`;
    
    const receipt = await tx.wait();
    updateTransactionLog(logRow, "success", `Gas used: ${receipt.gasUsed.toString()}`);
    await fetchPlayerProfile();
  } catch (error) {
    console.error("Upgrade miner error:", error);
    btnUpgradeMiner.disabled = false;
  }
});

// 4. Claim Mining Rewards
btnClaimMining.addEventListener('click', async () => {
  if (!contract) return;
  btnClaimMining.disabled = true;
  
  const logRow = logTransaction("Claim Mining Rewards", "N/A", "pending");
  
  try {
    const tx = await contract.claimMining();
    logRow.cells[4].innerHTML = `<a href="https://arc.exploreme.pro/tx/${tx.hash}" target="_blank" class="monospace text-glow-blue">${tx.hash.substring(0, 10)}...</a>`;
    
    const receipt = await tx.wait();
    updateTransactionLog(logRow, "success", `Gas used: ${receipt.gasUsed.toString()}`);
    
    localClicks = 0;
    localClicksEl.textContent = 0;
    
    await fetchPlayerProfile();
  } catch (error) {
    console.error("Claim mining error:", error);
    updateTransactionLog(logRow, "failed", error.reason || "Rejected");
    btnClaimMining.disabled = false;
  }
});

/* ==========================================================================
   Lucky Flip Coin Toss
   ========================================================================== */
btnBetHeads.addEventListener('click', () => {
  betChoice = "heads";
  btnBetHeads.classList.add('active');
  btnBetTails.classList.remove('active');
});

btnBetTails.addEventListener('click', () => {
  betChoice = "tails";
  btnBetTails.classList.add('active');
  btnBetHeads.classList.remove('active');
});

btnBetMax.addEventListener('click', () => {
  if (profileState.balance > 0n) {
    const etherVal = parseFloat(ethers.formatEther(profileState.balance));
    const rounded = Math.floor(etherVal / 10) * 10;
    betAmountInput.value = Math.max(10, rounded);
  }
});

btnRoll.addEventListener('click', async () => {
  if (!contract) return;
  
  const betVal = parseFloat(betAmountInput.value);
  if (isNaN(betVal) || betVal < 10) {
    alert("Minimum bet amount is 10 CPLAY");
    return;
  }
  
  const betWei = ethers.parseEther(betVal.toString());
  if (profileState.balance < betWei) {
    alert("Insufficient CPLAY balance to cover bet.");
    return;
  }
  
  btnRoll.disabled = true;

  const approved = await ensureApproval(betWei);
  if (!approved) { btnRoll.disabled = false; return; }

  flipStatusMsg.className = "flip-status-message";
  flipStatusMsg.textContent = "Submitting bet to the blockchain...";
  
  coinVisual.classList.add('spin-animation');
  
  const isHeadsBet = (betChoice === "heads");
  const logRow = logTransaction(`Lucky Flip Bet (${betChoice.toUpperCase()})`, "N/A", "pending");
  
  try {
    const tx = await contract.coinFlip(isHeadsBet, betWei);
    logRow.cells[4].innerHTML = `<a href="https://arc.exploreme.pro/tx/${tx.hash}" target="_blank" class="monospace text-glow-blue">${tx.hash.substring(0, 10)}...</a>`;
    
    const receipt = await tx.wait();
    updateTransactionLog(logRow, "success", `Gas used: ${receipt.gasUsed.toString()}`);
    
    let won = false;
    let payout = 0n;
    
    for (const log of receipt.logs) {
      try {
        const parsedLog = contract.interface.parseLog(log);
        if (parsedLog.name === 'CoinFlipResult') {
          won = parsedLog.args.won;
          payout = parsedLog.args.payout;
        }
      } catch (e) {}
    }
    
    const landedHeads = (isHeadsBet && won) || (!isHeadsBet && !won);
    const spinTarget = landedHeads ? '1800deg' : '1980deg';
    coinVisual.style.setProperty('--coin-spin-target', spinTarget);
    
    setTimeout(async () => {
      coinVisual.classList.remove('spin-animation');
      
      if (won) {
        flipStatusMsg.className = "flip-status-message won";
        flipStatusMsg.innerHTML = `<i class="fa-solid fa-trophy"></i> YOU WON! Received ${ethers.formatEther(payout)} $CPLAY!`;
      } else {
        flipStatusMsg.className = "flip-status-message lost";
        flipStatusMsg.innerHTML = `<i class="fa-solid fa-face-frown"></i> YOU LOST! Better luck next roll.`;
      }
      
      await fetchPlayerProfile();
      await loadLeaderboard();
      btnRoll.disabled = false;
    }, 3200);
    
  } catch (error) {
    console.error("Coin flip transaction error:", error);
    coinVisual.classList.remove('spin-animation');
    updateTransactionLog(logRow, "failed", error.reason || "Rejected");
    flipStatusMsg.textContent = "Transaction failed or rejected.";
    btnRoll.disabled = false;
  }
});

/* ==========================================================================
   ERC20 Approval Helper
   ========================================================================== */
async function ensureApproval(requiredAmount) {
  if (!tokenContract || !contract) return false;

  const contractAddress = await contract.getAddress();
  const currentAllowance = await tokenContract.allowance(walletAddress, contractAddress);

  if (currentAllowance >= requiredAmount) return true;

  const logRow = logTransaction("Approve $CPLAY Spend", "N/A", "pending");
  try {
    const tx = await tokenContract.approve(contractAddress, ethers.MaxUint256);
    logRow.cells[4].innerHTML = `<a href="https://arc.exploreme.pro/tx/${tx.hash}" target="_blank" class="monospace text-glow-blue">${tx.hash.substring(0, 10)}...</a>`;
    const receipt = await tx.wait();
    updateTransactionLog(logRow, "success", `Gas used: ${receipt.gasUsed.toString()}`);
    return true;
  } catch (error) {
    console.error("Approval failed:", error);
    updateTransactionLog(logRow, "failed", error.reason || "Rejected");
    return false;
  }
}

/* ==========================================================================
   Premium Particle Space Background
   ========================================================================== */
const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');
let particles = [];

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

class Particle {
  constructor() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.size = Math.random() * 1.5 + 0.5;
    this.speedX = Math.random() * 0.15 - 0.075;
    this.speedY = Math.random() * -0.2 - 0.05;
    this.color = Math.random() > 0.5 ? 'rgba(6, 182, 212, ' : 'rgba(139, 92, 246, ';
    this.alpha = Math.random() * 0.5 + 0.2;
  }
  
  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    
    if (this.y < 0) {
      this.y = canvas.height;
      this.x = Math.random() * canvas.width;
    }
    if (this.x < 0 || this.x > canvas.width) {
      this.x = Math.random() * canvas.width;
    }
  }
  
  draw() {
    ctx.fillStyle = this.color + this.alpha + ')';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

function initParticles() {
  particles = [];
  const count = Math.min(100, Math.floor(window.innerWidth / 15));
  for (let i = 0; i < count; i++) {
    particles.push(new Particle());
  }
}

function animateParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles.forEach(p => {
    p.update();
    p.draw();
  });
  requestAnimationFrame(animateParticles);
}

initParticles();
animateParticles();

// Start
initWeb3();
