/**
 * Base Cyber Miner & Lucky Flip
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
  faucetCooldown: 0n,
  minerLevel: 0n,
  clickLevel: 0n,
  pendingRewards: 0n,
  lastUpdated: 0
};

// Default deployed addresses for ease of use
const DEFAULT_CONTRACTS = {
  "84532": "0xf9ea420a32490b6efb46be167d4da0f796ad7a02", // Base Sepolia Contract (placeholder/deployed address)
  "31337": "0x5FbDB2315678afecb367f032d93F642f64180aa3"  // Hardhat Localhost default
};

// Get active contract address from LocalStorage or default to Base Sepolia
function getContractAddress(chainId) {
  const chainStr = String(chainId);
  const cached = localStorage.getItem(`base_cyber_contract_${chainStr}`);
  if (cached) return cached;
  return DEFAULT_CONTRACTS[chainStr] || DEFAULT_CONTRACTS["84532"];
}

function saveContractAddress(chainId, address) {
  localStorage.setItem(`base_cyber_contract_${String(chainId)}`, address);
}

// Page Elements
const btnConnect = document.getElementById('btn-connect');
const tokenDisplay = document.getElementById('token-display');
const playerBalanceEl = document.getElementById('player-balance');
const networkWarning = document.getElementById('network-warning');
const btnSwitchNetwork = document.getElementById('btn-switch-network');
const walletAddressAbbr = document.getElementById('wallet-address-abbr');
const clickMultiplierEl = document.getElementById('click-multiplier');
const minerLevelVal = document.getElementById('miner-level-val');
const passiveIncomeVal = document.getElementById('passive-income-val');
const btnFaucet = document.getElementById('btn-faucet');
const faucetCooldownEl = document.getElementById('faucet-cooldown');

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

// Dev Panel Elements
const contractAddressInput = document.getElementById('contract-address-input');
const btnSaveContract = document.getElementById('btn-save-contract');
const btnDeployBrowser = document.getElementById('btn-deploy-browser');
const defaultContractAddress = document.getElementById('default-contract-address');
const deployLoader = document.getElementById('deploy-loader');
const deployStatusTxt = document.getElementById('deploy-status-txt');

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
      
      // Detect network changes
      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });
      
      // Detect account changes
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          connectWallet();
        }
      });
      
      // Auto connect if authorized
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
    // Request account access
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    walletAddress = accounts[0];
    
    signer = await provider.getSigner();
    const network = await provider.getNetwork();
    currentChainId = network.chainId;
    
    btnConnect.innerHTML = `<i class="fa-solid fa-circle-nodes"></i> Connected: ${walletAddress.substring(0, 6)}...${walletAddress.substring(38)}`;
    btnConnect.classList.remove('btn-connect');
    btnConnect.classList.add('btn-outline');
    
    walletAddressAbbr.textContent = `${walletAddress.substring(0, 10)}...${walletAddress.substring(34)}`;
    tokenDisplay.classList.remove('hidden');
    
    // Check if network is Base Sepolia (84532) or Local Hardhat (31337)
    if (currentChainId === 84532n || currentChainId === 31337n) {
      networkWarning.classList.add('hidden');
      btnDeployBrowser.disabled = false;
      
      const contractAddress = getContractAddress(currentChainId);
      contractAddressInput.value = contractAddress;
      defaultContractAddress.textContent = DEFAULT_CONTRACTS[String(currentChainId)] || DEFAULT_CONTRACTS["84532"];
      
      // Instantiate contract
      contract = new ethers.Contract(contractAddress, CONTRACT_ABI, signer);
      
      // Fetch profile
      await fetchPlayerProfile();
      startPassiveMiningTimer();
    } else {
      networkWarning.classList.remove('hidden');
      btnDeployBrowser.disabled = true;
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
  walletAddressAbbr.textContent = "Not Connected";
  tokenDisplay.classList.add('hidden');
  disableGameControls();
  if (miningUpdateInterval) {
    clearInterval(miningUpdateInterval);
  }
}

function disableGameControls() {
  btnFaucet.disabled = true;
  btnClaimMining.disabled = true;
  btnUpgradeClick.disabled = true;
  btnUpgradeMiner.disabled = true;
  btnRoll.disabled = true;
}

// Switch wallet network to Base Sepolia
async function switchNetwork() {
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x14a34' }], // Base Sepolia 84532
    });
  } catch (switchError) {
    // If chain is not added, request to add it
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: '0x14a34',
              chainName: 'Base Sepolia Testnet',
              nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
              rpcUrls: ['https://sepolia.base.org'],
              blockExplorerUrls: ['https://sepolia.basescan.org'],
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

async function fetchPlayerProfile() {
  if (!contract || !walletAddress) return;
  
  try {
    // Call getPlayerProfile from smart contract
    const result = await contract.getPlayerProfile(walletAddress);
    
    profileState.balance = result[0];
    profileState.faucetCooldown = result[1];
    profileState.minerLevel = result[2];
    profileState.clickLevel = result[3];
    profileState.pendingRewards = result[4];
    profileState.lastUpdated = Date.now();
    
    // Update UI Elements
    const formattedBalance = parseFloat(ethers.formatEther(profileState.balance)).toFixed(2);
    playerBalanceEl.textContent = Number(formattedBalance).toLocaleString();
    
    clickLevelLbl.textContent = profileState.clickLevel.toString();
    minerLevelLbl.textContent = profileState.minerLevel.toString();
    minerLevelVal.textContent = `Level ${profileState.minerLevel}`;
    
    // Click Multiplier = 1 + clickLevel
    const multiplier = 1n + profileState.clickLevel;
    clickMultiplierEl.textContent = `${multiplier}x`;
    
    // Passive income: level * 0.01 BPLAY/sec
    const ratePerSec = Number(profileState.minerLevel) * 0.01;
    passiveIncomeVal.textContent = `${ratePerSec.toFixed(2)} BPLAY/sec`;
    
    // Faucet button state
    if (profileState.faucetCooldown === 0n) {
      btnFaucet.disabled = false;
      faucetCooldownEl.textContent = "";
    } else {
      btnFaucet.disabled = true;
      startFaucetCooldownTimer(Number(profileState.faucetCooldown));
    }
    
    // Upgrades Cost Updates
    const clickCost = await contract.getClickUpgradeCost(profileState.clickLevel);
    clickUpgradeCost.textContent = parseFloat(ethers.formatEther(clickCost)).toFixed(0);
    btnUpgradeClick.disabled = profileState.balance < clickCost;
    
    const minerCost = await contract.getUpgradeCost(profileState.minerLevel);
    minerUpgradeCost.textContent = parseFloat(ethers.formatEther(minerCost)).toFixed(0);
    btnUpgradeMiner.disabled = profileState.balance < minerCost;
    
    // Enable betting buttons if user has enough balance
    btnRoll.disabled = profileState.balance < ethers.parseEther("10"); // Min bet 10 BPLAY
    
    // Pending rewards visual
    pendingClaimLocal = parseFloat(ethers.formatEther(profileState.pendingRewards));
    updateMiningDisplay();
    
  } catch (error) {
    console.error("Error reading profile stats:", error);
    // Display helpful suggestion in dev panel
    flipStatusMsg.textContent = "Contract read failed. Check if address is correct.";
  }
}

// Simulated counter to make the game feel alive and responsive
function startPassiveMiningTimer() {
  if (miningUpdateInterval) {
    clearInterval(miningUpdateInterval);
  }
  
  // Update local display counter every 100ms
  miningUpdateInterval = setInterval(() => {
    if (profileState.minerLevel > 0n) {
      // 0.01 BPLAY per second per level
      const added = 0.01 * Number(profileState.minerLevel) * 0.1;
      pendingClaimLocal += added;
      updateMiningDisplay();
    }
  }, 100);
}

function updateMiningDisplay() {
  const combined = pendingClaimLocal + (localClicks * (1 + Number(profileState.clickLevel)) * 0.05); // local clicks add pending points
  miningPendingEl.textContent = combined.toFixed(3);
  btnClaimMining.disabled = combined <= 0;
}

// Custom faucet timer
let faucetTimer = null;
function startFaucetCooldownTimer(cooldownSeconds) {
  if (faucetTimer) clearInterval(faucetTimer);
  
  let remaining = cooldownSeconds;
  faucetCooldownEl.textContent = `(Cooldown: ${formatTime(remaining)})`;
  
  faucetTimer = setInterval(() => {
    remaining--;
    if (remaining <= 0) {
      clearInterval(faucetTimer);
      btnFaucet.disabled = false;
      faucetCooldownEl.textContent = "";
    } else {
      faucetCooldownEl.textContent = `(Cooldown: ${formatTime(remaining)})`;
    }
  }, 1000);
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
  // Multiply local click power
  const mult = 1 + Number(profileState.clickLevel);
  localClicks += 1;
  localClicksEl.textContent = localClicks;
  
  // Update mining pending rewards instantly
  updateMiningDisplay();
  
  // Trigger premium micro-animation particles
  createClickParticle(e);
});

// Click Particle Burst Animation
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
  
  // Clean up element after animation
  setTimeout(() => {
    floating.remove();
  }, 800);
}

/* ==========================================================================
   On-chain Blockchain Transactions
   ========================================================================== */

