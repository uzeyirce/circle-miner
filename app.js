/**
 * Circle Miner & Lucky Flip
 * Arc Mainnet
 * Ethers.js v6
 *
 * IMPORTANT:
 * This file intentionally does NOT depend on artifacts.js.
 * The public ABI below is defined explicitly to avoid malformed ABI
 * entries such as "**getClickUpgradeCost**".
 */

// ============================================================================
// APPLICATION STATE
// ============================================================================

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


// ============================================================================
// LIVE CONTRACT ADDRESSES
// ============================================================================

const DEFAULT_CONTRACTS = {
  // Arc Mainnet
  "5042": "0xd67d5a4559d07e8154E0B0dd2DB72597f727e748",

  // Hardhat localhost
  "31337": "0x5FbDB2315678afecb367f032d93F642f64180aa3"
};

const CPLAY_TOKEN_ADDRESS = {
  // External CPLAY ERC20
  "5042": "0x8613155fF713c13F6C177275Af9bF195e69dEd34",

  // Hardhat
  "31337": "0x5FbDB2315678afecb367f032d93F642f64180aa3"
};


// ============================================================================
// EXPLICIT GAME ABI
// ============================================================================
//
// We intentionally define this ABI here instead of relying on artifacts.js.
// This prevents broken function names from the generated ABI.
//
// getPlayerProfile returns 11 values:
// 0 balance
// 1 circleMinerEnabled
// 2 luckyFlipEnabled
// 3 allowanceGiven
// 4 vaultBalanceNow
// 5 username
// 6 playerTotalWinnings
// 7 faucetClaimed
// 8 minerLevel
// 9 clickLevel
// 10 pendingRewards
//

const CONTRACT_ABI = [

  // --------------------------------------------------------------------------
  // PROFILE
  // --------------------------------------------------------------------------

  "function getPlayerProfile(address player) view returns (uint256 balance, bool circleMinerEnabled, bool luckyFlipEnabled, uint256 allowanceGiven, uint256 vaultBalanceNow, string username, uint256 playerTotalWinnings, bool faucetClaimed, uint256 minerLevel, uint256 clickLevel, uint256 pendingRewards)",

  // --------------------------------------------------------------------------
  // USERNAME
  // --------------------------------------------------------------------------

  "function setUsername(string username)",

  // --------------------------------------------------------------------------
  // MINER
  // --------------------------------------------------------------------------

  "function getClickUpgradeCost(uint256 level) view returns (uint256)",

  "function getUpgradeCost(uint256 level) view returns (uint256)",

  "function buyClickUpgrade()",

  "function buyMinerUpgrade()",

  "function claimMining()",

  // --------------------------------------------------------------------------
  // LUCKY FLIP
  // --------------------------------------------------------------------------

  "function coinFlip(bool heads, uint256 amount)",

  // --------------------------------------------------------------------------
  // COIN FLIP EVENT
  // --------------------------------------------------------------------------

  "event CoinFlipResult(address indexed player, bool won, uint256 payout)"
];


// ============================================================================
// ERC20 ABI
// ============================================================================

const ERC20_ABI = [
  "function balanceOf(address account) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)"
];


// ============================================================================
// PROFILE STATE
// ============================================================================

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


// ============================================================================
// CONTRACT ADDRESS
// ============================================================================

function getContractAddress(chainId) {
  const chainStr = String(chainId);

  return DEFAULT_CONTRACTS[chainStr] || DEFAULT_CONTRACTS["5042"];
}


// ============================================================================
// PAGE ELEMENTS
// ============================================================================

const btnConnect = document.getElementById("btn-connect");
const btnDisconnect = document.getElementById("btn-disconnect");

const tokenDisplay = document.getElementById("token-display");
const playerBalanceEl = document.getElementById("player-balance");

const networkWarning = document.getElementById("network-warning");
const btnSwitchNetwork = document.getElementById("btn-switch-network");

const walletAddressAbbr = document.getElementById("wallet-address-abbr");

const usernameDisplay = document.getElementById("username-display");
const vaultBalanceValEl = document.getElementById("vault-balance-val");
const totalWinningsValEl = document.getElementById("total-winnings-val");

const usernameInput = document.getElementById("username-input");
const btnSetUsername = document.getElementById("btn-set-username");

const leaderboardTbody = document.getElementById("leaderboard-tbody");

const btnFaucet = document.getElementById("btn-faucet");


// ============================================================================
// MINER ELEMENTS
// ============================================================================

const clickCrystal = document.getElementById("click-crystal");
const localClicksEl = document.getElementById("local-clicks");

const miningPendingEl = document.getElementById("mining-pending");
const btnClaimMining = document.getElementById("btn-claim-mining");

