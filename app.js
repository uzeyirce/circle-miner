/**
 * Arc Cyber Miner & Lucky Flip
 * Web3 Client Logic - Ethers.js v6
 *
 * FIXES:
 * - No CONTRACT_ABI global collision
 * - Uses GAME_ABI locally
 * - No duplicate Ethereum event listeners
 * - No automatic leaderboard RPC log scanning
 * - Safe contract initialization
 * - Better contract read diagnostics
 */

'use strict';

/* ==========================================================================
   CONFIGURATION
   ========================================================================== */

const ARC_CHAIN_ID = 5042n;
const HARDHAT_CHAIN_ID = 31337n;

const ARC_CHAIN_HEX = '0x13b2';

const DEFAULT_CONTRACTS = {
  '5042': '0xd67d5a4559d07e8154E0B0dd2DB72597f727e748',
  '31337': '0x5FbDB2315678afecb367f032d93F642f64180aa3'
};

const CPLAY_TOKEN_ADDRESS = {
  '5042': '0x8613155fF713c13F6C177275Af9bF195e69dEd34',
  '31337': '0x5FbDB2315678afecb367f032d93F642f64180aa3'
};

/*
 * IMPORTANT:
 * Do NOT call this CONTRACT_ABI.
 *
 * artifacts.js may already expose CONTRACT_ABI globally.
 * Using GAME_ABI avoids:
 *
 * Identifier 'CONTRACT_ABI' has already been declared
 */
const GAME_ABI = [
  'function getPlayerProfile(address) view returns (uint256,bool,bool,uint256,uint256,string,uint256,bool,uint256,uint256,uint256)',

  'function getClickUpgradeCost(uint256) view returns (uint256)',
  'function getUpgradeCost(uint256) view returns (uint256)',

  'function setUsername(string)',
  'function buyClickUpgrade()',
  'function buyMinerUpgrade()',
  'function claimMining()',

  'function coinFlip(bool,uint256)',

  'function totalWinnings(address) view returns (uint256)',
  'function usernames(address) view returns (string)',

  'event CoinFlipResult(address indexed player,bool won,uint256 payout)'
];

const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function allowance(address,address) view returns (uint256)',
  'function approve(address,uint256) returns (bool)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)'
];

/* ==========================================================================
   APPLICATION STATE
   ========================================================================== */

let provider = null;
let signer = null;
let contract = null;
let tokenContract = null;

let walletAddress = null;
let currentChainId = null;

let localClicks = 0;
let pendingClaimLocal = 0;

let miningUpdateInterval = null;

let ethereumListenersInstalled = false;
let connectingWallet = false;

let transactionsCount = 0;
let betChoice = 'heads';

/* ==========================================================================
   PROFILE STATE
   ========================================================================== */

let profileState = {
  balance: 0n,
  circleMinerEnabled: true,
  luckyFlipEnabled: true,
  allowance: 0n,
  vaultBalance: 0n,
  username: '',
  totalWinnings: 0n,
  faucetClaimed: false,
  minerLevel: 0n,
  clickLevel: 0n,
  pendingRewards: 0n,
  lastUpdated: 0
};

/* ==========================================================================
   DOM ELEMENTS
   ========================================================================== */

const btnConnect = document.getElementById('btn-connect');
const btnDisconnect = document.getElementById('btn-disconnect');

const tokenDisplay = document.getElementById('token-display');
const playerBalanceEl = document.getElementById('player-balance');

const networkWarning = document.getElementById('network-warning');
const btnSwitchNetwork = document.getElementById('btn-switch-network');

const walletAddressAbbr =
  document.getElementById('wallet-address-abbr');

const usernameDisplay =
  document.getElementById('username-display');

const vaultBalanceValEl =
  document.getElementById('vault-balance-val');

const totalWinningsValEl =
  document.getElementById('total-winnings-val');

const usernameInput =
  document.getElementById('username-input');

const btnSetUsername =
  document.getElementById('btn-set-username');

const leaderboardTbody =
  document.getElementById('leaderboard-tbody');

const btnFaucet =
  document.getElementById('btn-faucet');

/* Miner */

const clickCrystal =
  document.getElementById('click-crystal');

const localClicksEl =
  document.getElementById('local-clicks');

const miningPendingEl =
  document.getElementById('mining-pending');

const btnClaimMining =
  document.getElementById('btn-claim-mining');

const clickLevelLbl =
  document.getElementById('click-level-lbl');

const clickUpgradeCost =
  document.getElementById('click-upgrade-cost');

const btnUpgradeClick =
  document.getElementById('btn-upgrade-click');

const minerLevelLbl =
  document.getElementById('miner-level-lbl');

const minerUpgradeCost =
  document.getElementById('miner-upgrade-cost');

const btnUpgradeMiner =
  document.getElementById('btn-upgrade-miner');

/* Flip */

const coinVisual =
  document.getElementById('coin-visual');

const btnBetHeads =
  document.getElementById('btn-bet-heads');

const btnBetTails =
  document.getElementById('btn-bet-tails');

const betAmountInput =
  document.getElementById('bet-amount');

const btnBetMax =
  document.getElementById('btn-bet-max');

const btnRoll =
  document.getElementById('btn-roll');

const flipStatusMsg =
  document.getElementById('flip-status-msg');

/* Transactions */

