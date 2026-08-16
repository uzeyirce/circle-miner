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

// Default deployed addresses
const DEFAULT_CONTRACTS = {
  "5042": "0xd67d5a4559d07e8154E0B0dd2DB72597f727e748",
  "31337": "0x5FbDB2315678afecb367f032d93F642f64180aa3"
};

const CPLAY_TOKEN_ADDRESS = {
  "5042": "0x8613155fF713c13F6C177275Af9bF195e69dEd34",
  "31337": "0x5FbDB2315678afecb367f032d93F642f64180aa3"
};

// ===== MANUAL CONTRACT ABI =====
const CONTRACT_ABI = [
  "function getPlayerProfile(address) view returns (uint256,bool,bool,uint256,uint256,string,uint256,bool,uint256,uint256,uint256)",
  "function getClickUpgradeCost(uint256) view returns (uint256)",
  "function buyClickUpgrade() returns (bool)",
  "function getUpgradeCost(uint256) view returns (uint256)",
  "function buyMinerUpgrade() returns (bool)",
  "function claimMining() returns (bool)",
  "function coinFlip(bool,uint256) returns (bool)",
  "function setUsername(string) returns (bool)",
  "function totalWinnings(address) view returns (uint256)",
  "function usernames(address) view returns (string)",
  "event CoinFlipResult(address indexed player, bool won, uint256 payout)"
];

const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address,address) view returns (uint256)",
  "function approve(address,uint256) returns (bool)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)"
];

let tokenContract = null;

function getContractAddress(chainId) {
  const chainStr = String(chainId);
  localStorage.removeItem(`base_cyber_contract_${chainStr}`);
  return DEFAULT_CONTRACTS[chainStr] || DEFAULT_CONTRACTS["5042"];
}

// DOM Elements
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

let transactionsCount = 0;
let betChoice = "heads";

/* ===== TABS ===== */
document.querySelectorAll('.nav-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-tab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
  });
});

/* ===== WALLET ===== */
async function initWeb3() {
  if (!window.ethereum) {
    btnConnect.addEventListener('click', () => alert("Install MetaMask!"));
    return;
  }
  try {
    provider = new ethers.BrowserProvider(window.ethereum);
    window.ethereum.on('chainChanged', () => location.reload());
    window.ethereum.on('accountsChanged', (acc) => acc.length ? connectWallet() : disconnectWallet());
    const accounts = await provider.listAccounts();
    if (accounts.length) await connectWallet();
  } catch (e) { console.error("initWeb3 error:", e); }
}

async function connectWallet() {
  try {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    walletAddress = accounts[0];
    signer = await provider.getSigner();
    const network = await provider.getNetwork();
    currentChainId = network.chainId;

    btnConnect.innerHTML = `Connected: ${walletAddress.slice(0,6)}...${walletAddress.slice(-4)}`;
    btnConnect.classList.remove('btn-connect');
    btnConnect.classList.add('btn-outline');
    btnDisconnect.classList.remove('hidden');
    walletAddressAbbr.textContent = `${walletAddress.slice(0,10)}...${walletAddress.slice(-4)}`;
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
  } catch (e) { console.error("connectWallet error:", e); }
}

function disconnectWallet() {
  walletAddress = null; signer = null; contract = null; tokenContract = null;
  btnConnect.innerHTML = 'Connect Wallet';
  btnConnect.classList.add('btn-connect');
  btnConnect.classList.remove('btn-outline');
  btnDisconnect.classList.add('hidden');
  walletAddressAbbr.textContent = 'Not Connected';
  tokenDisplay.classList.add('hidden');
  disableGameControls();
  if (miningUpdateInterval) clearInterval(miningUpdateInterval);
  if (window.ethereum?.request) {
    window.ethereum.request({ method: 'wallet_revokePermissions', params: [{ eth_accounts: {} }] })
      .catch(() => {});
  }
}

function disableGameControls() {
  [btnClaimMining, btnUpgradeClick, btnUpgradeMiner, btnRoll, btnSetUsername].forEach(b => b.disabled = true);
}