const clickLevelLbl = document.getElementById("click-level-lbl");
const clickUpgradeCost = document.getElementById("click-upgrade-cost");
const btnUpgradeClick = document.getElementById("btn-upgrade-click");

const minerLevelLbl = document.getElementById("miner-level-lbl");
const minerUpgradeCost = document.getElementById("miner-upgrade-cost");
const btnUpgradeMiner = document.getElementById("btn-upgrade-miner");


// ============================================================================
// FLIP ELEMENTS
// ============================================================================

const coinVisual = document.getElementById("coin-visual");

const btnBetHeads = document.getElementById("btn-bet-heads");
const btnBetTails = document.getElementById("btn-bet-tails");

const betAmountInput = document.getElementById("bet-amount");
const btnBetMax = document.getElementById("btn-bet-max");

const btnRoll = document.getElementById("btn-roll");

const flipStatusMsg = document.getElementById("flip-status-msg");


// ============================================================================
// TRANSACTION LOG
// ============================================================================

const txTbody = document.getElementById("tx-tbody");
const txCountEl = document.getElementById("tx-count");
const txEmptyRow = document.getElementById("tx-empty-row");


// ============================================================================
// TAB NAVIGATION
// ============================================================================

const tabButtons = document.querySelectorAll(".nav-tab");
const tabPanels = document.querySelectorAll(".tab-panel");

tabButtons.forEach(button => {

  button.addEventListener("click", () => {

    const tabId = button.getAttribute("data-tab");

    tabButtons.forEach(btn => {
      btn.classList.remove("active");
    });

    tabPanels.forEach(panel => {
      panel.classList.remove("active");
    });

    button.classList.add("active");

    const targetPanel = document.getElementById(tabId);

    if (targetPanel) {
      targetPanel.classList.add("active");
    }

  });

});


// ============================================================================
// WEB3 INITIALIZATION
// ============================================================================

async function initWeb3() {

  if (typeof window.ethereum === "undefined") {

    console.error("No Ethereum wallet detected.");

    if (btnConnect) {

      btnConnect.addEventListener("click", () => {

        alert(
          "Ethereum wallet not detected. Please install MetaMask or Coinbase Wallet."
        );

      });

    }

    return;
  }


  try {

    provider = new ethers.BrowserProvider(window.ethereum);


    // ------------------------------------------------------------------------
    // Chain changed
    // ------------------------------------------------------------------------

    window.ethereum.on("chainChanged", () => {

      console.log("Chain changed. Reloading...");

      window.location.reload();

    });


    // ------------------------------------------------------------------------
    // Account changed
    // ------------------------------------------------------------------------

    window.ethereum.on("accountsChanged", async (accounts) => {

      console.log("Accounts changed:", accounts);

      if (!accounts || accounts.length === 0) {

        disconnectWallet();

        return;
      }

      await connectWallet();

    });


    // ------------------------------------------------------------------------
    // Check existing connection
    // ------------------------------------------------------------------------

    const accounts = await provider.listAccounts();

    if (accounts.length > 0) {

      await connectWallet();

    }

  } catch (error) {

    console.error(
      "Failed to initialize Web3:",
      error
    );

  }

}


// ============================================================================
// CONNECT WALLET
// ============================================================================