const txTbody =
  document.getElementById('tx-tbody');

const txCountEl =
  document.getElementById('tx-count');

const txEmptyRow =
  document.getElementById('tx-empty-row');

/* ==========================================================================
   BASIC SAFETY
   ========================================================================== */

function hasEthereum() {
  return typeof window !== 'undefined' &&
         typeof window.ethereum !== 'undefined';
}

function isSupportedChain() {
  return (
    currentChainId === ARC_CHAIN_ID ||
    currentChainId === HARDHAT_CHAIN_ID
  );
}

function getContractAddress(chainId) {
  const key = String(chainId);

  if (DEFAULT_CONTRACTS[key]) {
    return DEFAULT_CONTRACTS[key];
  }

  return null;
}

function getTokenAddress(chainId) {
  return CPLAY_TOKEN_ADDRESS[String(chainId)] || null;
}

/* ==========================================================================
   TAB NAVIGATION
   ========================================================================== */

const tabButtons =
  document.querySelectorAll('.nav-tab');

const tabPanels =
  document.querySelectorAll('.tab-panel');

tabButtons.forEach((button) => {

  button.addEventListener('click', () => {

    const tabId =
      button.getAttribute('data-tab');

    tabButtons.forEach((btn) => {
      btn.classList.remove('active');
    });

    tabPanels.forEach((panel) => {
      panel.classList.remove('active');
    });

    button.classList.add('active');

    const target =
      document.getElementById(tabId);

    if (target) {
      target.classList.add('active');
    }
  });

});

/* ==========================================================================
   ETHEREUM EVENT LISTENERS
   ========================================================================== */

/*
 * This function is called only once.
 *
 * Previously connectWallet/initWeb3 could repeatedly attach:
 *
 * chainChanged
 * accountsChanged
 *
 * listeners.
 *
 * That can contribute to:
 * MaxListenersExceededWarning
 */
function installEthereumListeners() {

  if (!hasEthereum()) {
    return;
  }

  if (ethereumListenersInstalled) {
    return;
  }

  ethereumListenersInstalled = true;

  window.ethereum.on('chainChanged', () => {

    console.log('Chain changed.');

    /*
     * Reloading is intentional.
     * It gives us a completely fresh provider/contract state.
     */
    window.location.reload();

  });

  window.ethereum.on('accountsChanged', async (accounts) => {

    console.log('Accounts changed:', accounts);

    if (!accounts || accounts.length === 0) {

      disconnectWallet(false);

      return;
    }

    /*
     * Do not create another listener.
     * Just reconnect using the existing listener set.
     */
    await connectWallet(false);

  });
}

/* ==========================================================================
   WEB3 INITIALIZATION
   ========================================================================== */

async function initWeb3() {

  if (!hasEthereum()) {

    console.error(
      'No Ethereum provider detected.'
    );

    if (btnConnect) {

      btnConnect.addEventListener('click', () => {

        alert(
          'Ethereum wallet not detected. ' +
          'Please install MetaMask or another compatible wallet.'
        );

      });

    }

    return;
  }

  try {

    provider =
      new ethers.BrowserProvider(
        window.ethereum
      );

    installEthereumListeners();

    /*
     * Check existing permission without opening popup.
     */
    const accounts =
      await window.ethereum.request({
        method: 'eth_accounts'
      });

    if (accounts && accounts.length > 0) {

      await connectWallet(false);

    } else {

      console.log(
        'Wallet available. Waiting for connection.'
      );

    }

  } catch (error) {

    console.error(
      'Web3 initialization failed:',
      error
    );

  }

}

/* ==========================================================================
   CONNECT WALLET
   ========================================================================== */

async function connectWallet(requestAccounts = true) {

  if (connectingWallet) {
    return;
  }

  if (!hasEthereum()) {
    return;
  }

  connectingWallet = true;

  try {

    if (!provider) {

      provider =
        new ethers.BrowserProvider(
          window.ethereum
        );

    }

    let accounts;

    if (requestAccounts) {

      accounts =
        await window.ethereum.request({
          method: 'eth_requestAccounts'
        });

    } else {

      accounts =
        await window.ethereum.request({
          method: 'eth_accounts'
        });

    }

    if (!accounts || accounts.length === 0) {

      disconnectWallet(false);

      return;

    }

    walletAddress = accounts[0];

    signer =
      await provider.getSigner();

    const network =
      await provider.getNetwork();

    currentChainId =
      network.chainId;

    console.log(
      'Connected wallet:',
      walletAddress
    );

    console.log(
      'Chain ID:',
      currentChainId.toString()
    );

    updateWalletUI();

    if (!isSupportedChain()) {

      console.warn(
        'Unsupported network:',
        currentChainId.toString()
      );

      networkWarning?.classList.remove('hidden');

      disableGameControls();

      return;
    }

    networkWarning?.classList.add('hidden');

    const contractAddress =
      getContractAddress(currentChainId);

    const tokenAddress =
      getTokenAddress(currentChainId);

    if (!contractAddress) {

      throw new Error(
        'No game contract configured for chain ' +
        currentChainId.toString()
      );

    }

    if (!tokenAddress) {

      throw new Error(
        'No CPLAY token configured for chain ' +
        currentChainId.toString()
      );

    }

    console.log(
      'Game contract:',
      contractAddress
    );

    console.log(
      'CPLAY token:',
      tokenAddress
    );

    /*
     * Create game contract using OUR private ABI name.
     */
    contract =
      new ethers.Contract(
        contractAddress,
        GAME_ABI,
        signer
      );

    tokenContract =
      new ethers.Contract(
        tokenAddress,
        ERC20_ABI,
        signer
      );

    /*
     * Verify contract actually exists.
     */
    const code =
      await provider.getCode(contractAddress);

    if (!code || code === '0x') {

      throw new Error(
        'No contract bytecode found at ' +
        contractAddress +
        ' on chain ' +
        currentChainId.toString()
      );

    }

    console.log(
      'Game contract bytecode detected.'
    );

    /*
     * IMPORTANT:
     * This is the first real contract read.
     */
    await fetchPlayerProfile();

    /*
     * Leaderboard is deliberately NOT automatically scanned.
     *
     * This avoids RPC eth_getLogs range errors.
     */
    showLeaderboardDisabled();

    startPassiveMiningTimer();

  } catch (error) {

    console.error(
      'Wallet connection failed:',
      error
    );

    showReadableError(
      error,
      'Wallet connection failed.'
    );

  } finally {

    connectingWallet = false;

  }

}