// Log Transaction to UI Logs
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
  
  const explorerUrl = currentChainId === 84532n 
    ? `https://sepolia.basescan.org/tx/${txHash}` 
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
  
  // Insert at top of log table
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

// 1. Claim Faucet
btnFaucet.addEventListener('click', async () => {
  if (!contract) return;
  btnFaucet.disabled = true;
  
  const logRow = logTransaction("Claim Free Faucet Tokens", "N/A", "pending");
  
  try {
    const tx = await contract.claimFaucet();
    logRow.cells[4].innerHTML = `<a href="https://sepolia.basescan.org/tx/${tx.hash}" target="_blank" class="monospace text-glow-blue">${tx.hash.substring(0, 10)}...</a>`;
    
    const receipt = await tx.wait();
    updateTransactionLog(logRow, "success", `Gas used: ${receipt.gasUsed.toString()}`);
    await fetchPlayerProfile();
  } catch (error) {
    console.error("Faucet transaction error:", error);
    updateTransactionLog(logRow, "failed", error.reason || "Rejected");
    btnFaucet.disabled = false;
  }
});

// 2. Buy Click Upgrade
btnUpgradeClick.addEventListener('click', async () => {
  if (!contract) return;
  btnUpgradeClick.disabled = true;
  
  const logRow = logTransaction("Upgrade Super-Click Mult", "N/A", "pending");
  
  try {
    const tx = await contract.buyClickUpgrade();
    logRow.cells[4].innerHTML = `<a href="https://sepolia.basescan.org/tx/${tx.hash}" target="_blank" class="monospace text-glow-blue">${tx.hash.substring(0, 10)}...</a>`;
    
    const receipt = await tx.wait();
    updateTransactionLog(logRow, "success", `Gas used: ${receipt.gasUsed.toString()}`);
    await fetchPlayerProfile();
  } catch (error) {
    console.error("Upgrade click error:", error);
    updateTransactionLog(logRow, "failed", error.reason || "Rejected");
    btnUpgradeClick.disabled = false;
  }
});