async function connectWallet() {

  try {

    if (!provider) {

      provider = new ethers.BrowserProvider(window.ethereum);

    }


    // Request account access

    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts"
    });


    if (!accounts || accounts.length === 0) {

      throw new Error("No wallet account returned.");

    }


    walletAddress = accounts[0];


    // ------------------------------------------------------------------------
    // Signer
    // ------------------------------------------------------------------------

    signer = await provider.getSigner();


    // ------------------------------------------------------------------------
    // Network
    // ------------------------------------------------------------------------

    const network = await provider.getNetwork();

    currentChainId = network.chainId;


    console.log(
      "Connected wallet:",
      walletAddress
    );

    console.log(
      "Chain ID:",
      currentChainId.toString()
    );


    // ------------------------------------------------------------------------
    // UI
    // ------------------------------------------------------------------------

    if (btnConnect) {

      btnConnect.innerHTML =
        `<i class="fa-solid fa-circle-nodes"></i> ` +
        `Connected: ${walletAddress.substring(0, 6)}...${walletAddress.substring(38)}`;

      btnConnect.classList.remove("btn-connect");
      btnConnect.classList.add("btn-outline");

    }


    if (btnDisconnect) {

      btnDisconnect.classList.remove("hidden");

    }


    if (walletAddressAbbr) {

      walletAddressAbbr.textContent =
        `${walletAddress.substring(0, 10)}...${walletAddress.substring(34)}`;

    }


    if (tokenDisplay) {

      tokenDisplay.classList.remove("hidden");

    }


    // ------------------------------------------------------------------------
    // Supported networks
    // ------------------------------------------------------------------------

    if (
      currentChainId === 5042n ||
      currentChainId === 31337n
    ) {

      if (networkWarning) {

        networkWarning.classList.add("hidden");

      }


      const contractAddress =
        getContractAddress(currentChainId);


      const tokenAddress =
        CPLAY_TOKEN_ADDRESS[String(currentChainId)];


      console.log(
        "GAME CONTRACT:",
        contractAddress
      );


      console.log(
        "CPLAY TOKEN:",
        tokenAddress
      );


      // ----------------------------------------------------------------------
      // IMPORTANT:
      // Explicit clean ABI.
      // No artifacts.js here.
      // ----------------------------------------------------------------------

      contract = new ethers.Contract(
        contractAddress,
        CONTRACT_ABI,
        signer
      );


      tokenContract = new ethers.Contract(
        tokenAddress,
        ERC20_ABI,
        signer
      );


      console.log(
        "Contract object created:",
        contract
      );


      console.log(
        "Contract address:",
        await contract.getAddress()
      );


      // ----------------------------------------------------------------------
      // Read profile
      // ----------------------------------------------------------------------

      await fetchPlayerProfile();


      // ----------------------------------------------------------------------
      // Leaderboard intentionally disabled because Infura limits
      // eth_getLogs to 10,000 blocks.
      // ----------------------------------------------------------------------

      // await loadLeaderboard();


      // ----------------------------------------------------------------------
      // Start passive mining timer
      // ----------------------------------------------------------------------

      startPassiveMiningTimer();


    } else {

      console.warn(
        "Unsupported network:",
        currentChainId.toString()
      );


      if (networkWarning) {

        networkWarning.classList.remove("hidden");

      }


      disableGameControls();

    }

  } catch (error) {

    console.error(
      "Wallet connection failed:",
      error
    );

    if (flipStatusMsg) {

      flipStatusMsg.textContent =
        "Wallet connection failed.";

    }

  }

}


// ============================================================================
// DISCONNECT
// ============================================================================

function disconnectWallet() {

  walletAddress = null;

  signer = null;

  contract = null;

  tokenContract = null;


  if (btnConnect) {

    btnConnect.innerHTML =
      `<i class="fa-solid fa-wallet"></i> Connect Wallet`;

    btnConnect.classList.add("btn-connect");
    btnConnect.classList.remove("btn-outline");

  }


  if (btnDisconnect) {

    btnDisconnect.classList.add("hidden");

  }


  if (walletAddressAbbr) {

    walletAddressAbbr.textContent =
      "Not Connected";

  }


  if (tokenDisplay) {

    tokenDisplay.classList.add("hidden");

  }


  disableGameControls();


  if (miningUpdateInterval) {

    clearInterval(miningUpdateInterval);

    miningUpdateInterval = null;

  }


  // Reset local state

  localClicks = 0;

  pendingClaimLocal = 0;


  if (localClicksEl) {

    localClicksEl.textContent = "0";

  }


  if (miningPendingEl) {

    miningPendingEl.textContent = "0.0000";

  }

}


// ============================================================================
// DISABLE CONTROLS
// ============================================================================

function disableGameControls() {

  if (btnClaimMining) {
    btnClaimMining.disabled = true;
  }

  if (btnUpgradeClick) {
    btnUpgradeClick.disabled = true;
  }

  if (btnUpgradeMiner) {
    btnUpgradeMiner.disabled = true;
  }

  if (btnRoll) {
    btnRoll.disabled = true;
  }

  if (btnSetUsername) {
    btnSetUsername.disabled = true;
  }

}


// ============================================================================
// SWITCH TO ARC MAINNET
// ============================================================================

async function switchNetwork() {

  try {

    await window.ethereum.request({

      method: "wallet_switchEthereumChain",

      params: [
        {
          chainId: "0x13b2"
        }
      ]

    });

  } catch (switchError) {

    console.error(
      "Failed to switch network:",
      switchError
    );


    // Network not added

    if (switchError.code === 4902) {

      try {

        await window.ethereum.request({

          method: "wallet_addEthereumChain",

          params: [

            {
              chainId: "0x13b2",

              chainName: "Arc Mainnet",

              nativeCurrency: {
                name: "USDC",
                symbol: "USDC",
                decimals: 18
              },

              rpcUrls: [
                "https://arc-mainnet.infura.io/v3/de58e8647ba54873a65e6b8d2d7bade7"
              ],

              blockExplorerUrls: [
                "https://arc.exploreme.pro"
              ]

            }

          ]

        });

      } catch (addError) {

        console.error(
          "Could not add Arc Mainnet:",
          addError
        );

      }

    }

  }

}


// ============================================================================
// BUTTON EVENTS
// ============================================================================

if (btnDisconnect) {

  btnDisconnect.addEventListener(
    "click",
    disconnectWallet
  );

}