async function switchNetwork() {
  try {
    await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x13B3' }] });
  } catch (e) {
    if (e.code === 4902) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: '0x13B3',
          chainName: 'Arc Mainnet',
          nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
          rpcUrls: ['https://arc-mainnet.infura.io/v3/de58e8647ba54873a65e6b8d2d7bade7'],
          blockExplorerUrls: ['https://arc.exploreme.pro']
        }]
      });
    }
  }
}

btnDisconnect.addEventListener('click', disconnectWallet);
btnSwitchNetwork.addEventListener('click', switchNetwork);
btnConnect.addEventListener('click', connectWallet);

/* ===== LEADERBOARD ===== */
async function loadLeaderboard() {
  if (!contract) return;
  try {
    leaderboardTbody.innerHTML = '<tr><td colspan="3">Loading…</td></tr>';
    const filter = contract.filters.CoinFlipResult();
    const CHUNK = 9000;
    const latest = await contract.runner.provider.getBlockNumber();
    let events = [];
    for (let from = 0; from <= latest; from += CHUNK + 1) {
      const to = Math.min(from + CHUNK, latest);
      const chunk = await contract.queryFilter(filter, from, to);
      events.push(...chunk);
    }
    const unique = [...new Set(events.map(e => e.args.player))];
    if (!unique.length) { leaderboardTbody.innerHTML = '<tr><td colspan="3">No plays yet</td></tr>'; return; }
    const data = await Promise.all(unique.map(async addr => {
      const [w, n] = await Promise.all([contract.totalWinnings(addr), contract.usernames(addr)]);
      return { address: addr, winnings: w, name: n };
    }));
    const ranked = data.filter(p => p.winnings > 0n).sort((a,b) => a.winnings > b.winnings ? -1 : 1).slice(0,25);
    if (!ranked.length) { leaderboardTbody.innerHTML = '<tr><td colspan="3">No winners yet</td></tr>'; return; }
    leaderboardTbody.innerHTML = ranked.map((p,i) => {
      const name = p.name?.length ? p.name : `${p.address.slice(0,6)}...${p.address.slice(-4)}`;
      const w = Number(ethers.formatEther(p.winnings)).toFixed(2);
      return `<tr><td>${i+1}</td><td>${name}</td><td>${w} CPLAY</td></tr>`;
    }).join('');
  } catch (e) { console.error("Leaderboard error:", e); leaderboardTbody.innerHTML = '<tr><td colspan="3">Error loading</td></tr>'; }
}

/* ===== PROFILE (manual eth_call) ===== */
async function fetchPlayerProfile() {
  if (!contract || !walletAddress) return;
  try {
    const iface = new ethers.Interface([
      "function getPlayerProfile(address) view returns (uint256,bool,bool,uint256,uint256,string,uint256,bool,uint256,uint256,uint256)"
    ]);
    const data = iface.encodeFunctionData("getPlayerProfile", [walletAddress]);
    const raw = await window.ethereum.request({
      method: "eth_call",
      params: [{ to: contract.address, data }, "latest"]
    });
    const decoded = iface.decodeFunctionResult("getPlayerProfile", raw);
    const result = Array.from(decoded);
    console.log("✅ Profile:", result);

    profileState.balance = result[0];
    profileState.circleMinerEnabled = result[1];
    profileState.luckyFlipEnabled = result[2];
    profileState.allowance = result[3];
    profileState.vaultBalance = result[4];
    profileState.username = result[5] || '';
    profileState.totalWinnings = result[6];
    profileState.faucetClaimed = result[7];
    profileState.minerLevel = result[8];
    profileState.clickLevel = result[9];
    profileState.pendingRewards = result[10];
    profileState.lastUpdated = Date.now();

    // UI update
    playerBalanceEl.textContent = Number(ethers.formatEther(profileState.balance)).toFixed(2);
    vaultBalanceValEl.textContent = `${Number(ethers.formatEther(profileState.vaultBalance)).toFixed(2)} CPLAY`;
    usernameDisplay.textContent = profileState.username || '— not set —';
    usernameInput.placeholder = profileState.username ? 'Change username' : 'Set a username';
    usernameInput.value = '';
    btnSetUsername.disabled = true;
    totalWinningsValEl.textContent = `${Number(ethers.formatEther(profileState.totalWinnings)).toFixed(2)} CPLAY`;

    btnRoll.disabled = !profileState.luckyFlipEnabled || profileState.balance < ethers.parseEther("10");

    if (profileState.circleMinerEnabled) {
      clickLevelLbl.textContent = profileState.clickLevel.toString();
      minerLevelLbl.textContent = profileState.minerLevel.toString();

      const clickCost = await contract.getClickUpgradeCost(profileState.clickLevel);
      clickUpgradeCost.textContent = Number(ethers.formatEther(clickCost)).toFixed(0);
      btnUpgradeClick.disabled = profileState.balance < clickCost;

      const minerCost = await contract.getUpgradeCost(profileState.minerLevel);
      minerUpgradeCost.textContent = Number(ethers.formatEther(minerCost)).toFixed(0);
      btnUpgradeMiner.disabled = profileState.balance < minerCost;

      pendingClaimLocal = parseFloat(ethers.formatEther(profileState.pendingRewards));
      updateMiningDisplay();
    }
  } catch (e) {
    console.error("fetchPlayerProfile error:", e);
    flipStatusMsg.textContent = "Contract read failed. Check address.";
  }
}

