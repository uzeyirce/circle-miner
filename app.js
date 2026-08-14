/**
 * Arc Cyber Miner & Lucky Flip
 * Web3 Client Logic using Ethers.js v6
 * Fixed version - 14 Aug 2026
 */

// ====================== Application State ======================
let provider = null;
let signer = null;
let contract = null;
let tokenContract = null;
let walletAddress = null;
let currentChainId = null;
let localClicks = 0;
let pendingClaimLocal = 0.0;
let miningUpdateInterval = null;
let transactionsCount = 0;
let betChoice = "heads";

// Game Profile State
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

// ====================== Addresses ======================
const DEFAULT_CONTRACTS = {
  "5042": "0xd67d5a4559d07e8154E0B0dd2DB72597f727e748", // Arc Mainnet - Game Contract
  "31337": "0x5FbDB2315678afecb367f032d93F642f64180aa3"
};

const CPLAY_TOKEN_ADDRESS = {
  "5042": "0x8613155fF713c13F6C177275Af9bF195e69dEd34",
  "31337": "0x5FbDB2315678afecb367f032d93F642f64180aa3"
};

// ====================== ABIs ======================
const ERC20_ABI = [
  "function balanceOf(address account) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)"
];

const CONTRACT_ABI = [
  "function getPlayerProfile(address) view returns (uint256,bool,bool,uint256,uint256,string,uint256,bool,uint256,uint256,uint256)",
  "function setUsername(string)",
  "function usernames(address) view returns (string)",
  "function getClickUpgradeCost(uint256) view returns (uint256)",
  "function buyClickUpgrade()",
  "function getUpgradeCost(uint256) view returns (uint256)",
  "function buyMinerUpgrade()",
  "function claimMining()",
  "function coinFlip(bool,uint256)",
  "function totalWinnings(address) view returns (uint256)",
  "event CoinFlipResult(address indexed player, bool won, uint256 payout)"
];

// ====================== DOM Elements ======================
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

const coinVisual = document.getElementById('coin-visual');
const btnBetHeads = document.getElementById('btn-bet-heads');
const btnBetTails = document.getElementById('btn-bet-tails');
const betAmountInput = document.getElementById('bet-amount');
const btnBetMax = document.getElementById('btn-bet-max');
const btnRoll = document.getElementById('btn-roll');
const flipStatusMsg = document.getElementById('flip-status-msg');

const txTbody = document.getElementById('tx-tbody');
const txCountEl = document.getElementById('tx-count');
const txEmptyRow = document.getElementById('tx-empty-row');

// ====================== Helpers ======================
function getContractAddress(chainId) {
  const chainStr = String(chainId);
  localStorage.removeItem(`base_cyber_contract_${chainStr}`);
  return DEFAULT_CONTRACTS[chainStr] || DEFAULT_CONTRACTS["5042"];
}

// ====================== Tab Navigation ======================
document.querySelectorAll('.nav-tab').forEach(button => {
  button.addEventListener('click', () => {
    const tabId = button.getAttribute('data-tab');
    document.querySelectorAll('.nav-tab').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));
    button.classList.add('active');
    document.getElementById(tabId)?.classList.add('active');
  });
});

// ====================== Web3 ======================
async function initWeb3() {
  if (typeof window.ethereum === 'undefined') {
    if (btnConnect) {
      btnConnect.addEventListener('click', () => {
        alert("Ethereum wallet not detected. Please install MetaMask or Rabby.");
      });
    }
    return;
  }

  try {
    provider = new ethers.BrowserProvider(window.ethereum);

    window.ethereum.on('chainChanged', () => window.location.reload());
    window.ethereum.on('accountsChanged', (accounts) => {
      if (accounts.length === 0) disconnectWallet();
      else connectWallet();
    });

    const accounts = await provider.listAccounts();
    if (accounts.length > 0) await connectWallet();
  } catch (e) {
    console.error("Failed to initialize provider:", e);
  }
}