if (btnSwitchNetwork) {

  btnSwitchNetwork.addEventListener(
    "click",
    switchNetwork
  );

}


if (btnConnect) {

  btnConnect.addEventListener(
    "click",
    connectWallet
  );

}


// ============================================================================
// LEADERBOARD
// ============================================================================
//
// Disabled intentionally.
//
// Infura returns:
//
// eth_getLogs is limited to a 10,000 range
//
// Do not call queryFilter(0, latest) here.
//

async function loadLeaderboard() {

  console.log(
    "Leaderboard disabled because RPC eth_getLogs has a 10,000 block limit."
  );


  if (leaderboardTbody) {

    leaderboardTbody.innerHTML =
      '<tr>' +
      '<td colspan="3" class="leaderboard-empty">' +
      'Leaderboard temporarily disabled.' +
      '</td>' +
      '</tr>';

  }

}


// ============================================================================
// FETCH PLAYER PROFILE
// ============================================================================
//
// We use a direct eth_call + explicit ABI decode.
// This completely avoids the malformed artifacts.js ABI and ethers Result
// indexing problem that caused:
//
// RangeError: out of result range
//

async function fetchPlayerProfile() {

  if (!contract || !walletAddress) {

    console.warn(
      "fetchPlayerProfile skipped: contract or wallet missing."
    );

    return;

  }


  try {

    // ------------------------------------------------------------------------
    // Explicit interface
    // ------------------------------------------------------------------------

    const profileIface = new ethers.Interface([

      "function getPlayerProfile(address player) view returns (uint256 balance, bool circleMinerEnabled, bool luckyFlipEnabled, uint256 allowanceGiven, uint256 vaultBalanceNow, string username, uint256 playerTotalWinnings, bool faucetClaimed, uint256 minerLevel, uint256 clickLevel, uint256 pendingRewards)"

    ]);


    // ------------------------------------------------------------------------
    // Encode call
    // ------------------------------------------------------------------------

    const callData =
      profileIface.encodeFunctionData(
        "getPlayerProfile",
        [walletAddress]
      );


    // ------------------------------------------------------------------------
    // Direct eth_call through connected wallet RPC
    // ------------------------------------------------------------------------

    const contractAddress =
      await contract.getAddress();


    const rawResult =
      await window.ethereum.request({

        method: "eth_call",

        params: [

          {
            to: contractAddress,
            data: callData
          },

          "latest"

        ]

      });


    console.log(
      "RAW getPlayerProfile:",
      rawResult
    );


    console.log(
      "RAW length:",
      rawResult.length
    );


    // ------------------------------------------------------------------------
    // Decode
    // ------------------------------------------------------------------------

    const decoded =
      profileIface.decodeFunctionResult(
        "getPlayerProfile",
        rawResult
      );


    const result =
      Array.from(decoded);


    console.log(
      "Decoded profile:",
      result
    );


    if (result.length !== 11) {

      throw new Error(
        `Unexpected getPlayerProfile result length: ${result.length}`
      );

    }


    // ------------------------------------------------------------------------
    // Store profile
    // ------------------------------------------------------------------------

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


    // ------------------------------------------------------------------------
    // Balance
    // ------------------------------------------------------------------------

    const formattedBalance =
      parseFloat(
        ethers.formatEther(
          profileState.balance
        )
      ).toFixed(2);


    if (playerBalanceEl) {

      playerBalanceEl.textContent =
        Number(formattedBalance).toLocaleString();

    }


    // ------------------------------------------------------------------------
    // Vault
    // ------------------------------------------------------------------------

    if (vaultBalanceValEl) {

      vaultBalanceValEl.textContent =
        `${Number(
          parseFloat(
            ethers.formatEther(
              profileState.vaultBalance
            )
          ).toFixed(2)
        ).toLocaleString()} CPLAY`;

    }


    // ------------------------------------------------------------------------
    // Username
    // ------------------------------------------------------------------------

    if (
      profileState.username &&
      profileState.username.length > 0
    ) {

      if (usernameDisplay) {

        usernameDisplay.textContent =
          profileState.username;

      }


      if (usernameInput) {

        usernameInput.placeholder =
          "Change username";

      }

    } else {

      if (usernameDisplay) {

        usernameDisplay.textContent =
          "— not set —";

      }


      if (usernameInput) {

        usernameInput.placeholder =
          "Set a username";

      }

    }


    if (usernameInput) {

      usernameInput.value = "";

    }


    if (btnSetUsername) {

      btnSetUsername.disabled = true;

    }


    // ------------------------------------------------------------------------
    // Total winnings
    // ------------------------------------------------------------------------

    if (totalWinningsValEl) {

      totalWinningsValEl.textContent =
        `${Number(
          parseFloat(
            ethers.formatEther(
              profileState.totalWinnings
            )
          ).toFixed(2)
        ).toLocaleString()} CPLAY`;

    }


    // ------------------------------------------------------------------------
    // Lucky Flip
    // ------------------------------------------------------------------------

    if (btnRoll) {

      btnRoll.disabled =
        !profileState.luckyFlipEnabled ||
        profileState.balance <
          ethers.parseEther("10");

    }


    // ------------------------------------------------------------------------
    // Circle Miner
    // ------------------------------------------------------------------------

    if (profileState.circleMinerEnabled) {

      if (clickLevelLbl) {

        clickLevelLbl.textContent =
          profileState.clickLevel.toString();

      }


      if (minerLevelLbl) {

        minerLevelLbl.textContent =
          profileState.minerLevel.toString();

      }


      // ----------------------------------------------------------------------
      // IMPORTANT:
      // These now use our explicit clean contract ABI.
      // ----------------------------------------------------------------------

      let clickCost = 0n;

      let minerCost = 0n;


      try {

        clickCost =
          await contract.getClickUpgradeCost(
            profileState.clickLevel
          );


        console.log(
          "Click upgrade cost:",
          clickCost.toString()
        );


      } catch (error) {

        console.error(
          "getClickUpgradeCost failed:",
          error
        );

      }


      try {

        minerCost =
          await contract.getUpgradeCost(
            profileState.minerLevel
          );


        console.log(
          "Miner upgrade cost:",
          minerCost.toString()
        );


      } catch (error) {

        console.error(
          "getUpgradeCost failed:",
          error
        );

      }


      // ----------------------------------------------------------------------
      // Click upgrade UI
      // ----------------------------------------------------------------------

      if (clickUpgradeCost) {

        clickUpgradeCost.textContent =
          parseFloat(
            ethers.formatEther(clickCost)
          ).toFixed(0);

      }


      if (btnUpgradeClick) {

        btnUpgradeClick.disabled =
          clickCost === 0n ||
          profileState.balance < clickCost;

      }


      // ----------------------------------------------------------------------
      // Miner upgrade UI
      // ----------------------------------------------------------------------

      if (minerUpgradeCost) {

        minerUpgradeCost.textContent =
          parseFloat(
            ethers.formatEther(minerCost)
          ).toFixed(0);

      }


      if (btnUpgradeMiner) {

        btnUpgradeMiner.disabled =
          minerCost === 0n ||
          profileState.balance < minerCost;

      }


      // ----------------------------------------------------------------------
      // Pending rewards
      // ----------------------------------------------------------------------

      pendingClaimLocal =
        parseFloat(
          ethers.formatEther(
            profileState.pendingRewards
          )
        );


      updateMiningDisplay();

    }


    console.log(
      "✅ Player profile loaded successfully."
    );


  } catch (error) {

    console.error(
      "❌ Error reading profile stats:",
      error
    );


    if (flipStatusMsg) {

      flipStatusMsg.textContent =
        "Contract read failed. Check contract/network.";

    }

  }

}