/* ===== MINING TIMER ===== */
function startPassiveMiningTimer() {
  if (miningUpdateInterval) clearInterval(miningUpdateInterval);
  miningUpdateInterval = setInterval(() => {
    const minerLevel = Number(profileState.minerLevel || 0n);
    const clickLevel = Number(profileState.clickLevel || 0n);
    if (minerLevel > 0) {
      const base = 0.001 * minerLevel;
      const rate = base * (1 + clickLevel * 0.1);
      pendingClaimLocal += rate * 0.1; // every 100ms
    }
    updateMiningDisplay();
  }, 100);
}

function updateMiningDisplay() {
  miningPendingEl.textContent = pendingClaimLocal.toFixed(4);
  btnClaimMining.disabled = pendingClaimLocal <= 0.0001;
}

/* ===== CRYSTAL CLICK ===== */
clickCrystal.addEventListener('click', (e) => {
  const mult = 1 + Number(profileState.clickLevel);
  localClicks += 1;
  localClicksEl.textContent = localClicks;
  updateMiningDisplay();
  // particle
  const rect = clickCrystal.getBoundingClientRect();
  const x = e.clientX || rect.left + rect.width/2;
  const y = e.clientY || rect.top + rect.height/2;
  const el = document.createElement('div');
  el.className = 'floating-click-val';
  el.style.left = x + 'px';
  el.style.top = y + 'px';
  el.textContent = '+' + mult;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 800);
});

/* ===== TRANSACTION LOG ===== */
function logTransaction(action, txHash, status) {
  txEmptyRow.classList.add('hidden');
  transactionsCount++;
  txCountEl.textContent = `${transactionsCount} Transaction${transactionsCount>1?'s':''}`;
  const tr = document.createElement('tr');
  const time = new Date().toTimeString().slice(0,8);
  const badge = status === 'pending' ? '<span class="tx-status-badge pending">⏳ Pending</span>' :
                status === 'success' ? '<span class="tx-status-badge success">✅ Success</span>' :
                '<span class="tx-status-badge failed">❌ Failed</span>';
  const link = txHash !== 'N/A' ? `<a href="https://arc.exploreme.pro/tx/${txHash}" target="_blank">${txHash.slice(0,10)}...</a>` : 'N/A';
  tr.innerHTML = `<td>${time}</td><td>${action}</td><td>${badge}</td><td>Gas estimate...</td><td>${link}</td>`;
  txTbody.insertBefore(tr, txTbody.firstChild);
  return tr;
}
function updateTxLog(row, status, gas) {
  const statusTd = row.cells[2];
  const gasTd = row.cells[3];
  statusTd.innerHTML = status === 'success' ? '<span class="tx-status-badge success">✅ Success</span>' :
                       '<span class="tx-status-badge failed">❌ Failed</span>';
  gasTd.textContent = gas || 'N/A';
}