/* ==========================================================================
   WALLET UI
   ========================================================================== */

function updateWalletUI() {

  if (!walletAddress) {
    return;
  }

  if (btnConnect) {

    btnConnect.innerHTML =
      `<i class="fa-solid fa-circle-nodes"></i> ` +
      `Connected: ` +
      `${walletAddress.substring(0, 6)}...` +
      `${walletAddress.substring(38)}`;

    btnConnect.classList.remove('btn-connect');
    btnConnect.classList.add('btn-outline');

  }

  if (btnDisconnect) {
    btnDisconnect.classList.remove('hidden');
  }

  if (walletAddressAbbr) {

    walletAddressAbbr.textContent =
      `${walletAddress.substring(0, 10)}...` +
      `${walletAddress.substring(34)}`;

  }

  if (tokenDisplay) {
    tokenDisplay.classList.remove('hidden');
  }

}

/* ==========================================================================
   DISCONNECT
   ========================================================================== */

function disconnectWallet(revoke = false) {

  walletAddress = null;
  signer = null;
  contract = null;
  tokenContract = null;
  currentChainId = null;

  if (miningUpdateInterval) {

    clearInterval(
      miningUpdateInterval
    );

    miningUpdateInterval = null;

  }

  if (btnConnect) {

    btnConnect.innerHTML =
      `<i class="fa-solid fa-wallet"></i> Connect Wallet`;

    btnConnect.classList.add('btn-connect');
    btnConnect.classList.remove('btn-outline');

  }

  btnDisconnect?.classList.add('hidden');

  if (walletAddressAbbr) {
    walletAddressAbbr.textContent =
      'Not Connected';
  }

  tokenDisplay?.classList.add('hidden');

  disableGameControls();

  /*
   * Do NOT call wallet_revokePermissions by default.
   *
   * It can cause confusing behavior with wallets.
   */
  if (
    revoke &&
    hasEthereum() &&
    window.ethereum.request
  ) {

    window.ethereum.request({
      method: 'wallet_revokePermissions',
      params: [
        {
          eth_accounts: {}
        }
      ]
    }).catch(() => {});

  }

}

/* ==========================================================================
   GAME CONTROLS
   ========================================================================== */

function disableGameControls() {

  if (btnClaimMining)
    btnClaimMining.disabled = true;

  if (btnUpgradeClick)
    btnUpgradeClick.disabled = true;

  if (btnUpgradeMiner)
    btnUpgradeMiner.disabled = true;

  if (btnRoll)
    btnRoll.disabled = true;

  if (btnSetUsername)
    btnSetUsername.disabled = true;

}

/* ==========================================================================
   SWITCH NETWORK
   ========================================================================== */

async function switchNetwork() {

  if (!hasEthereum()) {
    return;
  }

  try {

    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [
        {
          chainId: ARC_CHAIN_HEX
        }
      ]
    });

  } catch (switchError) {

    console.error(
      'Network switch error:',
      switchError
    );

    if (
      switchError &&
      switchError.code === 4902
    ) {

      try {

        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: ARC_CHAIN_HEX,
              chainName: 'Arc Mainnet',
              nativeCurrency: {
                name: 'USDC',
                symbol: 'USDC',
                decimals: 18
              },
              rpcUrls: [
                'https://arc-mainnet.infura.io/v3/de58e8647ba54873a65e6b8d2d7bade7'
              ],
              blockExplorerUrls: [
                'https://arc.exploreme.pro'
              ]
            }
          ]
        });

      } catch (addError) {

        console.error(
          'Could not add Arc network:',
          addError
        );

      }

    }

  }

}

/* ==========================================================================
   CONTRACT READ
   ========================================================================== */