// ============================================================================
// PASSIVE MINING TIMER
// ============================================================================

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


// ============================================================================
// MINING DISPLAY
// ============================================================================

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


// ============================================================================
// FORMAT TIME
// ============================================================================

function formatTime(sec) {

  const m =
    Math.floor(sec / 60);

  const s =
    sec % 60;

  return `${m}:${s < 10 ? "0" : ""}${s}`;

}


// ============================================================================
// CLICKER
// ============================================================================

if (clickCrystal) {

  clickCrystal.addEventListener(
    "click",
    (e) => {

      localClicks += 1;


      if (localClicksEl) {

        localClicksEl.textContent =
          localClicks;

      }


      createClickParticle(e);

    }
  );

}


function createClickParticle(e) {

  if (!clickCrystal) {
    return;
  }


  const rect =
    clickCrystal.getBoundingClientRect();


  const x =
    e.clientX ||
    (rect.left + rect.width / 2);


  const y =
    e.clientY ||
    (rect.top + rect.height / 2);


  const floating =
    document.createElement("div");


  floating.className =
    "floating-click-val";


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


// ============================================================================
// TRANSACTION LOG
// ============================================================================

function logTransaction(
  actionName,
  txHash,
  status
) {

  if (!txTbody) {
    return null;
  }


  if (txEmptyRow) {

    txEmptyRow.classList.add("hidden");

  }


  transactionsCount++;


  if (txCountEl) {

    txCountEl.textContent =
      `${transactionsCount} Transaction${
        transactionsCount > 1 ? "s" : ""
      }`;

  }


  const tr =
    document.createElement("tr");


  const now =
    new Date();


  const timeStr =
    `${now.getHours().toString().padStart(2, "0")}:` +
    `${now.getMinutes().toString().padStart(2, "0")}:` +
    `${now.getSeconds().toString().padStart(2, "0")}`;


  let statusBadge = "";


  if (status === "pending") {

    statusBadge =
      '<span class="tx-status-badge pending">' +
      '<i class="fa-solid fa-spinner fa-spin"></i> Pending' +
      "</span>";

  } else if (status === "success") {

    statusBadge =
      '<span class="tx-status-badge success">' +
      '<i class="fa-solid fa-circle-check"></i> Success' +
      "</span>";

  } else {

    statusBadge =
      '<span class="tx-status-badge failed">' +
      '<i class="fa-solid fa-circle-xmark"></i> Failed' +
      "</span>";

  }


  const explorerUrl =
    currentChainId === 5042n
      ? `https://arc.exploreme.pro/tx/${txHash}`
      : "#";


  const txLink =
    txHash !== "N/A"

      ? `<a href="${explorerUrl}" target="_blank" rel="noopener" class="monospace text-glow-blue">${txHash.substring(0, 10)}...</a>`

      : '<span class="text-muted">N/A</span>';


  tr.innerHTML = `

    <td>${timeStr}</td>

    <td class="font-weight-bold">
      ${actionName}
    </td>

    <td>
      ${statusBadge}
    </td>

    <td>
      Gas estimate processing...
    </td>

    <td>
      ${txLink}
    </td>

  `;


  txTbody.insertBefore(
    tr,
    txTbody.firstChild
  );


  return tr;

}


// ============================================================================
// UPDATE TRANSACTION LOG
// ============================================================================

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


  if (status === "success") {

    statusTd.innerHTML =
      '<span class="tx-status-badge success">' +
      '<i class="fa-solid fa-circle-check"></i> Success' +
      "</span>";

  } else {

    statusTd.innerHTML =
      '<span class="tx-status-badge failed">' +
      '<i class="fa-solid fa-circle-xmark"></i> Failed' +
      "</span>";

  }


  gasTd.textContent =
    gasDetails || "N/A";

}