/* ===== BUTTON HANDLERS ===== */
// Set username
usernameInput.addEventListener('input', () => btnSetUsername.disabled = !contract || !usernameInput.value.trim());
btnSetUsername.addEventListener('click', async () => {
  if (!contract) return;
  const name = usernameInput.value.trim();
  if (!name || name.length > 20) { alert('1-20 chars'); return; }
  btnSetUsername.disabled = true;
  const row = logTransaction('Set Username', 'N/A', 'pending');
  try {
    const tx = await contract.setUsername(name);
    row.cells[4].innerHTML = `<a href="https://arc.exploreme.pro/tx/${tx.hash}" target="_blank">${tx.hash.slice(0,10)}...</a>`;
    const receipt = await tx.wait();
    updateTxLog(row, 'success', `Gas: ${receipt.gasUsed.toString()}`);
    usernameInput.value = '';
    await fetchPlayerProfile();
    await loadLeaderboard();
  } catch(e) { updateTxLog(row, 'failed', e.reason || 'Rejected'); btnSetUsername.disabled = false; }
});

// Upgrades
async function upgradeHandler(txPromise, label) {
  if (!contract) return;
  const row = logTransaction(label, 'N/A', 'pending');
  try {
    const tx = await txPromise;
    row.cells[4].innerHTML = `<a href="https://arc.exploreme.pro/tx/${tx.hash}" target="_blank">${tx.hash.slice(0,10)}...</a>`;
    const receipt = await tx.wait();
    updateTxLog(row, 'success', `Gas: ${receipt.gasUsed.toString()}`);
    await fetchPlayerProfile();
  } catch(e) { updateTxLog(row, 'failed', e.reason || 'Rejected'); }
}

btnUpgradeClick.addEventListener('click', async () => {
  if (!contract) return;
  btnUpgradeClick.disabled = true;
  try {
    const cost = await contract.getClickUpgradeCost(profileState.clickLevel);
    if (!await ensureApproval(cost)) { btnUpgradeClick.disabled = false; return; }
    await upgradeHandler(contract.buyClickUpgrade(), 'Upgrade Super-Click');
  } catch(e) { console.error(e); }
  btnUpgradeClick.disabled = false;
});

btnUpgradeMiner.addEventListener('click', async () => {
  if (!contract) return;
  btnUpgradeMiner.disabled = true;
  try {
    const cost = await contract.getUpgradeCost(profileState.minerLevel);
    if (!await ensureApproval(cost)) { btnUpgradeMiner.disabled = false; return; }
    await upgradeHandler(contract.buyMinerUpgrade(), 'Upgrade Mining Rig');
  } catch(e) { console.error(e); }
  btnUpgradeMiner.disabled = false;
});

btnClaimMining.addEventListener('click', async () => {
  if (!contract) return;
  btnClaimMining.disabled = true;
  const row = logTransaction('Claim Mining Rewards', 'N/A', 'pending');
  try {
    const tx = await contract.claimMining();
    row.cells[4].innerHTML = `<a href="https://arc.exploreme.pro/tx/${tx.hash}" target="_blank">${tx.hash.slice(0,10)}...</a>`;
    const receipt = await tx.wait();
    updateTxLog(row, 'success', `Gas: ${receipt.gasUsed.toString()}`);
    localClicks = 0; localClicksEl.textContent = 0;
    await fetchPlayerProfile();
  } catch(e) { updateTxLog(row, 'failed', e.reason || 'Rejected'); }
  btnClaimMining.disabled = false;
});

// Lucky Flip
btnBetHeads.addEventListener('click', () => { betChoice='heads'; btnBetHeads.classList.add('active'); btnBetTails.classList.remove('active'); });
btnBetTails.addEventListener('click', () => { betChoice='tails'; btnBetTails.classList.add('active'); btnBetHeads.classList.remove('active'); });
btnBetMax.addEventListener('click', () => {
  if (profileState.balance > 0n) {
    const val = Number(ethers.formatEther(profileState.balance));
    betAmountInput.value = Math.max(10, Math.floor(val/10)*10);
  }
});