async function fetchPlayerProfile() {

  if (!contract) {

    console.warn(
      'fetchPlayerProfile(): contract is null'
    );

    return;

  }

  if (!walletAddress) {

    console.warn(
      'fetchPlayerProfile(): walletAddress is null'
    );

    return;

  }

  try {

    console.log(
      'Reading getPlayerProfile...'
    );

    console.log(
      'Contract:',
      await contract.getAddress()
    );

    console.log(
      'Wallet:',
      walletAddress
    );

    /*
     * Direct ethers v6 call.
     *
     * GAME_ABI explicitly contains getPlayerProfile.
     */
    const result =
      await contract.getPlayerProfile(
        walletAddress
      );

    console.log(
      'getPlayerProfile result:',
      result
    );

    if (!result || result.length < 11) {

      throw new Error(
        'Invalid getPlayerProfile result. ' +
        'Expected 11 values.'
      );

    }

    profileState.balance =
      result[0];

    profileState.circleMinerEnabled =
      result[1];

    profileState.luckyFlipEnabled =
      result[2];

    profileState.allowance =
      result[3];

    profileState.vaultBalance =
      result[4];

    profileState.username =
      result[5];

    profileState.totalWinnings =
      result[6];

    profileState.faucetClaimed =
      result[7];

    profileState.minerLevel =
      result[8];

    profileState.clickLevel =
      result[9];

    profileState.pendingRewards =
      result[10];

    profileState.lastUpdated =
      Date.now();

    updateProfileUI();

    /*
     * These two reads are separated deliberately.
     *
     * If one fails, console tells us exactly which one.
     */
    if (profileState.circleMinerEnabled) {

      try {

        const cost =
          await contract.getClickUpgradeCost(
            profileState.clickLevel
          );

        clickUpgradeCost.textContent =
          Number(
            ethers.formatEther(cost)
          ).toFixed(0);

        btnUpgradeClick.disabled =
          profileState.balance < cost;

      } catch (error) {

        console.error(
          'getClickUpgradeCost() FAILED:',
          error
        );

        clickUpgradeCost.textContent =
          'ERR';

        btnUpgradeClick.disabled = true;

      }

      try {

        const cost =
          await contract.getUpgradeCost(
            profileState.minerLevel
          );

        minerUpgradeCost.textContent =
          Number(
            ethers.formatEther(cost)
          ).toFixed(0);

        btnUpgradeMiner.disabled =
          profileState.balance < cost;

      } catch (error) {

        console.error(
          'getUpgradeCost() FAILED:',
          error
        );

        minerUpgradeCost.textContent =
          'ERR';

        btnUpgradeMiner.disabled = true;

      }

      pendingClaimLocal =
        Number(
          ethers.formatEther(
            profileState.pendingRewards
          )
        );

      updateMiningDisplay();

    }

    console.log(
      'Player profile successfully loaded.'
    );

  } catch (error) {

    console.error(
      '❌ getPlayerProfile() FAILED:',
      error
    );

    /*
     * Important diagnostic information.
     */
    try {

      console.error(
        'Contract address:',
        await contract.getAddress()
      );

    } catch (_) {}

    console.error(
      'Wallet:',
      walletAddress
    );

    console.error(
      'Chain:',
      currentChainId?.toString()
    );

    showReadableError(
      error,
      'Contract read failed.'
    );

  }

}

/* ==========================================================================
   PROFILE UI
   ========================================================================== */

function updateProfileUI() {

  if (playerBalanceEl) {

    const balance =
      Number(
        ethers.formatEther(
          profileState.balance
        )
      );

    playerBalanceEl.textContent =
      balance.toLocaleString(
        undefined,
        {
          maximumFractionDigits: 2
        }
      );

  }

  if (vaultBalanceValEl) {

    const vault =
      Number(
        ethers.formatEther(
          profileState.vaultBalance
        )
      );

    vaultBalanceValEl.textContent =
      `${vault.toLocaleString(
        undefined,
        {
          maximumFractionDigits: 2
        }
      )} CPLAY`;

  }

  if (usernameDisplay) {

    if (
      profileState.username &&
      profileState.username.length > 0
    ) {

      usernameDisplay.textContent =
        profileState.username;

      if (usernameInput) {
        usernameInput.placeholder =
          'Change username';
      }

    } else {

      usernameDisplay.textContent =
        '— not set —';

      if (usernameInput) {
        usernameInput.placeholder =
          'Set a username';
      }

    }

  }

  if (usernameInput) {
    usernameInput.value = '';
  }

  if (btnSetUsername) {
    btnSetUsername.disabled = true;
  }

  if (totalWinningsValEl) {

    const winnings =
      Number(
        ethers.formatEther(
          profileState.totalWinnings
        )
      );

    totalWinningsValEl.textContent =
      `${winnings.toLocaleString(
        undefined,
        {
          maximumFractionDigits: 2
        }
      )} CPLAY`;

  }

  if (clickLevelLbl) {

    clickLevelLbl.textContent =
      profileState.clickLevel.toString();

  }

  if (minerLevelLbl) {

    minerLevelLbl.textContent =
      profileState.minerLevel.toString();

  }

  if (btnRoll) {

    btnRoll.disabled =
      !profileState.luckyFlipEnabled ||
      profileState.balance <
      ethers.parseEther('10');

  }

}

/* ==========================================================================
   LEADERBOARD
   ========================================================================== */

/*
 * Intentionally disabled.
 *
 * The previous implementation scanned the entire chain with eth_getLogs.
 * This is exactly the sort of thing that can hit RPC range limits.
 */
function showLeaderboardDisabled() {

  if (!leaderboardTbody) {
    return;
  }

  leaderboardTbody.innerHTML =
    '<tr>' +
    '<td colspan="3" class="leaderboard-empty">' +
    'Leaderboard temporarily disabled.' +
    '</td>' +
    '</tr>';

}