// ============================================================================
// USERNAME INPUT
// ============================================================================

if (usernameInput) {

  usernameInput.addEventListener(
    "input",
    () => {

      if (btnSetUsername) {

        btnSetUsername.disabled =
          !contract ||
          usernameInput.value.trim().length === 0;

      }

    }
  );

}


// ============================================================================
// SET USERNAME
// ============================================================================

if (btnSetUsername) {

  btnSetUsername.addEventListener(
    "click",
    async () => {

      if (!contract) {
        return;
      }


      const name =
        usernameInput.value.trim();


      if (!name || name.length > 20) {

        alert(
          "Username must be 1-20 characters."
        );

        return;

      }


      btnSetUsername.disabled = true;


      const logRow =
        logTransaction(
          "Set Username",
          "N/A",
          "pending"
        );


      try {

        const tx =
          await contract.setUsername(name);


        logRow.cells[4].innerHTML =
          `<a href="https://arc.exploreme.pro/tx/${tx.hash}" target="_blank" rel="noopener" class="monospace text-glow-blue">${tx.hash.substring(0, 10)}...</a>`;


        const receipt =
          await tx.wait();


        updateTransactionLog(
          logRow,
          "success",
          `Gas used: ${receipt.gasUsed.toString()}`
        );


        usernameInput.value = "";


        await fetchPlayerProfile();

      } catch (error) {

        console.error(
          "Set username error:",
          error
        );


        updateTransactionLog(
          logRow,
          "failed",
          error.reason ||
          error.shortMessage ||
          "Rejected"
        );


        btnSetUsername.disabled = false;

      }

    }
  );

}


// ============================================================================
// CLICK UPGRADE
// ============================================================================

if (btnUpgradeClick) {

  btnUpgradeClick.addEventListener(
    "click",
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


        console.log(
          "Click upgrade cost:",
          cost.toString()
        );


        const approved =
          await ensureApproval(cost);


        if (!approved) {

          btnUpgradeClick.disabled = false;

          return;

        }


        const logRow =
          logTransaction(
            "Upgrade Super-Click Mult",
            "N/A",
            "pending"
          );


        const tx =
          await contract.buyClickUpgrade();


        logRow.cells[4].innerHTML =
          `<a href="https://arc.exploreme.pro/tx/${tx.hash}" target="_blank" rel="noopener" class="monospace text-glow-blue">${tx.hash.substring(0, 10)}...</a>`;


        const receipt =
          await tx.wait();


        updateTransactionLog(
          logRow,
          "success",
          `Gas used: ${receipt.gasUsed.toString()}`
        );


        await fetchPlayerProfile();

      } catch (error) {

        console.error(
          "Upgrade click error:",
          error
        );


        btnUpgradeClick.disabled = false;

      }

    }
  );

}


// ============================================================================
// MINER UPGRADE
// ============================================================================