async function connectWallet() {
  try {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    if (!accounts || accounts.length === 0) return;

    walletAddress = accounts[0];
    signer = await provider.getSigner();
    const network = await provider.getNetwork();
    currentChainId = network.chainId;

    // UI Update
    if (btnConnect) {
      btnConnect.innerHTML = `<i class="fa-solid fa-circle-nodes"></i> Connected: ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
      btnConnect.classList.remove('btn-connect');
      btnConnect.classList.add('btn-outline');
    }
    if (btnDisconnect) btnDisconnect.classList.remove('hidden');
    if (walletAddressAbbr) walletAddressAbbr.textContent = `${walletAddress.slice(0, 10)}...${walletAddress.slice(-4)}`;
    if (tokenDisplay) tokenDisplay.classList.remove('hidden');

    if (currentChainId === 5042n || currentChainId === 31337n) {
      if (networkWarning) networkWarning.classList.add('hidden');

      const contractAddress = getContractAddress(currentChainId);
      const tokenAddress = CPLAY_TOKEN_ADDRESS[String(currentChainId)];

      contract = new ethers.Contract(contractAddress, CONTRACT_ABI, signer);
      tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);

      await fetchPlayerProfile();
      await loadLeaderboard();
      startPassiveMiningTimer();
    } else {
      if (networkWarning) networkWarning.classList.remove('hidden');
      disableGameControls();
    }
  } catch (error) {
    console.error("Wallet connection failed:", error);
    alert("Connection failed: " + (error.message || error));
  }
}

function disconnectWallet() {
  walletAddress = null;
  signer = null;
  contract = null;
  tokenContract = null;

  if (btnConnect) {
    btnConnect.innerHTML = `<i class="fa-solid fa-wallet"></i> Connect Wallet`;
    btnConnect.classList.add('btn-connect');
    btnConnect.classList.remove('btn-outline');
  }
  if (btnDisconnect) btnDisconnect.classList.add('hidden');
  if (walletAddressAbbr) walletAddressAbbr.textContent = "Not Connected";
  if (tokenDisplay) tokenDisplay.classList.add('hidden');

  disableGameControls();
  if (miningUpdateInterval) clearInterval(miningUpdateInterval);
}

function disableGameControls() {
  [btnClaimMining, btnUpgradeClick, btnUpgradeMiner, btnRoll, btnSetUsername].forEach(btn => {
    if (btn) btn.disabled = true;
  });
}

async function switchNetwork() {
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x13b2' }],
    });
  } catch (switchError) {
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: '0x13b2',
            chainName: 'Arc Mainnet',
            nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
            rpcUrls: ['https://arc-mainnet.infura.io/v3/de58e8647ba54873a65e6b8d2d7bade7'],
            blockExplorerUrls: ['https://arc.exploreme.pro'],
          }],
        });
      } catch (addError) {
        console.error("Could not add network:", addError);
      }
    }
  }
}

// ====================== Leaderboard ======================
async function loadLeaderboard() {
  if (!contract || !leaderboardTbody) return;

  try {
    leaderboardTbody.innerHTML = '<tr><td colspan="3" class="leaderboard-empty">Loading leaderboard…</td></tr>';

    const filter = contract.filters.CoinFlipResult();
    const CHUNK = 9000;
    const latestBlock = await contract.runner.provider.getBlockNumber();
    const events = [];

    for (let from = 0; from <= latestBlock; from += CHUNK + 1) {
      const to = Math.min(from + CHUNK, latestBlock);
      const chunkEvents = await contract.queryFilter(filter, from, to);
      events.push(...chunkEvents);
    }

    const uniquePlayers = [...new Set(events.map(e => e.args.player))];

    if (uniquePlayers.length === 0) {
      leaderboardTbody.innerHTML = '<tr><td colspan="3" class="leaderboard-empty">No plays yet — be the first!</td></tr>';
      return;
    }

    const playerData = await Promise.all(uniquePlayers.map(async (addr) => {
      const [winnings, name] = await Promise.all([
        contract.totalWinnings(addr),
        contract.usernames(addr)
      ]);
      return { address: addr, winnings, name };
    }));

    const ranked = playerData
      .filter(p => p.winnings > 0n)
      .sort((a, b) => (b.winnings > a.winnings ? 1 : -1))
      .slice(0, 25);

    if (ranked.length === 0) {
      leaderboardTbody.innerHTML = '<tr><td colspan="3" class="leaderboard-empty">No winners yet — be the first!</td></tr>';
      return;
    }

    leaderboardTbody.innerHTML = ranked.map((p, i) => {
      const displayName = p.name?.length > 0 ? p.name : `${p.address.slice(0, 6)}...${p.address.slice(-4)}`;
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

// ====================== Profile ======================
async function fetchPlayerProfile() {
  if (!contract || !walletAddress) return;

  try {
    const result = await contract.getPlayerProfile(walletAddress);

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

    if (playerBalanceEl) {
      playerBalanceEl.textContent = Number(parseFloat(ethers.formatEther(profileState.balance)).toFixed(2)).toLocaleString();
    }
    if (vaultBalanceValEl) {
      vaultBalanceValEl.textContent = `${Number(parseFloat(ethers.formatEther(profileState.vaultBalance)).toFixed(2)).toLocaleString()} CPLAY`;
    }
    if (totalWinningsValEl) {
      totalWinningsValEl.textContent = `${Number(parseFloat(ethers.formatEther(profileState.totalWinnings)).toFixed(2)).toLocaleString()} CPLAY`;
    }

    if (usernameDisplay) {
      usernameDisplay.textContent = profileState.username || "— not set —";
    }

    if (btnRoll) {
      btnRoll.disabled = !profileState.luckyFlipEnabled || profileState.balance < ethers.parseEther("10");
    }

    if (profileState.circleMinerEnabled) {
      if (clickLevelLbl) clickLevelLbl.textContent = profileState.clickLevel.toString();
      if (minerLevelLbl) minerLevelLbl.textContent = profileState.minerLevel.toString();

      const clickCost = await contract.getClickUpgradeCost(profileState.clickLevel);
      if (clickUpgradeCost) clickUpgradeCost.textContent = parseFloat(ethers.formatEther(clickCost)).toFixed(0);
      if (btnUpgradeClick) btnUpgradeClick.disabled = profileState.balance < clickCost;

      const minerCost = await contract.getUpgradeCost(profileState.minerLevel);
      if (minerUpgradeCost) minerUpgradeCost.textContent = parseFloat(ethers.formatEther(minerCost)).toFixed(0);
      if (btnUpgradeMiner) btnUpgradeMiner.disabled = profileState.balance < minerCost;

      pendingClaimLocal = parseFloat(ethers.formatEther(profileState.pendingRewards));
      updateMiningDisplay();
    }
  } catch (error) {
    console.error("Error reading profile:", error);
    if (flipStatusMsg) flipStatusMsg.textContent = "Contract read failed.";
  }
}

function startPassiveMiningTimer() {
  if (miningUpdateInterval) clearInterval(miningUpdateInterval);

  miningUpdateInterval = setInterval(() => {
    if (profileState.minerLevel > 0n) {
      const baseRatePerSec = 0.001 * Number(profileState.minerLevel);
      const ratePerSec = baseRatePerSec * (1 + Number(profileState.clickLevel) * 0.1);
      pendingClaimLocal += ratePerSec * 0.1;
      updateMiningDisplay();
    }
  }, 100);
}

function updateMiningDisplay() {
  if (miningPendingEl) miningPendingEl.textContent = pendingClaimLocal.toFixed(4);
  if (btnClaimMining) btnClaimMining.disabled = pendingClaimLocal <= 0;
}

// ====================== Mining Click ======================
clickCrystal?.addEventListener('click', (e) => {
  localClicks += 1;
  if (localClicksEl) localClicksEl.textContent = localClicks;
  updateMiningDisplay();
  createClickParticle(e);
});

function createClickParticle(e) {
  const floating = document.createElement('div');
  floating.className = 'floating-click-val';
  floating.style.left = `${e.clientX}px`;
  floating.style.top = `${e.clientY}px`;
  floating.textContent = `+${1 + Number(profileState.clickLevel)}`;
  document.body.appendChild(floating);
  setTimeout(() => floating.remove(), 800);
}

// ====================== Transaction Logger ======================
function logTransaction(actionName, txHash, status) {
  if (!txTbody || !txEmptyRow) return null;

  txEmptyRow.classList.add('hidden');
  transactionsCount++;
  if (txCountEl) txCountEl.textContent = `${transactionsCount} Transaction${transactionsCount > 1 ? 's' : ''}`;

  const tr = document.createElement('tr');
  const now = new Date();
  const timeStr = now.toTimeString().slice(0, 8);

  let statusBadge = status === 'pending'
    ? '<span class="tx-status-badge pending"><i class="fa-solid fa-spinner fa-spin"></i> Pending</span>'
    : status === 'success'
    ? '<span class="tx-status-badge success"><i class="fa-solid fa-circle-check"></i> Success</span>'
    : '<span class="tx-status-badge failed"><i class="fa-solid fa-circle-xmark"></i> Failed</span>';

  const explorerUrl = currentChainId === 5042n
    ? `https://arc.exploreme.pro/tx/${txHash}`
    : `#`;

  tr.innerHTML = `
    <td>${timeStr}</td>
    <td class="font-weight-bold">${actionName}</td>
    <td>${statusBadge}</td>
    <td>Processing...</td>
    <td>${txHash !== 'N/A' ? `<a href="${explorerUrl}" target="_blank" class="monospace text-glow-blue">${txHash.substring(0, 10)}...</a>` : 'N/A'}</td>
  `;
  txTbody.insertBefore(tr, txTbody.firstChild);
  return tr;
}

function updateTransactionLog(row, status, gasDetails) {
  if (!row) return;
  row.cells[2].innerHTML = status === 'success'
    ? '<span class="tx-status-badge success"><i class="fa-solid fa-circle-check"></i> Success</span>'
    : '<span class="tx-status-badge failed"><i class="fa-solid fa-circle-xmark"></i> Failed</span>';
  row.cells[3].textContent = gasDetails || 'N/A';
}

// ====================== Game Actions ======================
usernameInput?.addEventListener('input', () => {
  if (btnSetUsername) btnSetUsername.disabled = !contract || usernameInput.value.trim().length === 0;
});

btnSetUsername?.addEventListener('click', async () => {
  if (!contract) return;
  const name = usernameInput.value.trim();
  if (!name || name.length > 20) return alert("Username must be 1-20 characters.");

  btnSetUsername.disabled = true;
  const logRow = logTransaction("Set Username", "N/A", "pending");

  try {
    const tx = await contract.setUsername(name);
    if (logRow) logRow.cells[4].innerHTML = `<a href="https://arc.exploreme.pro/tx/${tx.hash}" target="_blank">${tx.hash.substring(0, 10)}...</a>`;
    const receipt = await tx.wait();
    updateTransactionLog(logRow, "success", `Gas: ${receipt.gasUsed}`);
    usernameInput.value = "";
    await fetchPlayerProfile();
    await loadLeaderboard();
  } catch (error) {
    updateTransactionLog(logRow, "failed", error.reason || "Rejected");
    btnSetUsername.disabled = false;
  }
});

btnUpgradeClick?.addEventListener('click', async () => {
  if (!contract) return;
  btnUpgradeClick.disabled = true;
  try {
    const cost = await contract.getClickUpgradeCost(profileState.clickLevel);
    if (!(await ensureApproval(cost))) {
      btnUpgradeClick.disabled = false;
      return;
    }
    const logRow = logTransaction("Upgrade Click", "N/A", "pending");
    const tx = await contract.buyClickUpgrade();
    const receipt = await tx.wait();
    updateTransactionLog(logRow, "success", `Gas: ${receipt.gasUsed}`);
    await fetchPlayerProfile();
  } catch (e) {
    console.error(e);
    btnUpgradeClick.disabled = false;
  }
});

btnUpgradeMiner?.addEventListener('click', async () => {
  if (!contract) return;
  btnUpgradeMiner.disabled = true;
  try {
    const cost = await contract.getUpgradeCost(profileState.minerLevel);
    if (!(await ensureApproval(cost))) {
      btnUpgradeMiner.disabled = false;
      return;
    }
    const logRow = logTransaction("Upgrade Miner", "N/A", "pending");
    const tx = await contract.buyMinerUpgrade();
    const receipt = await tx.wait();
    updateTransactionLog(logRow, "success", `Gas: ${receipt.gasUsed}`);
    await fetchPlayerProfile();
  } catch (e) {
    console.error(e);
    btnUpgradeMiner.disabled = false;
  }
});

btnClaimMining?.addEventListener('click', async () => {
  if (!contract) return;
  btnClaimMining.disabled = true;
  const logRow = logTransaction("Claim Mining", "N/A", "pending");
  try {
    const tx = await contract.claimMining();
    const receipt = await tx.wait();
    updateTransactionLog(logRow, "success", `Gas: ${receipt.gasUsed}`);
    localClicks = 0;
    if (localClicksEl) localClicksEl.textContent = "0";
    await fetchPlayerProfile();
  } catch (e) {
    updateTransactionLog(logRow, "failed", e.reason || "Rejected");
    btnClaimMining.disabled = false;
  }
});

// ====================== Lucky Flip ======================
btnBetHeads?.addEventListener('click', () => {
  betChoice = "heads";
  btnBetHeads.classList.add('active');
  btnBetTails?.classList.remove('active');
});

btnBetTails?.addEventListener('click', () => {
  betChoice = "tails";
  btnBetTails.classList.add('active');
  btnBetHeads?.classList.remove('active');
});

btnBetMax?.addEventListener('click', () => {
  if (profileState.balance > 0n && betAmountInput) {
    const val = Math.floor(parseFloat(ethers.formatEther(profileState.balance)) / 10) * 10;
    betAmountInput.value = Math.max(10, val);
  }
});

btnRoll?.addEventListener('click', async () => {
  if (!contract) return;

  const betVal = parseFloat(betAmountInput?.value);
  if (isNaN(betVal) || betVal < 10) return alert("Minimum bet is 10 CPLAY");

  const betWei = ethers.parseEther(betVal.toString());
  if (profileState.balance < betWei) return alert("Insufficient balance");

  btnRoll.disabled = true;
  if (!(await ensureApproval(betWei))) {
    btnRoll.disabled = false;
    return;
  }

  if (flipStatusMsg) flipStatusMsg.textContent = "Submitting bet...";
  coinVisual?.classList.add('spin-animation');

  const logRow = logTransaction(`Lucky Flip (${betChoice})`, "N/A", "pending");

  try {
    const tx = await contract.coinFlip(betChoice === "heads", betWei);
    const receipt = await tx.wait();
    updateTransactionLog(logRow, "success", `Gas: ${receipt.gasUsed}`);

    let won = false;
    let payout = 0n;
    for (const log of receipt.logs) {
      try {
        const parsed = contract.interface.parseLog(log);
        if (parsed?.name === "CoinFlipResult") {
          won = parsed.args.won;
          payout = parsed.args.payout;
        }
      } catch {}
    }

    setTimeout(async () => {
      coinVisual?.classList.remove('spin-animation');
      if (flipStatusMsg) {
        if (won) {
          flipStatusMsg.className = "flip-status-message won";
          flipStatusMsg.innerHTML = `YOU WON! +${ethers.formatEther(payout)} $CPLAY`;
        } else {
          flipStatusMsg.className = "flip-status-message lost";
          flipStatusMsg.innerHTML = `YOU LOST!`;
        }
      }
      await fetchPlayerProfile();
      await loadLeaderboard();
    }, 3200);

  } catch (error) {
    console.error(error);
    coinVisual?.classList.remove('spin-animation');
    updateTransactionLog(logRow, "failed", error.reason || "Rejected");
    if (flipStatusMsg) flipStatusMsg.textContent = "Transaction failed";
    btnRoll.disabled = false;
  }
});

// ====================== Approval ======================
async function ensureApproval(requiredAmount) {
  if (!tokenContract || !contract) return false;

  const spender = await contract.getAddress();
  const current = await tokenContract.allowance(walletAddress, spender);
  if (current >= requiredAmount) return true;

  const logRow = logTransaction("Approve $CPLAY", "N/A", "pending");
  try {
    const tx = await tokenContract.approve(spender, ethers.MaxUint256);
    const receipt = await tx.wait();
    updateTransactionLog(logRow, "success", `Gas: ${receipt.gasUsed}`);
    return true;
  } catch (e) {
    updateTransactionLog(logRow, "failed", e.reason || "Rejected");
    return false;
  }
}

// ====================== Event Listeners ======================
if (btnConnect) btnConnect.addEventListener('click', connectWallet);
if (btnDisconnect) btnDisconnect.addEventListener('click', disconnectWallet);
if (btnSwitchNetwork) btnSwitchNetwork.addEventListener('click', switchNetwork);

// ====================== Background Particles ======================
const canvas = document.getElementById('bg-canvas');
if (canvas) {
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
      this.color = Math.random() > 0.5 ? 'rgba(6, 182, 212,' : 'rgba(139, 92, 246,';
      this.alpha = Math.random() * 0.5 + 0.2;
    }
    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      if (this.y < 0) {
        this.y = canvas.height;
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
    const count = Math.min(80, Math.floor(window.innerWidth / 15));
    for (let i = 0; i < count; i++) particles.push(new Particle());
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(animate);
  }

  initParticles();
  animate();
}

// Start
initWeb3();