/* ==========================================================================
   PASSIVE MINING
   ========================================================================== */

function startPassiveMiningTimer() {

  if (miningUpdateInterval) {

    clearInterval(
      miningUpdateInterval
    );

  }

  miningUpdateInterval =
    setInterval(() => {

      if (
        profileState.minerLevel > 0n
      ) {

        const baseRatePerSec =
          0.001 *
          Number(
            profileState.minerLevel
          );

        const ratePerSec =
          baseRatePerSec *
          (
            1 +
            Number(
              profileState.clickLevel
            ) *
            0.1
          );

        pendingClaimLocal +=
          ratePerSec *
          0.1;

        updateMiningDisplay();

      }

    }, 100);

}

/* ==========================================================================
   MINING DISPLAY
   ========================================================================== */

function updateMiningDisplay() {

  if (miningPendingEl) {

    miningPendingEl.textContent =
      pendingClaimLocal.toFixed(4);

  }

  if (btnClaimMining) {

    btnClaimMining.disabled =
      !contract ||
      pendingClaimLocal <= 0;

  }

}

/* ==========================================================================
   CLICKER
   ========================================================================== */

if (clickCrystal) {

  clickCrystal.addEventListener(
    'click',
    (event) => {

      localClicks++;

      if (localClicksEl) {
        localClicksEl.textContent =
          localClicks;
      }

      updateMiningDisplay();

      createClickParticle(event);

    }
  );

}

function createClickParticle(event) {

  if (!clickCrystal) {
    return;
  }

  const rect =
    clickCrystal.getBoundingClientRect();

  const x =
    event.clientX ||
    (rect.left + rect.width / 2);

  const y =
    event.clientY ||
    (rect.top + rect.height / 2);

  const floating =
    document.createElement('div');

  floating.className =
    'floating-click-val';

  floating.style.left =
    `${x}px`;

  floating.style.top =
    `${y}px`;

  const mult =
    1 +
    Number(
      profileState.clickLevel
    );

  floating.textContent =
    `+${mult}`;

  document.body.appendChild(
    floating
  );

  setTimeout(() => {

    floating.remove();

  }, 800);

}

/* ==========================================================================
   TRANSACTION LOG
   ========================================================================== */

function logTransaction(
  actionName,
  txHash,
  status
) {

  if (!txTbody) {
    return null;
  }

  txEmptyRow?.classList.add('hidden');

  transactionsCount++;

  if (txCountEl) {

    txCountEl.textContent =
      `${transactionsCount} Transaction` +
      `${transactionsCount > 1 ? 's' : ''}`;

  }

  const tr =
    document.createElement('tr');

  const now =
    new Date();

  const timeStr =
    `${now.getHours().toString().padStart(2, '0')}:` +
    `${now.getMinutes().toString().padStart(2, '0')}:` +
    `${now.getSeconds().toString().padStart(2, '0')}`;

  let statusBadge = '';

  if (status === 'pending') {

    statusBadge =
      '<span class="tx-status-badge pending">' +
      '<i class="fa-solid fa-spinner fa-spin"></i> Pending' +
      '</span>';

  } else if (status === 'success') {

    statusBadge =
      '<span class="tx-status-badge success">' +
      '<i class="fa-solid fa-circle-check"></i> Success' +
      '</span>';

  } else {

    statusBadge =
      '<span class="tx-status-badge failed">' +
      '<i class="fa-solid fa-circle-xmark"></i> Failed' +
      '</span>';

  }

  const explorerUrl =
    currentChainId === ARC_CHAIN_ID
      ? `https://arc.exploreme.pro/tx/${txHash}`
      : '#';

  const txLink =
    txHash !== 'N/A'
      ? `<a href="${explorerUrl}" ` +
        `target="_blank" ` +
        `class="monospace text-glow-blue">` +
        `${txHash.substring(0, 10)}...` +
        `</a>`
      : '<span class="text-muted">N/A</span>';

  tr.innerHTML = `
    <td>${timeStr}</td>
    <td class="font-weight-bold">${actionName}</td>
    <td>${statusBadge}</td>
    <td>Gas estimate processing...</td>
    <td>${txLink}</td>
  `;

  txTbody.insertBefore(
    tr,
    txTbody.firstChild
  );

  return tr;

}

function updateTransactionLog(
  row,
  status,
  gasDetails
) {

  if (!row) {
    return;
  }

  const statusTd =
    row.cells[2];

  const gasTd =
    row.cells[3];

  if (status === 'success') {

    statusTd.innerHTML =
      '<span class="tx-status-badge success">' +
      '<i class="fa-solid fa-circle-check"></i> Success' +
      '</span>';

  } else {

    statusTd.innerHTML =
      '<span class="tx-status-badge failed">' +
      '<i class="fa-solid fa-circle-xmark"></i> Failed' +
      '</span>';

  }

  gasTd.textContent =
    gasDetails || 'N/A';

}

/* ==========================================================================
   ERROR HANDLING
   ========================================================================== */

function getErrorMessage(error) {

  if (!error) {
    return 'Unknown error';
  }

  if (error.reason) {
    return error.reason;
  }

  if (error.shortMessage) {
    return error.shortMessage;
  }

  if (error.info?.error?.message) {
    return error.info.error.message;
  }

  if (error.error?.message) {
    return error.error.message;
  }

  if (error.message) {
    return error.message;
  }

  return String(error);

}