// 3. Buy Miner Upgrade
btnUpgradeMiner.addEventListener('click', async () => {
  if (!contract) return;
  btnUpgradeMiner.disabled = true;
  
  const logRow = logTransaction("Upgrade Cyber Mining Rig", "N/A", "pending");
  
  try {
    const tx = await contract.buyMinerUpgrade();
    logRow.cells[4].innerHTML = `<a href="https://sepolia.basescan.org/tx/${tx.hash}" target="_blank" class="monospace text-glow-blue">${tx.hash.substring(0, 10)}...</a>`;
    
    const receipt = await tx.wait();
    updateTransactionLog(logRow, "success", `Gas used: ${receipt.gasUsed.toString()}`);
    await fetchPlayerProfile();
  } catch (error) {
    console.error("Upgrade miner error:", error);
    updateTransactionLog(logRow, "failed", error.reason || "Rejected");
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
    logRow.cells[4].innerHTML = `<a href="https://sepolia.basescan.org/tx/${tx.hash}" target="_blank" class="monospace text-glow-blue">${tx.hash.substring(0, 10)}...</a>`;
    
    const receipt = await tx.wait();
    updateTransactionLog(logRow, "success", `Gas used: ${receipt.gasUsed.toString()}`);
    
    // Reset local clicks on successful claim
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

// Bet max balance
btnBetMax.addEventListener('click', () => {
  if (profileState.balance > 0n) {
    const etherVal = parseFloat(ethers.formatEther(profileState.balance));
    // Keep it as integer multiples of 10
    const rounded = Math.floor(etherVal / 10) * 10;
    betAmountInput.value = Math.max(10, rounded);
  }
});

// Roll On-Chain Coin Flip
btnRoll.addEventListener('click', async () => {
  if (!contract) return;
  
  const betVal = parseFloat(betAmountInput.value);
  if (isNaN(betVal) || betVal < 10) {
    alert("Minimum bet amount is 10 BPLAY");
    return;
  }
  
  const betWei = ethers.parseEther(betVal.toString());
  if (profileState.balance < betWei) {
    alert("Insufficient BPLAY balance to cover bet.");
    return;
  }
  
  btnRoll.disabled = true;
  flipStatusMsg.className = "flip-status-message";
  flipStatusMsg.textContent = "Submitting bet to the blockchain...";
  
  // Coin flip initial spin animation
  coinVisual.classList.add('spin-animation');
  
  const isHeadsBet = (betChoice === "heads");
  const logRow = logTransaction(`Lucky Flip Bet (${betChoice.toUpperCase()})`, "N/A", "pending");
  
  try {
    const tx = await contract.coinFlip(isHeadsBet, betWei);
    logRow.cells[4].innerHTML = `<a href="https://sepolia.basescan.org/tx/${tx.hash}" target="_blank" class="monospace text-glow-blue">${tx.hash.substring(0, 10)}...</a>`;
    
    const receipt = await tx.wait();
    updateTransactionLog(logRow, "success", `Gas used: ${receipt.gasUsed.toString()}`);
    
    // Parse result from CoinFlipResult event
    let won = false;
    let payout = 0n;
    
    // Query event logs
    for (const log of receipt.logs) {
      try {
        const parsedLog = contract.interface.parseLog(log);
        if (parsedLog.name === 'CoinFlipResult') {
          won = parsedLog.args.won;
          payout = parsedLog.args.payout;
        }
      } catch (e) {
        // ignore logs from other contracts or unparseable logs
      }
    }
    
    // Determine the coin outcome
    // If player bet Heads and won, coin lands on Heads (rotate to 0 or 360 * N)
    // If player bet Tails and won, coin lands on Tails (rotate to 180 or 180 + 360 * N)
    // If player bet Heads and lost, coin lands on Tails
    // If player bet Tails and lost, coin lands on Heads
    const landedHeads = (isHeadsBet && won) || (!isHeadsBet && !won);
    
    // Set custom visual target for coin flip animation end
    const spinTarget = landedHeads ? '1800deg' : '1980deg'; // 1800 is heads, 1980 is tails
    coinVisual.style.setProperty('--coin-spin-target', spinTarget);
    
    // Wait for the visual flip animation to reach its peak before updating status (approx 3s)
    setTimeout(async () => {
      coinVisual.classList.remove('spin-animation');
      
      if (won) {
        flipStatusMsg.className = "flip-status-message won";
        flipStatusMsg.innerHTML = `<i class="fa-solid fa-trophy"></i> YOU WON! Received ${ethers.formatEther(payout)} $BPLAY!`;
      } else {
        flipStatusMsg.className = "flip-status-message lost";
        flipStatusMsg.innerHTML = `<i class="fa-solid fa-face-frown"></i> YOU LOST! Better luck next roll.`;
      }
      
      await fetchPlayerProfile();
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
   Developer & Deployment Admin Center
   ========================================================================== */

// Direct browser compiler & deployer!
btnDeployBrowser.addEventListener('click', async () => {
  if (!signer) return;
  
  btnDeployBrowser.disabled = true;
  deployLoader.classList.remove('hidden');
  deployStatusTxt.textContent = "Waiting for signature in your wallet...";
  
  const logRow = logTransaction("Deploy Contract from Browser", "N/A", "pending");
  
  try {
    const factory = new ethers.ContractFactory(CONTRACT_ABI, CONTRACT_BYTECODE, signer);
    const deployedContract = await factory.deploy();
    
    deployStatusTxt.textContent = "Deploying contract. Waiting for block confirmation...";
    
    const tx = deployedContract.deploymentTransaction();
    if (tx) {
      logRow.cells[4].innerHTML = `<a href="https://sepolia.basescan.org/tx/${tx.hash}" target="_blank" class="monospace text-glow-blue">${tx.hash.substring(0, 10)}...</a>`;
    }
    
    await deployedContract.waitForDeployment();
    const newAddress = await deployedContract.getAddress();
    
    updateTransactionLog(logRow, "success", "Contract deployed successfully");
    
    deployStatusTxt.innerHTML = `<span style="color:var(--mint)"><i class="fa-solid fa-check"></i> Deployed to ${newAddress.substring(0,6)}...</span>`;
    
    // Save to local storage and update active contract instance
    saveContractAddress(currentChainId, newAddress);
    contractAddressInput.value = newAddress;
    contract = new ethers.Contract(newAddress, CONTRACT_ABI, signer);
    
    setTimeout(() => {
      deployLoader.classList.add('hidden');
      btnDeployBrowser.disabled = false;
    }, 4000);
    
    await fetchPlayerProfile();
    
  } catch (error) {
    console.error("Browser deployment failed:", error);
    updateTransactionLog(logRow, "failed", error.reason || "Deploy Failed");
    deployStatusTxt.innerHTML = `<span style="color:var(--coral)"><i class="fa-solid fa-xmark"></i> Deployment failed</span>`;
    
    setTimeout(() => {
      deployLoader.classList.add('hidden');
      btnDeployBrowser.disabled = false;
    }, 4000);
  }
});

// Update Contract Address manually
btnSaveContract.addEventListener('click', async () => {
  const newAddr = contractAddressInput.value.trim();
  if (ethers.isAddress(newAddr)) {
    saveContractAddress(currentChainId, newAddr);
    contract = new ethers.Contract(newAddr, CONTRACT_ABI, signer);
    alert(`Contract address updated to: ${newAddr}`);
    await fetchPlayerProfile();
  } else {
    alert("Please enter a valid Ethereum contract address.");
  }
});


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
    this.speedY = Math.random() * -0.2 - 0.05; // float upwards
    this.color = Math.random() > 0.5 ? 'rgba(6, 182, 212, ' : 'rgba(139, 92, 246, ';
    this.alpha = Math.random() * 0.5 + 0.2;
  }
  
  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    
    // Reset if offscreen
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
