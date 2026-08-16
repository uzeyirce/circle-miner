/** Arc Cyber Miner & Lucky Flip — fixed app.js (Ethers v6) */
(() => {
'use strict';

const ARC_CHAIN_ID = 5042n;
const HARDHAT_CHAIN_ID = 31337n;
const ARC_CHAIN_HEX = '0x13B3'; // DÜZELTİLDİ (büyük harf)

const GAME_ADDRESS = {
  '5042': '0xd67d5a4559d07e8154E0B0dd2DB72597f727e748',
  '31337': '0x5FbDB2315678afecb367f032d93F642f64180aa3'
};
const CPLAY_ADDRESS = {
  '5042': '0x8613155fF713c13F6C177275Af9bF195e69dEd34',
  '31337': '0x5FbDB2315678afecb367f032d93F642f64180aa3'
};

// GAME_ABI — artifacts.js ile çakışmayı önler
const GAME_ABI = [
  'function getPlayerProfile(address) view returns (uint256,bool,bool,uint256,uint256,string,uint256,bool,uint256,uint256,uint256)',
  'function getClickUpgradeCost(uint256) view returns (uint256)',
  'function getUpgradeCost(uint256) view returns (uint256)',
  'function buyClickUpgrade()',
  'function buyMinerUpgrade()',
  'function claimMining()',
  'function setUsername(string)',
  'function coinFlip(bool,uint256)',
  'function totalWinnings(address) view returns (uint256)',
  'function usernames(address) view returns (string)',
  'event CoinFlipResult(address indexed player,uint256 bet,bool won,uint256 payout)'
];

const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function allowance(address,address) view returns (uint256)',
  'function approve(address,uint256) returns (bool)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)'
];

let provider = null, signer = null, contract = null, tokenContract = null;
let walletAddress = null, currentChainId = null;
let localClicks = 0, pendingClaimLocal = 0, miningUpdateInterval = null;
let transactionsCount = 0, betChoice = 'heads', connecting = false;

const profileState = {
  balance: 0n, circleMinerEnabled: true, luckyFlipEnabled: true,
  allowance: 0n, vaultBalance: 0n, username: '', totalWinnings: 0n,
  faucetClaimed: false, minerLevel: 0n, clickLevel: 0n,
  pendingRewards: 0n, lastUpdated: 0
};

const $ = id => document.getElementById(id);
const el = {
  connect: $('btn-connect'), disconnect: $('btn-disconnect'), token: $('token-display'),
  balance: $('player-balance'), warning: $('network-warning'), switch: $('btn-switch-network'),
  address: $('wallet-address-abbr'), username: $('username-display'), vault: $('vault-balance-val'),
  winnings: $('total-winnings-val'), usernameInput: $('username-input'), setUsername: $('btn-set-username'),
  leaderboard: $('leaderboard-tbody'), clickCrystal: $('click-crystal'), localClicks: $('local-clicks'),
  pending: $('mining-pending'), claim: $('btn-claim-mining'), clickLevel: $('click-level-lbl'),
  clickCost: $('click-upgrade-cost'), upgradeClick: $('btn-upgrade-click'), minerLevel: $('miner-level-lbl'),
  minerCost: $('miner-upgrade-cost'), upgradeMiner: $('btn-upgrade-miner'), coin: $('coin-visual'),
  heads: $('btn-bet-heads'), tails: $('btn-bet-tails'), bet: $('bet-amount'), max: $('btn-bet-max'),
  roll: $('btn-roll'), status: $('flip-status-msg'), txBody: $('tx-tbody'), txCount: $('tx-count'),
  emptyTx: $('tx-empty-row'), canvas: $('bg-canvas')
};

function disableGame() {
  [el.claim, el.upgradeClick, el.upgradeMiner, el.roll, el.setUsername].forEach(x => { if (x) x.disabled = true; });
}
function errMsg(e) { return e?.reason || e?.shortMessage || e?.info?.error?.message || e?.error?.message || e?.message || 'Unknown error'; }
function fmt(v, d = 2) { try { return Number(parseFloat(ethers.formatEther(v)).toFixed(d)).toLocaleString(); } catch { return '0'; } }
function gameAddress() { return GAME_ADDRESS[String(currentChainId)]; }
function tokenAddress() { return CPLAY_ADDRESS[String(currentChainId)]; }
function txLink(hash) { return `https://arc.exploreme.pro/tx/${hash}`; }

// Tabs
for (const b of document.querySelectorAll('.nav-tab')) b.addEventListener('click', () => {
  document.querySelectorAll('.nav-tab').forEach(x => x.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(x => x.classList.remove('active'));
  b.classList.add('active'); $(b.dataset.tab)?.classList.add('active');
});

async function initWeb3() {
  if (!window.ethereum) {
    el.connect?.addEventListener('click', () => alert('No Ethereum wallet detected. Please install MetaMask.'));
    return;
  }
  try {
    provider = new ethers.BrowserProvider(window.ethereum);
    if (!window.ethereum.__circleMinerListenersAttached) {
      window.ethereum.__circleMinerListenersAttached = true;
      window.ethereum.on('chainChanged', () => location.reload());
      window.ethereum.on('accountsChanged', async accounts => {
        if (!accounts?.length) return resetConnection(false);
        await connectWallet(false);
      });
    }
    const accounts = await provider.listAccounts();
    if (accounts.length) await connectWallet(false);
  } catch (e) { console.error('Web3 init failed:', e); }
}

async function connectWallet(request = true) {
  if (connecting) return; connecting = true;
  try {
    if (!provider) provider = new ethers.BrowserProvider(window.ethereum);
    const accounts = await window.ethereum.request({ method: request ? 'eth_requestAccounts' : 'eth_accounts' });
    if (!accounts?.length) return resetConnection(false);
    walletAddress = ethers.getAddress(accounts[0]);
    signer = await provider.getSigner();
    currentChainId = (await provider.getNetwork()).chainId;

    el.connect.innerHTML = `<i class="fa-solid fa-circle-nodes"></i> Connected: ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
    el.connect.classList.remove('btn-connect'); el.connect.classList.add('btn-outline');
    el.disconnect?.classList.remove('hidden'); el.token?.classList.remove('hidden');
    if (el.address) el.address.textContent = `${walletAddress.slice(0, 10)}...${walletAddress.slice(-8)}`;

    if (currentChainId !== ARC_CHAIN_ID && currentChainId !== HARDHAT_CHAIN_ID) {
      el.warning?.classList.remove('hidden'); disableGame(); return;
    }
    el.warning?.classList.add('hidden');

    contract = new ethers.Contract(gameAddress(), GAME_ABI, signer);
    tokenContract = new ethers.Contract(tokenAddress(), ERC20_ABI, signer);

    console.log('Wallet:', walletAddress);
    console.log('Chain:', currentChainId.toString());
    console.log('Game contract:', await contract.getAddress());
    console.log('CPLAY contract:', await tokenContract.getAddress());

    const code = await provider.getCode(gameAddress());
    if (code === '0x') throw new Error(`No contract bytecode at ${gameAddress()}`);

    await fetchPlayerProfile();
    await loadLeaderboard();  // Leaderboard aktif
    startPassiveMiningTimer();
  } catch (e) {
    console.error('Wallet connection failed:', e);
    if (el.status) el.status.textContent = `Contract read failed: ${errMsg(e)}`;
  } finally { connecting = false; }
}

function resetConnection(revoke = false) {
  walletAddress = null; signer = null; contract = null; tokenContract = null; currentChainId = null;
  if (miningUpdateInterval) clearInterval(miningUpdateInterval); miningUpdateInterval = null;
  if (el.connect) { el.connect.innerHTML = '<i class="fa-solid fa-wallet"></i> Connect Wallet'; el.connect.classList.add('btn-connect'); el.connect.classList.remove('btn-outline'); }
  el.disconnect?.classList.add('hidden'); el.token?.classList.add('hidden');
  if (el.address) el.address.textContent = 'Not Connected'; disableGame();
  if (revoke) window.ethereum?.request({ method: 'wallet_revokePermissions', params: [{ eth_accounts: {} }] }).catch(() => {});
}
function disconnectWallet() { resetConnection(true); }
el.connect?.addEventListener('click', () => connectWallet(true));
el.disconnect?.addEventListener('click', disconnectWallet);

async function switchNetwork() {
  try { await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: ARC_CHAIN_HEX }] }); }
  catch (e) {
    if (e.code === 4902) await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: ARC_CHAIN_HEX,
        chainName: 'Arc Mainnet',
        nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
        rpcUrls: ['https://arc-mainnet.infura.io/v3/b6bf7d3508c941499b10025c0776eaf8'],
        blockExplorerUrls: ['https://arc.exploreme.pro']
      }]
    }).catch(x => console.error(x));
    else console.error('Network switch failed:', e);
  }
}
el.switch?.addEventListener('click', switchNetwork);

// ========== LEADERBOARD (chunked to avoid RPC limit) ==========
async function loadLeaderboard() {
  if (!contract) {
    if (el.leaderboard) el.leaderboard.innerHTML = '<tr><td colspan="3">Contract not ready</td></tr>';
    return;
  }
  try {
    if (el.leaderboard) el.leaderboard.innerHTML = '<tr><td colspan="3">Loading leaderboard…</td></tr>';
    const filter = contract.filters.CoinFlipResult();
    const CHUNK = 9000;
    // Global provider'ı kullan (zaten connectWallet'te oluşturuldu)
    const prov = provider || contract.runner?.provider;
    if (!prov) throw new Error('Provider not available');
    const latestBlock = await prov.getBlockNumber();
    const events = [];
    let from = 0;
    while (from <= latestBlock) {
      const to = Math.min(from + CHUNK, latestBlock);
      const chunkEvents = await contract.queryFilter(filter, from, to);
      events.push(...chunkEvents);
      from = to + 1;
    }

    const uniquePlayers = [...new Set(events.map(e => e.args.player))];
    if (uniquePlayers.length === 0) {
      if (el.leaderboard) el.leaderboard.innerHTML = '<tr><td colspan="3">No plays yet — be the first!</td></tr>';
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
      .sort((a, b) => (b.winnings > a.winnings ? 1 : a.winnings > b.winnings ? -1 : 0))
      .slice(0, 25);

    if (ranked.length === 0) {
      if (el.leaderboard) el.leaderboard.innerHTML = '<tr><td colspan="3">No winners yet — be the first!</td></tr>';
      return;
    }

    if (el.leaderboard) {
      el.leaderboard.innerHTML = ranked.map((p, i) => {
        const displayName = p.name && p.name.length > 0 ? p.name : `${p.address.slice(0, 6)}...${p.address.slice(-4)}`;
        const winningsFormatted = Number(parseFloat(ethers.formatEther(p.winnings)).toFixed(2)).toLocaleString();
        return `<tr><td>${i + 1}</td><td class="monospace">${displayName}</td><td>${winningsFormatted} CPLAY</td></tr>`;
      }).join('');
    }
  } catch (error) {
    console.error('Leaderboard load error:', error);
    if (el.leaderboard) el.leaderboard.innerHTML = `<tr><td colspan="3">Error loading: ${errMsg(error)}</td></tr>`;
  }
}

// ========== PROFILE (manual eth_call to avoid RangeError) ==========
async function fetchPlayerProfile() {
  if (!contract || !walletAddress) return false;
  try {
    const iface = new ethers.Interface([
      "function getPlayerProfile(address) view returns (uint256,bool,bool,uint256,uint256,string,uint256,bool,uint256,uint256,uint256)"
    ]);
    const data = iface.encodeFunctionData("getPlayerProfile", [walletAddress]);
    const raw = await window.ethereum.request({
      method: "eth_call",
      params: [{ to: await contract.getAddress(), data }, "latest"]
    });
    const decoded = iface.decodeFunctionResult("getPlayerProfile", raw);
    const result = Array.from(decoded);

    if (!result || result.length < 11) throw new Error(`Unexpected profile result length: ${result?.length ?? 0}`);

    [
      profileState.balance,
      profileState.circleMinerEnabled,
      profileState.luckyFlipEnabled,
      profileState.allowance,
      profileState.vaultBalance,
      profileState.username,
      profileState.totalWinnings,
      profileState.faucetClaimed,
      profileState.minerLevel,
      profileState.clickLevel,
      profileState.pendingRewards
    ] = result;
    profileState.lastUpdated = Date.now();

    // UI updates
    if (el.balance) el.balance.textContent = fmt(profileState.balance);
    if (el.vault) el.vault.textContent = `${fmt(profileState.vaultBalance)} CPLAY`;
    if (el.winnings) el.winnings.textContent = `${fmt(profileState.totalWinnings)} CPLAY`;
    if (el.username) el.username.textContent = profileState.username || '— not set —';
    if (el.usernameInput) { el.usernameInput.placeholder = profileState.username ? 'Change username' : 'Set a username'; el.usernameInput.value = ''; }
    if (el.setUsername) el.setUsername.disabled = true;
    if (el.roll) el.roll.disabled = !profileState.luckyFlipEnabled || profileState.balance < ethers.parseEther('10');

    if (profileState.circleMinerEnabled) {
      if (el.clickLevel) el.clickLevel.textContent = profileState.clickLevel.toString();
      if (el.minerLevel) el.minerLevel.textContent = profileState.minerLevel.toString();
      try {
        const c = await contract.getClickUpgradeCost(profileState.clickLevel);
        if (el.clickCost) el.clickCost.textContent = ethers.formatEther(c).split('.')[0];
        if (el.upgradeClick) el.upgradeClick.disabled = profileState.balance < c;
      } catch (e) { console.error('getClickUpgradeCost:', e); if (el.clickCost) el.clickCost.textContent = '—'; if (el.upgradeClick) el.upgradeClick.disabled = true; }
      try {
        const c = await contract.getUpgradeCost(profileState.minerLevel);
        if (el.minerCost) el.minerCost.textContent = ethers.formatEther(c).split('.')[0];
        if (el.upgradeMiner) el.upgradeMiner.disabled = profileState.balance < c;
      } catch (e) { console.error('getUpgradeCost:', e); if (el.minerCost) el.minerCost.textContent = '—'; if (el.upgradeMiner) el.upgradeMiner.disabled = true; }
      pendingClaimLocal = Number(ethers.formatEther(profileState.pendingRewards));
      updateMiningDisplay();
    }
    console.log('Player profile:', profileState);
    return true;
  } catch (e) {
    console.error('Contract read failed:', e);
    if (el.status) el.status.textContent = `Contract read failed: ${errMsg(e)}`;
    disableGame();
    return false;
  }
}

function startPassiveMiningTimer() {
  if (miningUpdateInterval) clearInterval(miningUpdateInterval);
  miningUpdateInterval = setInterval(() => {
    if (!contract || profileState.minerLevel <= 0n) return;
    const rate = (0.001 * Number(profileState.minerLevel)) * (1 + Number(profileState.clickLevel) * 0.1);
    pendingClaimLocal += rate * 0.1;
    updateMiningDisplay();
  }, 100);
}
function updateMiningDisplay() {
  if (el.pending) el.pending.textContent = pendingClaimLocal.toFixed(4);
  if (el.claim) el.claim.disabled = !contract || pendingClaimLocal <= 0;
}

el.clickCrystal?.addEventListener('click', e => {
  localClicks++; if (el.localClicks) el.localClicks.textContent = localClicks;
  const r = el.clickCrystal.getBoundingClientRect(), f = document.createElement('div');
  f.className = 'floating-click-val'; f.style.left = `${e.clientX || r.left + r.width / 2}px`; f.style.top = `${e.clientY || r.top + r.height / 2}px`;
  f.textContent = `+${1 + Number(profileState.clickLevel)}`; document.body.appendChild(f); setTimeout(() => f.remove(), 800);
});

// TX log
function logTx(action, hash = 'N/A', status = 'pending') {
  if (!el.txBody) return null; el.emptyTx?.classList.add('hidden'); transactionsCount++;
  if (el.txCount) el.txCount.textContent = `${transactionsCount} Transaction${transactionsCount > 1 ? 's' : ''}`;
  const tr = document.createElement('tr'), now = new Date();
  const time = [now.getHours(), now.getMinutes(), now.getSeconds()].map(x => String(x).padStart(2, '0')).join(':');
  const badge = status === 'pending' ? '<span class="tx-status-badge pending"><i class="fa-solid fa-spinner fa-spin"></i> Pending</span>' :
                status === 'success' ? '<span class="tx-status-badge success"><i class="fa-solid fa-circle-check"></i> Success</span>' :
                '<span class="tx-status-badge failed"><i class="fa-solid fa-circle-xmark"></i> Failed</span>';
  const link = hash !== 'N/A' ? `<a href="${txLink(hash)}" target="_blank" rel="noopener" class="monospace text-glow-blue">${hash.slice(0, 10)}...</a>` : '<span class="text-muted">N/A</span>';
  tr.innerHTML = `<td>${time}</td><td class="font-weight-bold">${action}</td><td>${badge}</td><td>Gas estimate processing...</td><td>${link}</td>`;
  el.txBody.insertBefore(tr, el.txBody.firstChild); return tr;
}
function setTxHash(row, hash) { if (row) row.cells[4].innerHTML = `<a href="${txLink(hash)}" target="_blank" rel="noopener" class="monospace text-glow-blue">${hash.slice(0, 10)}...</a>`; }
function updateTx(row, status, details) { if (!row) return; row.cells[2].innerHTML = status === 'success' ? '<span class="tx-status-badge success"><i class="fa-solid fa-circle-check"></i> Success</span>' : '<span class="tx-status-badge failed"><i class="fa-solid fa-circle-xmark"></i> Failed</span>'; row.cells[3].textContent = details || 'N/A'; }

el.usernameInput?.addEventListener('input', () => { if (el.setUsername) el.setUsername.disabled = !contract || !el.usernameInput.value.trim() || el.usernameInput.value.trim().length > 20; });
el.setUsername?.addEventListener('click', async () => {
  if (!contract) return; const name = el.usernameInput.value.trim(); if (!name || name.length > 20) return alert('Username must be 1-20 characters.');
  el.setUsername.disabled = true; const row = logTx('Set Username');
  try { const tx = await contract.setUsername(name); setTxHash(row, tx.hash); const rc = await tx.wait(); updateTx(row, 'success', `Gas used: ${rc.gasUsed}`); await fetchPlayerProfile(); await loadLeaderboard(); }
  catch (e) { console.error(e); updateTx(row, 'failed', errMsg(e)); el.setUsername.disabled = false; }
});

async function ensureApproval(amount) {
  if (!tokenContract || !contract || !walletAddress) return false;
  try {
    const spender = await contract.getAddress();
    const allow = await tokenContract.allowance(walletAddress, spender);
    if (allow >= amount) return true;
    const row = logTx('Approve $CPLAY Spend');
    const tx = await tokenContract.approve(spender, ethers.MaxUint256);
    setTxHash(row, tx.hash);
    const rc = await tx.wait();
    updateTx(row, 'success', `Gas used: ${rc.gasUsed}`);
    return true;
  } catch (e) { console.error('Approval failed:', e); return false; }
}

el.upgradeClick?.addEventListener('click', async () => {
  if (!contract) return; el.upgradeClick.disabled = true;
  try {
    const cost = await contract.getClickUpgradeCost(profileState.clickLevel);
    if (profileState.balance < cost) return alert('Insufficient CPLAY balance.');
    if (!await ensureApproval(cost)) return;
    const row = logTx('Upgrade Super-Click Mult');
    const tx = await contract.buyClickUpgrade();
    setTxHash(row, tx.hash);
    const rc = await tx.wait();
    updateTx(row, 'success', `Gas used: ${rc.gasUsed}`);
    await fetchPlayerProfile();
  } catch (e) { console.error(e); alert(errMsg(e)); } finally { el.upgradeClick.disabled = false; }
});

el.upgradeMiner?.addEventListener('click', async () => {
  if (!contract) return; el.upgradeMiner.disabled = true;
  try {
    const cost = await contract.getUpgradeCost(profileState.minerLevel);
    if (profileState.balance < cost) return alert('Insufficient CPLAY balance.');
    if (!await ensureApproval(cost)) return;
    const row = logTx('Upgrade Circle Mining Rig');
    const tx = await contract.buyMinerUpgrade();
    setTxHash(row, tx.hash);
    const rc = await tx.wait();
    updateTx(row, 'success', `Gas used: ${rc.gasUsed}`);
    await fetchPlayerProfile();
  } catch (e) { console.error(e); alert(errMsg(e)); } finally { el.upgradeMiner.disabled = false; }
});

el.claim?.addEventListener('click', async () => {
  if (!contract) return; el.claim.disabled = true;
  const row = logTx('Claim Mining Rewards');
  try {
    const tx = await contract.claimMining();
    setTxHash(row, tx.hash);
    const rc = await tx.wait();
    updateTx(row, 'success', `Gas used: ${rc.gasUsed}`);
    localClicks = 0; pendingClaimLocal = 0;
    if (el.localClicks) el.localClicks.textContent = '0';
    await fetchPlayerProfile();
  } catch (e) { console.error(e); updateTx(row, 'failed', errMsg(e)); el.claim.disabled = false; }
});

el.heads?.addEventListener('click', () => { betChoice = 'heads'; el.heads.classList.add('active'); el.tails?.classList.remove('active'); });
el.tails?.addEventListener('click', () => { betChoice = 'tails'; el.tails.classList.add('active'); el.heads?.classList.remove('active'); });
el.max?.addEventListener('click', () => { const b = Math.floor(Number(ethers.formatEther(profileState.balance)) / 10) * 10; if (el.bet) el.bet.value = String(Math.max(10, b)); });

el.roll?.addEventListener('click', async () => {
  if (!contract) return; const value = Number(el.bet?.value); if (!Number.isFinite(value) || value < 10) return alert('Minimum bet amount is 10 CPLAY.');
  let amount; try { amount = ethers.parseEther(String(value)); } catch { return alert('Invalid bet amount.'); }
  if (profileState.balance < amount) return alert('Insufficient CPLAY balance.'); el.roll.disabled = true;
  const row = logTx(`Lucky Flip Bet (${betChoice.toUpperCase()})`);
  try {
    if (!await ensureApproval(amount)) { el.roll.disabled = false; return; }
    if (el.status) { el.status.className = 'flip-status-message'; el.status.textContent = 'Submitting bet to the blockchain...'; }
    el.coin?.classList.add('spin-animation'); const heads = betChoice === 'heads'; const tx = await contract.coinFlip(heads, amount); setTxHash(row, tx.hash); const rc = await tx.wait(); updateTx(row, 'success', `Gas used: ${rc.gasUsed}`);
    let won = false, payout = 0n;
    for (const log of rc.logs) { try { const p = contract.interface.parseLog(log); if (p?.name === 'CoinFlipResult') { won = Boolean(p.args.won); payout = p.args.payout; break; } } catch {} }
    const landedHeads = (heads && won) || (!heads && !won); el.coin?.style.setProperty('--coin-spin-target', landedHeads ? '1800deg' : '1980deg');
    setTimeout(async () => {
      el.coin?.classList.remove('spin-animation');
      if (el.status) { el.status.className = `flip-status-message ${won ? 'won' : 'lost'}`; el.status.innerHTML = won ? `<i class="fa-solid fa-trophy"></i> YOU WON! Received ${ethers.formatEther(payout)} $CPLAY!` : `<i class="fa-solid fa-face-frown"></i> YOU LOST! Better luck next roll.`; }
      await fetchPlayerProfile();
      await loadLeaderboard();
    }, 3200);
  } catch (e) { console.error('Coin flip failed:', e); el.coin?.classList.remove('spin-animation'); updateTx(row, 'failed', errMsg(e)); if (el.status) el.status.textContent = `Transaction failed: ${errMsg(e)}`; el.roll.disabled = false; }
});

// Background particles
if (el.canvas) {
  const ctx = el.canvas.getContext('2d');
  let particles = [];
  function resize() { el.canvas.width = innerWidth; el.canvas.height = innerHeight; }
  function init() { particles = Array.from({ length: Math.min(100, Math.floor(innerWidth / 15)) }, () => ({ x: Math.random() * el.canvas.width, y: Math.random() * el.canvas.height, s: Math.random() * 1.5 + 0.5, dx: Math.random() * 0.15 - 0.075, dy: Math.random() * -0.2 - 0.05, c: Math.random() > 0.5 ? 'rgba(6, 182, 212, ' : 'rgba(139, 92, 246, ', a: Math.random() * 0.5 + 0.2 })); }
  function animate() { ctx.clearRect(0, 0, el.canvas.width, el.canvas.height); for (const p of particles) { p.x += p.dx; p.y += p.dy; if (p.y < 0) { p.y = el.canvas.height; p.x = Math.random() * el.canvas.width; } if (p.x < 0 || p.x > el.canvas.width) p.x = Math.random() * el.canvas.width; ctx.fillStyle = p.c + p.a + ')'; ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2); ctx.fill(); } requestAnimationFrame(animate); }
  addEventListener('resize', () => { resize(); init(); }); resize(); init(); animate();
}

disableGame(); initWeb3();
})();