btnRoll.addEventListener('click', async () => {
  if (!contract) return;
  const val = parseFloat(betAmountInput.value);
  if (isNaN(val) || val < 10) { alert('Min bet 10 CPLAY'); return; }
  const betWei = ethers.parseEther(val.toString());
  if (profileState.balance < betWei) { alert('Insufficient balance'); return; }
  btnRoll.disabled = true;
  if (!await ensureApproval(betWei)) { btnRoll.disabled = false; return; }
  flipStatusMsg.className = 'flip-status-message';
  flipStatusMsg.textContent = 'Submitting bet...';
  coinVisual.classList.add('spin-animation');
  const isHeads = betChoice === 'heads';
  const row = logTransaction(`Flip (${betChoice})`, 'N/A', 'pending');
  try {
    const tx = await contract.coinFlip(isHeads, betWei);
    row.cells[4].innerHTML = `<a href="https://arc.exploreme.pro/tx/${tx.hash}" target="_blank">${tx.hash.slice(0,10)}...</a>`;
    const receipt = await tx.wait();
    updateTxLog(row, 'success', `Gas: ${receipt.gasUsed.toString()}`);
    let won = false, payout = 0n;
    for (const log of receipt.logs) {
      try {
        const parsed = contract.interface.parseLog(log);
        if (parsed?.name === 'CoinFlipResult') { won = parsed.args.won; payout = parsed.args.payout; }
      } catch(_) {}
    }
    const landedHeads = (isHeads && won) || (!isHeads && !won);
    const target = landedHeads ? '1800deg' : '1980deg';
    coinVisual.style.setProperty('--coin-spin-target', target);
    setTimeout(async () => {
      coinVisual.classList.remove('spin-animation');
      flipStatusMsg.className = won ? 'flip-status-message won' : 'flip-status-message lost';
      flipStatusMsg.innerHTML = won ? `🎉 YOU WON! +${ethers.formatEther(payout)} CPLAY` : '😞 YOU LOST!';
      await fetchPlayerProfile();
      await loadLeaderboard();
      btnRoll.disabled = false;
    }, 3200);
  } catch(e) {
    console.error(e);
    coinVisual.classList.remove('spin-animation');
    updateTxLog(row, 'failed', e.reason || 'Rejected');
    flipStatusMsg.textContent = 'Transaction failed.';
    btnRoll.disabled = false;
  }
});

/* ===== APPROVAL ===== */
async function ensureApproval(amount) {
  if (!tokenContract || !contract) return false;
  const addr = await contract.getAddress();
  const allowance = await tokenContract.allowance(walletAddress, addr);
  if (allowance >= amount) return true;
  const row = logTransaction('Approve $CPLAY', 'N/A', 'pending');
  try {
    const tx = await tokenContract.approve(addr, ethers.MaxUint256);
    row.cells[4].innerHTML = `<a href="https://arc.exploreme.pro/tx/${tx.hash}" target="_blank">${tx.hash.slice(0,10)}...</a>`;
    await tx.wait();
    updateTxLog(row, 'success', 'Approved');
    return true;
  } catch(e) {
    updateTxLog(row, 'failed', e.reason || 'Rejected');
    return false;
  }
}

/* ===== PARTICLES ===== */
const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');
let particles = [];
function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.addEventListener('resize', resize); resize();
class Particle {
  constructor() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.size = Math.random() * 1.5 + 0.5;
    this.speedX = (Math.random() - 0.5) * 0.15;
    this.speedY = -Math.random() * 0.2 - 0.05;
    this.color = Math.random() > 0.5 ? 'rgba(6,182,212,' : 'rgba(139,92,246,';
    this.alpha = Math.random() * 0.5 + 0.2;
  }
  update() {
    this.x += this.speedX; this.y += this.speedY;
    if (this.y < 0 || this.x < 0 || this.x > canvas.width) this.reset();
  }
  reset() {
    this.y = canvas.height;
    this.x = Math.random() * canvas.width;
  }
  draw() {
    ctx.fillStyle = this.color + this.alpha + ')';
    ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI*2); ctx.fill();
  }
}
function initParticles() { particles = []; for (let i=0; i<Math.min(100, Math.floor(window.innerWidth/15)); i++) particles.push(new Particle()); }
function animate() { ctx.clearRect(0,0,canvas.width,canvas.height); particles.forEach(p => { p.update(); p.draw(); }); requestAnimationFrame(animate); }
initParticles(); animate();

// Start
initWeb3();