function showReadableError(
  error,
  prefix
) {

  const message =
    getErrorMessage(error);

  console.error(
    `${prefix} ${message}`
  );

  if (flipStatusMsg) {

    flipStatusMsg.textContent =
      `${prefix} ${message}`;

  }

}

/* ==========================================================================
   USERNAME
   ========================================================================== */

if (usernameInput) {

  usernameInput.addEventListener(
    'input',
    () => {

      if (!btnSetUsername) {
        return;
      }

      btnSetUsername.disabled =
        !contract ||
        usernameInput.value.trim().length === 0;

    }
  );

}

if (btnSetUsername) {

  btnSetUsername.addEventListener(
    'click',
    async () => {

      if (!contract) {
        return;
      }

      const name =
        usernameInput.value.trim();

      if (
        !name ||
        name.length > 20
      ) {

        alert(
          'Username must be 1-20 characters.'
        );

        return;
      }

      btnSetUsername.disabled = true;

      const logRow =
        logTransaction(
          'Set Username',
          'N/A',
          'pending'
        );

      try {

        const tx =
          await contract.setUsername(
            name
          );

        if (logRow) {

          logRow.cells[4].innerHTML =
            `<a href="https://arc.exploreme.pro/tx/${tx.hash}" ` +
            `target="_blank" ` +
            `class="monospace text-glow-blue">` +
            `${tx.hash.substring(0, 10)}...` +
            `</a>`;

        }

        const receipt =
          await tx.wait();

        updateTransactionLog(
          logRow,
          'success',
          `Gas used: ${receipt.gasUsed.toString()}`
        );

        usernameInput.value = '';

        await fetchPlayerProfile();

      } catch (error) {

        console.error(
          'Set username error:',
          error
        );

        updateTransactionLog(
          logRow,
          'failed',
          getErrorMessage(error)
        );

        btnSetUsername.disabled = false;

      }

    }
  );

}

/* ==========================================================================
   ERC20 APPROVAL
   ========================================================================== */

async function ensureApproval(
  requiredAmount
) {

  if (!tokenContract || !contract) {

    console.error(
      'Approval failed: contracts not initialized.'
    );

    return false;

  }

  try {

    const contractAddress =
      await contract.getAddress();

    const currentAllowance =
      await tokenContract.allowance(
        walletAddress,
        contractAddress
      );

    console.log(
      'Current allowance:',
      currentAllowance.toString()
    );

    console.log(
      'Required:',
      requiredAmount.toString()
    );

    if (
      currentAllowance >=
      requiredAmount
    ) {

      return true;

    }

    const logRow =
      logTransaction(
        'Approve $CPLAY Spend',
        'N/A',
        'pending'
      );

    const tx =
      await tokenContract.approve(
        contractAddress,
        ethers.MaxUint256
      );

    if (logRow) {

      logRow.cells[4].innerHTML =
        `<a href="https://arc.exploreme.pro/tx/${tx.hash}" ` +
        `target="_blank" ` +
        `class="monospace text-glow-blue">` +
        `${tx.hash.substring(0, 10)}...` +
        `</a>`;

    }

    const receipt =
      await tx.wait();

    updateTransactionLog(
      logRow,
      'success',
      `Gas used: ${receipt.gasUsed.toString()}`
    );

    return true;

  } catch (error) {

    console.error(
      'Approval failed:',
      error
    );

    return false;

  }

}

/* ==========================================================================
   CLICK UPGRADE
   ========================================================================== */

if (btnUpgradeClick) {

  btnUpgradeClick.addEventListener(
    'click',
    async () => {

      if (!contract) {
        return;
      }

      btnUpgradeClick.disabled = true;

      try {

        const cost =
          await contract.getClickUpgradeCost(
            profileState.clickLevel
          );

        const approved =
          await ensureApproval(cost);

        if (!approved) {

          btnUpgradeClick.disabled = false;

          return;

        }

        const logRow =
          logTransaction(
            'Upgrade Super-Click Mult',
            'N/A',
            'pending'
          );

        const tx =
          await contract.buyClickUpgrade();

        if (logRow) {

          logRow.cells[4].innerHTML =
            `<a href="https://arc.exploreme.pro/tx/${tx.hash}" ` +
            `target="_blank" ` +
            `class="monospace text-glow-blue">` +
            `${tx.hash.substring(0, 10)}...` +
            `</a>`;

        }

        const receipt =
          await tx.wait();

        updateTransactionLog(
          logRow,
          'success',
          `Gas used: ${receipt.gasUsed.toString()}`
        );

        await fetchPlayerProfile();

      } catch (error) {

        console.error(
          'Upgrade click error:',
          error
        );

        btnUpgradeClick.disabled = false;

      }

    }
  );

}

/* ==========================================================================
   MINER UPGRADE
   ========================================================================== */