if (btnUpgradeMiner) {

  btnUpgradeMiner.addEventListener(
    "click",
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


        console.log(
          "Miner upgrade cost:",
          cost.toString()
        );


        const approved =
          await ensureApproval(cost);


        if (!approved) {

          btnUpgradeMiner.disabled = false;

          return;

        }


        const logRow =
          logTransaction(
            "Upgrade Circle Mining Rig",
            "N/A",
            "pending"
          );


        const tx =
          await contract.buyMinerUpgrade();


        logRow.cells[4].innerHTML =
          `<a href="https://arc.exploreme.pro/tx/${tx.hash}" target="_blank" rel="noopener" class="monospace text-glow-blue">${tx.hash.substring(0, 10)}...</a>`;


        const receipt =
          await tx.wait();


        updateTransactionLog(
          logRow,
          "success",
          `Gas used: ${receipt.gasUsed.toString()}`
        );


        await fetchPlayerProfile();

      } catch (error) {

        console.error(
          "Upgrade miner error:",
          error
        );


        btnUpgradeMiner.disabled = false;

      }

    }
  );

}


// ============================================================================
// CLAIM MINING
// ============================================================================

if (btnClaimMining) {

  btnClaimMining.addEventListener(
    "click",
    async () => {

      if (!contract) {
        return;
      }


      btnClaimMining.disabled = true;


      const logRow =
        logTransaction(
          "Claim Mining Rewards",
          "N/A",
          "pending"
        );


      try {

        const tx =
          await contract.claimMining();


        logRow.cells[4].innerHTML =
          `<a href="https://arc.exploreme.pro/tx/${tx.hash}" target="_blank" rel="noopener" class="monospace text-glow-blue">${tx.hash.substring(0, 10)}...</a>`;


        const receipt =
          await tx.wait();


        updateTransactionLog(
          logRow,
          "success",
          `Gas used: ${receipt.gasUsed.toString()}`
        );


        localClicks = 0;


        if (localClicksEl) {

          localClicksEl.textContent = "0";

        }


        await fetchPlayerProfile();

      } catch (error) {

        console.error(
          "Claim mining error:",
          error
        );


        updateTransactionLog(
          logRow,
          "failed",
          error.reason ||
          error.shortMessage ||
          "Rejected"
        );


        btnClaimMining.disabled = false;

      }

    }
  );

}


// ============================================================================
// BET SELECTION
// ============================================================================

if (btnBetHeads) {

  btnBetHeads.addEventListener(
    "click",
    () => {

      betChoice = "heads";

      btnBetHeads.classList.add("active");

      if (btnBetTails) {
        btnBetTails.classList.remove("active");
      }

    }
  );

}


if (btnBetTails) {

  btnBetTails.addEventListener(
    "click",
    () => {

      betChoice = "tails";

      btnBetTails.classList.add("active");

      if (btnBetHeads) {
        btnBetHeads.classList.remove("active");
      }

    }
  );

}


// ============================================================================
// BET MAX
// ============================================================================

if (btnBetMax) {

  btnBetMax.addEventListener(
    "click",
    () => {

      if (profileState.balance > 0n) {

        const etherVal =
          parseFloat(
            ethers.formatEther(
              profileState.balance
            )
          );


        const rounded =
          Math.floor(
            etherVal / 10
          ) * 10;


        if (betAmountInput) {

          betAmountInput.value =
            Math.max(
              10,
              rounded
            );

        }

      }

    }
  );

}


// ============================================================================
// LUCKY FLIP
// ============================================================================