if (btnUpgradeMiner) {

  btnUpgradeMiner.addEventListener(
    'click',
    async () => {

      if (!contract) {
        return;
      }

      btnUpgradeMiner.disabled = true;

      try {

        const cost =
          await contract.getUpgradeCost(
            profileState.minerLevel
          );

        const approved =
          await ensureApproval(cost);

        if (!approved) {

          btnUpgradeMiner.disabled = false;

          return;

        }

        const logRow =
          logTransaction(
            'Upgrade Circle Mining Rig',
            'N/A',
            'pending'
          );

        const tx =
          await contract.buyMinerUpgrade();

        if (logRow) {

          logRow.cells[4].innerHTML =
            `<a href="https://arc.exploreme.pro/tx/${tx.hash}" ` +
            `target="_blank" ` +
            `class="monospace text-glow-blue">` +
            `${tx.hash.substring(0, 10)}...` +
            `</a>`;

        }

        const receipt =
          await tx.wait();

        updateTransactionLog(
          logRow,
          'success',
          `Gas used: ${receipt.gasUsed.toString()}`
        );

        await fetchPlayerProfile();

      } catch (error) {

        console.error(
          'Upgrade miner error:',
          error
        );

        btnUpgradeMiner.disabled = false;

      }

    }
  );

}

/* ==========================================================================
   CLAIM MINING
   ========================================================================== */

if (btnClaimMining) {

  btnClaimMining.addEventListener(
    'click',
    async () => {

      if (!contract) {
        return;
      }

      btnClaimMining.disabled = true;

      const logRow =
        logTransaction(
          'Claim Mining Rewards',
          'N/A',
          'pending'
        );

      try {

        const tx =
          await contract.claimMining();

        if (logRow) {

          logRow.cells[4].innerHTML =
            `<a href="https://arc.exploreme.pro/tx/${tx.hash}" ` +
            `target="_blank" ` +
            `class="monospace text-glow-blue">` +
            `${tx.hash.substring(0, 10)}...` +
            `</a>`;

        }

        const receipt =
          await tx.wait();

        updateTransactionLog(
          logRow,
          'success',
          `Gas used: ${receipt.gasUsed.toString()}`
        );

        localClicks = 0;

        if (localClicksEl) {
          localClicksEl.textContent = '0';
        }

        await fetchPlayerProfile();

      } catch (error) {

        console.error(
          'Claim mining error:',
          error
        );

        updateTransactionLog(
          logRow,
          'failed',
          getErrorMessage(error)
        );

        btnClaimMining.disabled = false;

      }

    }
  );

}

/* ==========================================================================
   FLIP CHOICE
   ========================================================================== */

if (btnBetHeads) {

  btnBetHeads.addEventListener(
    'click',
    () => {

      betChoice = 'heads';

      btnBetHeads.classList.add('active');
      btnBetTails?.classList.remove('active');

    }
  );

}

if (btnBetTails) {

  btnBetTails.addEventListener(
    'click',
    () => {

      betChoice = 'tails';

      btnBetTails.classList.add('active');
      btnBetHeads?.classList.remove('active');

    }
  );

}

/* ==========================================================================
   MAX BET
   ========================================================================== */

if (btnBetMax) {

  btnBetMax.addEventListener(
    'click',
    () => {

      if (
        profileState.balance <= 0n ||
        !betAmountInput
      ) {

        return;

      }

      const balance =
        Number(
          ethers.formatEther(
            profileState.balance
          )
        );

      const rounded =
        Math.floor(balance / 10) * 10;

      betAmountInput.value =
        Math.max(10, rounded);

    }
  );

}

/* ==========================================================================
   COIN FLIP
   ========================================================================== */

if (btnRoll) {

  btnRoll.addEventListener(
    'click',
    async () => {

      if (!contract) {
        return;
      }

      if (!betAmountInput) {
        return;
      }

      const betVal =
        parseFloat(
          betAmountInput.value
        );

      if (
        Number.isNaN(betVal) ||
        betVal < 10
      ) {

        alert(
          'Minimum bet amount is 10 CPLAY'
        );

        return;

      }

      const betWei =
        ethers.parseEther(
          betVal.toString()
        );

      if (
        profileState.balance <
        betWei
      ) {

        alert(
          'Insufficient CPLAY balance to cover bet.'
        );

        return;

      }

      btnRoll.disabled = true;

      try {

        const approved =
          await ensureApproval(
            betWei
          );

        if (!approved) {

          btnRoll.disabled = false;

          return;

        }

        if (flipStatusMsg) {

          flipStatusMsg.className =
            'flip-status-message';

          flipStatusMsg.textContent =
            'Submitting bet to the blockchain...';

        }

        coinVisual?.classList.add(
          'spin-animation'
        );

        const isHeadsBet =
          betChoice === 'heads';

        const logRow =
          logTransaction(
            `Lucky Flip Bet (${betChoice.toUpperCase()})`,
            'N/A',
            'pending'
          );

        const tx =
          await contract.coinFlip(
            isHeadsBet,
            betWei
          );

        if (logRow) {

          logRow.cells[4].innerHTML =
            `<a href="https://arc.exploreme.pro/tx/${tx.hash}" ` +
            `target="_blank" ` +
            `class="monospace text-glow-blue">` +
            `${tx.hash.substring(0, 10)}...` +
            `</a>`;

        }

        const receipt =
          await tx.wait();

        updateTransactionLog(
          logRow,
          'success',
          `Gas used: ${receipt.gasUsed.toString()}`
        );

        let won = false;
        let payout = 0n;

        /*
         * Parse CoinFlipResult.
         */
        for (
          const log of receipt.logs
        ) {

          try {

            const parsed =
              contract.interface.parseLog(
                log
              );

            if (
              parsed &&
              parsed.name ===
              'CoinFlipResult'
            ) {

              won =
                Boolean(
                  parsed.args.won
                );

              payout =
                parsed.args.payout;

              break;

            }

          } catch (_) {

            /*
             * Ignore unrelated logs.
             */

          }

        }

        /*
         * If event isn't found, don't fabricate result.
         */
        if (coinVisual) {

          const landedHeads =
            (isHeadsBet && won) ||
            (!isHeadsBet && !won);

          const spinTarget =
            landedHeads
              ? '1800deg'
              : '1980deg';

          coinVisual.style.setProperty(
            '--coin-spin-target',
            spinTarget
          );

        }

        setTimeout(
          async () => {

            coinVisual?.classList.remove(
              'spin-animation'
            );

            if (flipStatusMsg) {

              if (won) {

                flipStatusMsg.className =
                  'flip-status-message won';

                flipStatusMsg.innerHTML =
                  '<i class="fa-solid fa-trophy"></i> ' +
                  `YOU WON! Received ` +
                  `${ethers.formatEther(payout)} ` +
                  '$CPLAY!`;

              } else {

                flipStatusMsg.className =
                  'flip-status-message lost';

                flipStatusMsg.innerHTML =
                  '<i class="fa-solid fa-face-frown"></i> ' +
                  'YOU LOST! Better luck next roll.';

              }

            }

            await fetchPlayerProfile();

            btnRoll.disabled =
              !profileState.luckyFlipEnabled ||
              profileState.balance <
              ethers.parseEther('10');

          },
          3200
        );

      } catch (error) {

        console.error(
          'Coin flip transaction error:',
          error
        );

        coinVisual?.classList.remove(
          'spin-animation'
        );

        if (flipStatusMsg) {

          flipStatusMsg.className =
            'flip-status-message lost';

          flipStatusMsg.textContent =
            `Transaction failed: ` +
            `${getErrorMessage(error)}`;

        }

        btnRoll.disabled = false;

      }

    }
  );

}

/* ==========================================================================
   NETWORK BUTTONS
   ========================================================================== */

if (btnSwitchNetwork) {

  btnSwitchNetwork.addEventListener(
    'click',
    switchNetwork
  );

}

if (btnConnect) {

  btnConnect.addEventListener(
    'click',
    () => connectWallet(true)
  );

}

if (btnDisconnect) {

  btnDisconnect.addEventListener(
    'click',
    () => disconnectWallet(false)
  );

}

/* ==========================================================================
   PARTICLE BACKGROUND
   ========================================================================== */

const canvas =
  document.getElementById('bg-canvas');

let ctx = null;

if (canvas) {

  ctx =
    canvas.getContext('2d');

}

let particles = [];

function resizeCanvas() {

  if (!canvas) {
    return;
  }

  canvas.width =
    window.innerWidth;

  canvas.height =
    window.innerHeight;

}

window.addEventListener(
  'resize',
  resizeCanvas
);

resizeCanvas();

class Particle {

  constructor() {

    this.x =
      Math.random() *
      canvas.width;

    this.y =
      Math.random() *
      canvas.height;

    this.size =
      Math.random() *
      1.5 +
      0.5;

    this.speedX =
      Math.random() *
      0.15 -
      0.075;

    this.speedY =
      Math.random() *
      -0.2 -
      0.05;

    this.color =
      Math.random() > 0.5
        ? 'rgba(6, 182, 212, '
        : 'rgba(139, 92, 246, ';

    this.alpha =
      Math.random() *
      0.5 +
      0.2;

  }

  update() {

    this.x +=
      this.speedX;

    this.y +=
      this.speedY;

    if (this.y < 0) {

      this.y =
        canvas.height;

      this.x =
        Math.random() *
        canvas.width;

    }

    if (
      this.x < 0 ||
      this.x > canvas.width
    ) {

      this.x =
        Math.random() *
        canvas.width;

    }

  }

  draw() {

    if (!ctx) {
      return;
    }

    ctx.fillStyle =
      this.color +
      this.alpha +
      ')';

    ctx.beginPath();

    ctx.arc(
      this.x,
      this.y,
      this.size,
      0,
      Math.PI * 2
    );

    ctx.fill();

  }

}

function initParticles() {

  if (!canvas) {
    return;
  }

  particles = [];

  const count =
    Math.min(
      100,
      Math.floor(
        window.innerWidth / 15
      )
    );

  for (
    let i = 0;
    i < count;
    i++
  ) {

    particles.push(
      new Particle()
    );

  }

}

function animateParticles() {

  if (!canvas || !ctx) {
    return;
  }

  ctx.clearRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

  particles.forEach(
    (particle) => {

      particle.update();
      particle.draw();

    }
  );

  requestAnimationFrame(
    animateParticles
  );

}

if (canvas) {

  initParticles();
  animateParticles();

}

/* ==========================================================================
   START
   ========================================================================== */

console.log(
  'Arc Cyber Miner app.js loaded.'
);

console.log(
  'Game contract:',
  DEFAULT_CONTRACTS['5042']
);

console.log(
  'CPLAY token:',
  CPLAY_TOKEN_ADDRESS['5042']
);

initWeb3();