if (btnRoll) {

  btnRoll.addEventListener(
    "click",
    async () => {

      if (!contract) {
        return;
      }


      const betVal =
        parseFloat(
          betAmountInput.value
        );


      if (
        isNaN(betVal) ||
        betVal < 10
      ) {

        alert(
          "Minimum bet amount is 10 CPLAY"
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
          "Insufficient CPLAY balance to cover bet."
        );

        return;

      }


      btnRoll.disabled = true;


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
          "flip-status-message";


        flipStatusMsg.textContent =
          "Submitting bet to the blockchain...";

      }


      if (coinVisual) {

        coinVisual.classList.add(
          "spin-animation"
        );

      }


      const isHeadsBet =
        betChoice === "heads";


      const logRow =
        logTransaction(
          `Lucky Flip Bet (${betChoice.toUpperCase()})`,
          "N/A",
          "pending"
        );


      try {

        const tx =
          await contract.coinFlip(
            isHeadsBet,
            betWei
          );


        logRow.cells[4].innerHTML =
          `<a href="https://arc.exploreme.pro/tx/${tx.hash}" target="_blank" rel="noopener" class="monospace text-glow-blue">${tx.hash.substring(0, 10)}...</a>`;


        const receipt =
          await tx.wait();


        updateTransactionLog(
          logRow,
          "success",
          `Gas used: ${receipt.gasUsed.toString()}`
        );


        // --------------------------------------------------------------------
        // Parse CoinFlipResult
        // --------------------------------------------------------------------

        let won = false;

        let payout = 0n;


        for (const log of receipt.logs) {

          try {

            const parsedLog =
              contract.interface.parseLog(log);


            if (
              parsedLog &&
              parsedLog.name ===
                "CoinFlipResult"
            ) {

              won =
                Boolean(
                  parsedLog.args.won
                );


              payout =
                parsedLog.args.payout;

            }

          } catch (e) {

            // Ignore unrelated logs

          }

        }


        // --------------------------------------------------------------------
        // Coin animation
        // --------------------------------------------------------------------

        const landedHeads =
          (isHeadsBet && won) ||
          (!isHeadsBet && !won);


        const spinTarget =
          landedHeads
            ? "1800deg"
            : "1980deg";


        if (coinVisual) {

          coinVisual.style.setProperty(
            "--coin-spin-target",
            spinTarget
          );

        }


        setTimeout(
          async () => {

            if (coinVisual) {

              coinVisual.classList.remove(
                "spin-animation"
              );

            }


            if (won) {

              if (flipStatusMsg) {

                flipStatusMsg.className =
                  "flip-status-message won";


                flipStatusMsg.innerHTML =
                  `<i class="fa-solid fa-trophy"></i> ` +
                  `YOU WON! Received ` +
                  `${ethers.formatEther(payout)} ` +
                  `$CPLAY!`;

              }

            } else {

              if (flipStatusMsg) {

                flipStatusMsg.className =
                  "flip-status-message lost";


                flipStatusMsg.innerHTML =
                  `<i class="fa-solid fa-face-frown"></i> ` +
                  `YOU LOST! Better luck next roll.`;

              }

            }


            await fetchPlayerProfile();

          },
          3200
        );


      } catch (error) {

        console.error(
          "Coin flip transaction error:",
          error
        );


        if (coinVisual) {

          coinVisual.classList.remove(
            "spin-animation"
          );

        }


        updateTransactionLog(
          logRow,
          "failed",
          error.reason ||
          error.shortMessage ||
          "Rejected"
        );


        if (flipStatusMsg) {

          flipStatusMsg.textContent =
            "Transaction failed or rejected.";

        }


        btnRoll.disabled = false;

      }

    }
  );

}


// ============================================================================
// ERC20 APPROVAL
// ============================================================================

async function ensureApproval(
  requiredAmount
) {

  if (
    !tokenContract ||
    !contract ||
    !walletAddress
  ) {

    console.error(
      "ensureApproval: contracts not initialized."
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
      "Current CPLAY allowance:",
      currentAllowance.toString()
    );


    if (
      currentAllowance >=
      requiredAmount
    ) {

      return true;

    }


    const logRow =
      logTransaction(
        "Approve $CPLAY Spend",
        "N/A",
        "pending"
      );


    const tx =
      await tokenContract.approve(
        contractAddress,
        ethers.MaxUint256
      );


    logRow.cells[4].innerHTML =
      `<a href="https://arc.exploreme.pro/tx/${tx.hash}" target="_blank" rel="noopener" class="monospace text-glow-blue">${tx.hash.substring(0, 10)}...</a>`;


    const receipt =
      await tx.wait();


    updateTransactionLog(
      logRow,
      "success",
      `Gas used: ${receipt.gasUsed.toString()}`
    );


    return true;

  } catch (error) {

    console.error(
      "Approval failed:",
      error
    );


    return false;

  }

}


// ============================================================================
// PREMIUM PARTICLE BACKGROUND
// ============================================================================

const canvas =
  document.getElementById(
    "bg-canvas"
  );


if (canvas) {

  const ctx =
    canvas.getContext("2d");


  let particles = [];


  function resizeCanvas() {

    canvas.width =
      window.innerWidth;

    canvas.height =
      window.innerHeight;

  }


  window.addEventListener(
    "resize",
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
          ? "rgba(6, 182, 212, "
          : "rgba(139, 92, 246, ";


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

      ctx.fillStyle =
        this.color +
        this.alpha +
        ")";


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

    ctx.clearRect(
      0,
      0,
      canvas.width,
      canvas.height
    );


    particles.forEach(
      p => {

        p.update();
        p.draw();

      }
    );


    requestAnimationFrame(
      animateParticles
    );

  }


  initParticles();

  animateParticles();

}


// ============================================================================
// START APPLICATION
// ============================================================================

console.log(
  "Circle Miner frontend starting..."
);


console.log(
  "Game contract:",
  DEFAULT_CONTRACTS["5042"]
);


console.log(
  "CPLAY token:",
  CPLAY_TOKEN_ADDRESS["5042"]
);


initWeb3();
