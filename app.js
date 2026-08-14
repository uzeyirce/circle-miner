/**
 * Arc Cyber Miner & Lucky Flip
 * Web3 Client Logic - Ethers.js v6
 *
 * FIXED VERSION
 *
 * Main fixes:
 * - CONTRACT_ABI is defined locally
 * - getPlayerProfile uses manual eth_call
 * - No contract.target usage
 * - Leaderboard scanning disabled on startup
 * - Individual read errors are isolated
 * - Better RPC / contract diagnostics
 * - Ethers v6 compatible
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
// CONTRACT ADDRESSES
// ============================================================================

const ARC_MAINNET_CHAIN_ID = 5042n;
const HARDHAT_CHAIN_ID = 31337n;

const DEFAULT_CONTRACTS = {
    "5042": "0xd67d5a4559d07e8154E0B0dd2DB72597f727e748",
    "31337": "0x5FbDB2315678afecb367f032d93F642f64180aa3"
};

const CPLAY_TOKEN_ADDRESS = {
    "5042": "0x8613155fF713c13F6C177275Af9bF195e69dEd34",
    "31337": "0x5FbDB2315678afecb367f032d93F642f64180aa3"
};


// ============================================================================
// GAME CONTRACT ABI
// ============================================================================
//
// IMPORTANT:
// This ABI is intentionally defined directly here.
// app.js no longer depends on artifacts.js for the game contract.
//

const CONTRACT_ABI = [

    // ------------------------------------------------------------------------
    // PLAYER PROFILE
    // ------------------------------------------------------------------------

    "function getPlayerProfile(address player) view returns (uint256 balance,bool circleMinerEnabled,bool luckyFlipEnabled,uint256 allowance,uint256 vaultBalance,string username,uint256 totalWinnings,bool faucetClaimed,uint256 minerLevel,uint256 clickLevel,uint256 pendingRewards)",

    "function totalWinnings(address player) view returns (uint256)",

    "function usernames(address player) view returns (string)",


    // ------------------------------------------------------------------------
    // MINER
    // ------------------------------------------------------------------------

    "function getClickUpgradeCost(uint256 level) view returns (uint256)",

    "function getUpgradeCost(uint256 level) view returns (uint256)",

    "function buyClickUpgrade()",

    "function buyMinerUpgrade()",

    "function claimMining()",


    // ------------------------------------------------------------------------
    // USER
    // ------------------------------------------------------------------------

    "function setUsername(string name)",


    // ------------------------------------------------------------------------
    // COIN FLIP
    // ------------------------------------------------------------------------

    "function coinFlip(bool heads,uint256 amount)",


    // ------------------------------------------------------------------------
    // EVENTS
    // ------------------------------------------------------------------------

    "event CoinFlipResult(address indexed player,bool won,uint256 payout)"
];


// ============================================================================
// ERC20 ABI
// ============================================================================

const ERC20_ABI = [
    "function balanceOf(address account) view returns (uint256)",
    "function allowance(address owner,address spender) view returns (uint256)",
    "function approve(address spender,uint256 amount) returns (bool)",
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
// DOM ELEMENTS
// ============================================================================

const btnConnect = document.getElementById("btn-connect");
const btnDisconnect = document.getElementById("btn-disconnect");

const tokenDisplay = document.getElementById("token-display");
const playerBalanceEl = document.getElementById("player-balance");

const networkWarning = document.getElementById("network-warning");
const btnSwitchNetwork = document.getElementById("btn-switch-network");

const walletAddressAbbr = document.getElementById("wallet-address-abbr");

const usernameDisplay = document.getElementById("username-display");
const usernameInput = document.getElementById("username-input");
const btnSetUsername = document.getElementById("btn-set-username");

const vaultBalanceValEl = document.getElementById("vault-balance-val");
const totalWinningsValEl = document.getElementById("total-winnings-val");

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

        const panel = document.getElementById(tabId);

        if (panel) {
            panel.classList.add("active");
        }
    });

});


// ============================================================================
// HELPER: CONTRACT ADDRESS
// ============================================================================

function getContractAddress(chainId) {

    const chain = String(chainId);

    if (DEFAULT_CONTRACTS[chain]) {
        return DEFAULT_CONTRACTS[chain];
    }

    return DEFAULT_CONTRACTS["5042"];
}


// ============================================================================
// HELPER: TOKEN ADDRESS
// ============================================================================

function getTokenAddress(chainId) {

    const chain = String(chainId);

    return CPLAY_TOKEN_ADDRESS[chain] || CPLAY_TOKEN_ADDRESS["5042"];
}


// ============================================================================
// HELPER: ERROR MESSAGE
// ============================================================================

function getErrorMessage(error) {

    if (!error) {
        return "Unknown error";
    }

    if (error.reason) {
        return error.reason;
    }

    if (error.shortMessage) {
        return error.shortMessage;
    }

    if (error.info && error.info.error && error.info.error.message) {
        return error.info.error.message;
    }

    if (error.message) {
        return error.message;
    }

    return String(error);
}


// ============================================================================
// HELPER: VERIFY CONTRACT
// ============================================================================

async function verifyContractAddress() {

    if (!provider || !contract) {
        return false;
    }

    try {

        const address = await contract.getAddress();

        const code = await provider.getCode(address);

        console.log("========================================");
        console.log("CONTRACT CHECK");
        console.log("Address:", address);
        console.log("Code length:", code.length);
        console.log("Has contract code:", code !== "0x");
        console.log("========================================");

        if (code === "0x") {

            console.error(
                "❌ NO CONTRACT CODE AT:",
                address
            );

            return false;
        }

        return true;

    } catch (error) {

        console.error(
            "Contract verification failed:",
            error
        );

        return false;
    }
}


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

        provider = new ethers.BrowserProvider(
            window.ethereum
        );


        // --------------------------------------------------------------------
        // NETWORK CHANGE
        // --------------------------------------------------------------------

        window.ethereum.on(
            "chainChanged",
            () => {

                console.log(
                    "Network changed. Reloading..."
                );

                window.location.reload();
            }
        );


        // --------------------------------------------------------------------
        // ACCOUNT CHANGE
        // --------------------------------------------------------------------

        window.ethereum.on(
            "accountsChanged",
            async accounts => {

                console.log(
                    "Accounts changed:",
                    accounts
                );

                if (!accounts || accounts.length === 0) {

                    disconnectWallet();

                } else {

                    await connectWallet();
                }

            }
        );


        // --------------------------------------------------------------------
        // AUTO CONNECT
        // --------------------------------------------------------------------

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

    if (!window.ethereum) {
        return;
    }


    try {

        // --------------------------------------------------------------------
        // REQUEST ACCOUNT
        // --------------------------------------------------------------------

        const accounts =
            await window.ethereum.request({
                method: "eth_requestAccounts"
            });


        if (!accounts || accounts.length === 0) {

            throw new Error(
                "No wallet account returned."
            );
        }


        walletAddress = accounts[0];


        // --------------------------------------------------------------------
        // PROVIDER
        // --------------------------------------------------------------------

        if (!provider) {

            provider =
                new ethers.BrowserProvider(
                    window.ethereum
                );
        }


        signer =
            await provider.getSigner();


        // --------------------------------------------------------------------
        // NETWORK
        // --------------------------------------------------------------------

        const network =
            await provider.getNetwork();

        currentChainId =
            network.chainId;


        console.log(
            "Connected wallet:",
            walletAddress
        );

        console.log(
            "Chain ID:",
            currentChainId.toString()
        );


        // --------------------------------------------------------------------
        // UI
        // --------------------------------------------------------------------

        if (btnConnect) {

            btnConnect.innerHTML =
                `<i class="fa-solid fa-circle-nodes"></i> ` +
                `Connected: ${walletAddress.substring(0, 6)}...${walletAddress.substring(38)}`;

            btnConnect.classList.remove(
                "btn-connect"
            );

            btnConnect.classList.add(
                "btn-outline"
            );
        }


        if (btnDisconnect) {
            btnDisconnect.classList.remove(
                "hidden"
            );
        }


        if (walletAddressAbbr) {

            walletAddressAbbr.textContent =
                `${walletAddress.substring(0, 10)}...${walletAddress.substring(34)}`;
        }


        if (tokenDisplay) {
            tokenDisplay.classList.remove("hidden");
        }


        // --------------------------------------------------------------------
        // NETWORK CHECK
        // --------------------------------------------------------------------

        if (
            currentChainId !== ARC_MAINNET_CHAIN_ID &&
            currentChainId !== HARDHAT_CHAIN_ID
        ) {

            console.warn(
                "Wrong network:",
                currentChainId.toString()
            );

            if (networkWarning) {
                networkWarning.classList.remove(
                    "hidden"
                );
            }

            disableGameControls();

            return;
        }


        if (networkWarning) {
            networkWarning.classList.add(
                "hidden"
            );
        }


        // --------------------------------------------------------------------
        // CONTRACT ADDRESS
        // --------------------------------------------------------------------

        const contractAddress =
            getContractAddress(
                currentChainId
            );

        const tokenAddress =
            getTokenAddress(
                currentChainId
            );


        console.log(
            "Game contract:",
            contractAddress
        );

        console.log(
            "CPLAY token:",
            tokenAddress
        );


        // --------------------------------------------------------------------
        // CONTRACT INSTANCE
        // --------------------------------------------------------------------

        contract =
            new ethers.Contract(
                contractAddress,
                CONTRACT_ABI,
                signer
            );


        tokenContract =
            new ethers.Contract(
                tokenAddress,
                ERC20_ABI,
                signer
            );


        // --------------------------------------------------------------------
        // VERIFY CONTRACT
        // --------------------------------------------------------------------

        const contractExists =
            await verifyContractAddress();


        if (!contractExists) {

            showReadError(
                "No contract code found at game contract address."
            );

            return;
        }


        // --------------------------------------------------------------------
        // TEST ABI
        // --------------------------------------------------------------------

        try {

            console.log(
                "Testing getPlayerProfile..."
            );

            const profile =
                await readPlayerProfileRaw(
                    walletAddress
                );

            console.log(
                "✅ getPlayerProfile works:",
                profile
            );

        } catch (error) {

            console.error(
                "❌ getPlayerProfile test failed:",
                error
            );

            showReadError(
                "getPlayerProfile failed: " +
                getErrorMessage(error)
            );

            return;
        }


        // --------------------------------------------------------------------
        // LOAD PROFILE
        // --------------------------------------------------------------------

        await fetchPlayerProfile();


        // --------------------------------------------------------------------
        // START MINING TIMER
        // --------------------------------------------------------------------

        startPassiveMiningTimer();


        // --------------------------------------------------------------------
        // IMPORTANT:
        // Leaderboard is NOT loaded here.
        //
        // It was causing unnecessary eth_getLogs scanning.
        // --------------------------------------------------------------------

        console.log(
            "✅ Web3 initialization complete."
        );


    } catch (error) {

        console.error(
            "Wallet connection failed:",
            error
        );

        showReadError(
            "Wallet connection failed: " +
            getErrorMessage(error)
        );

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

    currentChainId = null;

    localClicks = 0;
    pendingClaimLocal = 0;

    if (miningUpdateInterval) {

        clearInterval(
            miningUpdateInterval
        );

        miningUpdateInterval = null;
    }


    if (btnConnect) {

        btnConnect.innerHTML =
            `<i class="fa-solid fa-wallet"></i> Connect Wallet`;

        btnConnect.classList.add(
            "btn-connect"
        );

        btnConnect.classList.remove(
            "btn-outline"
        );
    }


    if (btnDisconnect) {

        btnDisconnect.classList.add(
            "hidden"
        );
    }


    if (walletAddressAbbr) {

        walletAddressAbbr.textContent =
            "Not Connected";
    }


    if (tokenDisplay) {

        tokenDisplay.classList.add(
            "hidden"
        );
    }


    disableGameControls();

}


// ============================================================================
// DISABLE GAME CONTROLS
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

    if (!window.ethereum) {
        return;
    }


    try {

        await window.ethereum.request({

            method:
                "wallet_switchEthereumChain",

            params: [
                {
                    chainId: "0x13b2"
                }
            ]

        });

    } catch (switchError) {

        console.error(
            "Network switch failed:",
            switchError
        );


        if (switchError.code === 4902) {

            try {

                await window.ethereum.request({

                    method:
                        "wallet_addEthereumChain",

                    params: [

                        {

                            chainId:
                                "0x13b2",

                            chainName:
                                "Arc Mainnet",

                            nativeCurrency: {

                                name:
                                    "USDC",

                                symbol:
                                    "USDC",

                                decimals:
                                    18
                            },

                            rpcUrls: [
                                "https://arc-mainnet.infura.io/v3/b6bf7d3508c941499b10025c0776eaf8"
                            ],

                            blockExplorerUrls: [
                                "https://arc.exploreme.pro"
                            ]

                        }

                    ]

                });

            } catch (addError) {

                console.error(
                    "Could not add Arc network:",
                    addError
                );

            }

        }

    }

}


// ============================================================================
// RAW PLAYER PROFILE READ
// ============================================================================
//
// This is the important fix.
//
// Instead of relying on:
//     contract.getPlayerProfile()
//
// we encode the function manually and call eth_call.
//
// This avoids ethers Result/Proxy problems.
//

async function readPlayerProfileRaw(address) {

    if (!provider) {
        throw new Error(
            "Provider is not initialized."
        );
    }


    if (!contract) {
        throw new Error(
            "Contract is not initialized."
        );
    }


    const contractAddress =
        await contract.getAddress();


    const profileInterface =
        new ethers.Interface([

            "function getPlayerProfile(address) view returns (uint256,bool,bool,uint256,uint256,string,uint256,bool,uint256,uint256,uint256)"

        ]);


    const calldata =
        profileInterface.encodeFunctionData(
            "getPlayerProfile",
            [address]
        );


    console.log(
        "eth_call target:",
        contractAddress
    );

    console.log(
        "eth_call data:",
        calldata
    );


    const rawResult =
        await provider.send(
            "eth_call",
            [
                {
                    to:
                        contractAddress,

                    data:
                        calldata
                },

                "latest"
            ]
        );


    console.log(
        "Raw profile result:",
        rawResult
    );


    if (
        !rawResult ||
        rawResult === "0x"
    ) {

        throw new Error(
            "Contract returned empty result."
        );
    }


    const decoded =
        profileInterface.decodeFunctionResult(
            "getPlayerProfile",
            rawResult
        );


    const result =
        Array.from(decoded);


    if (result.length !== 11) {

        throw new Error(
            `Unexpected getPlayerProfile result length: ${result.length}`
        );
    }


    return result;
}


// ============================================================================
// SHOW READ ERROR
// ============================================================================

function showReadError(message) {

    console.error(
        "CONTRACT READ ERROR:",
        message
    );


    if (flipStatusMsg) {

        flipStatusMsg.className =
            "flip-status-message lost";

        flipStatusMsg.textContent =
            message;
    }

}


// ============================================================================
// FETCH PLAYER PROFILE
// ============================================================================

async function fetchPlayerProfile() {

    if (!contract || !walletAddress) {

        console.warn(
            "fetchPlayerProfile skipped: contract/wallet missing."
        );

        return;
    }


    try {

        // --------------------------------------------------------------------
        // PROFILE READ
        // --------------------------------------------------------------------

        const result =
            await readPlayerProfileRaw(
                walletAddress
            );


        console.log(
            "Decoded profile:",
            result
        );


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


        // --------------------------------------------------------------------
        // BALANCE
        // --------------------------------------------------------------------

        if (playerBalanceEl) {

            const balance =
                parseFloat(
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


        // --------------------------------------------------------------------
        // VAULT
        // --------------------------------------------------------------------

        if (vaultBalanceValEl) {

            const vault =
                parseFloat(
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


        // --------------------------------------------------------------------
        // USERNAME
        // --------------------------------------------------------------------

        if (usernameDisplay) {

            if (
                profileState.username &&
                profileState.username.length > 0
            ) {

                usernameDisplay.textContent =
                    profileState.username;

            } else {

                usernameDisplay.textContent =
                    "— not set —";
            }
        }


        if (usernameInput) {

            usernameInput.placeholder =
                profileState.username
                    ? "Change username"
                    : "Set a username";

            usernameInput.value = "";
        }


        if (btnSetUsername) {
            btnSetUsername.disabled = true;
        }


        // --------------------------------------------------------------------
        // TOTAL WINNINGS
        // --------------------------------------------------------------------

        if (totalWinningsValEl) {

            const winnings =
                parseFloat(
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


        // --------------------------------------------------------------------
        // LUCKY FLIP
        // --------------------------------------------------------------------

        if (btnRoll) {

            btnRoll.disabled =
                !profileState.luckyFlipEnabled ||
                profileState.balance <
                    ethers.parseEther("10");
        }


        // --------------------------------------------------------------------
        // MINER
        // --------------------------------------------------------------------

        if (
            profileState.circleMinerEnabled
        ) {

            if (clickLevelLbl) {

                clickLevelLbl.textContent =
                    profileState.clickLevel.toString();
            }


            if (minerLevelLbl) {

                minerLevelLbl.textContent =
                    profileState.minerLevel.toString();
            }


            // ---------------------------------------------------------------
            // CLICK UPGRADE COST
            // ---------------------------------------------------------------

            try {

                const clickCost =
                    await contract.getClickUpgradeCost(
                        profileState.clickLevel
                    );


                console.log(
                    "Click upgrade cost:",
                    clickCost.toString()
                );


                if (clickUpgradeCost) {

                    clickUpgradeCost.textContent =
                        parseFloat(
                            ethers.formatEther(
                                clickCost
                            )
                        ).toFixed(0);
                }


                if (btnUpgradeClick) {

                    btnUpgradeClick.disabled =
                        profileState.balance <
                        clickCost;
                }


            } catch (error) {

                console.error(
                    "getClickUpgradeCost failed:",
                    error
                );


                if (clickUpgradeCost) {
                    clickUpgradeCost.textContent =
                        "—";
                }

                if (btnUpgradeClick) {
                    btnUpgradeClick.disabled =
                        true;
                }
            }


            // ---------------------------------------------------------------
            // MINER UPGRADE COST
            // ---------------------------------------------------------------

            try {

                const minerCost =
                    await contract.getUpgradeCost(
                        profileState.minerLevel
                    );


                console.log(
                    "Miner upgrade cost:",
                    minerCost.toString()
                );


                if (minerUpgradeCost) {

                    minerUpgradeCost.textContent =
                        parseFloat(
                            ethers.formatEther(
                                minerCost
                            )
                        ).toFixed(0);
                }


                if (btnUpgradeMiner) {

                    btnUpgradeMiner.disabled =
                        profileState.balance <
                        minerCost;
                }


            } catch (error) {

                console.error(
                    "getUpgradeCost failed:",
                    error
                );


                if (minerUpgradeCost) {
                    minerUpgradeCost.textContent =
                        "—";
                }

                if (btnUpgradeMiner) {
                    btnUpgradeMiner.disabled =
                        true;
                }
            }


            // ---------------------------------------------------------------
            // PENDING REWARDS
            // ---------------------------------------------------------------

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
            "❌ Error reading player profile:",
            error
        );


        showReadError(
            "Contract read failed: " +
            getErrorMessage(error)
        );
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
// UPDATE MINING DISPLAY
// ============================================================================

function updateMiningDisplay() {

    if (miningPendingEl) {

        miningPendingEl.textContent =
            pendingClaimLocal.toFixed(4);
    }


    if (btnClaimMining) {

        btnClaimMining.disabled =
            pendingClaimLocal <= 0;
    }

}


// ============================================================================
// CLICK CRYSTAL
// ============================================================================

if (clickCrystal) {

    clickCrystal.addEventListener(
        "click",
        event => {

            localClicks += 1;


            if (localClicksEl) {

                localClicksEl.textContent =
                    localClicks;
            }


            createClickParticle(
                event
            );
        }
    );

}


// ============================================================================
// CLICK PARTICLE
// ============================================================================

function createClickParticle(event) {

    if (!clickCrystal) {
        return;
    }


    const rect =
        clickCrystal.getBoundingClientRect();


    const x =
        event.clientX ||
        (
            rect.left +
            rect.width / 2
        );


    const y =
        event.clientY ||
        (
            rect.top +
            rect.height / 2
        );


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


    setTimeout(
        () => {
            floating.remove();
        },
        800
    );

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

        txEmptyRow.classList.add(
            "hidden"
        );
    }


    transactionsCount++;


    if (txCountEl) {

        txCountEl.textContent =
            `${transactionsCount} Transaction${
                transactionsCount > 1
                    ? "s"
                    : ""
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


    let statusBadge;


    if (status === "pending") {

        statusBadge =
            `<span class="tx-status-badge pending">
                <i class="fa-solid fa-spinner fa-spin"></i>
                Pending
            </span>`;

    } else if (status === "success") {

        statusBadge =
            `<span class="tx-status-badge success">
                <i class="fa-solid fa-circle-check"></i>
                Success
            </span>`;

    } else {

        statusBadge =
            `<span class="tx-status-badge failed">
                <i class="fa-solid fa-circle-xmark"></i>
                Failed
            </span>`;
    }


    const explorerUrl =
        currentChainId === ARC_MAINNET_CHAIN_ID
            ? `https://arc.exploreme.pro/tx/${txHash}`
            : "#";


    const txLink =
        txHash !== "N/A"
            ? `<a href="${explorerUrl}"
                 target="_blank"
                 rel="noopener noreferrer"
                 class="monospace text-glow-blue">
                 ${txHash.substring(0, 10)}...
               </a>`
            : `<span class="text-muted">N/A</span>`;


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
            `<span class="tx-status-badge success">
                <i class="fa-solid fa-circle-check"></i>
                Success
             </span>`;

    } else {

        statusTd.innerHTML =
            `<span class="tx-status-badge failed">
                <i class="fa-solid fa-circle-xmark"></i>
                Failed
             </span>`;
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

            if (!btnSetUsername) {
                return;
            }


            btnSetUsername.disabled =
                !contract ||
                usernameInput.value
                    .trim()
                    .length === 0;
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


            if (
                !name ||
                name.length > 20
            ) {

                alert(
                    "Username must be 1-20 characters."
                );

                return;
            }


            btnSetUsername.disabled =
                true;


            const logRow =
                logTransaction(
                    "Set Username",
                    "N/A",
                    "pending"
                );


            try {

                const tx =
                    await contract.setUsername(
                        name
                    );


                if (logRow) {

                    logRow.cells[4].innerHTML =
                        `<a href="https://arc.exploreme.pro/tx/${tx.hash}"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="monospace text-glow-blue">
                            ${tx.hash.substring(0, 10)}...
                         </a>`;
                }


                const receipt =
                    await tx.wait();


                updateTransactionLog(
                    logRow,
                    "success",
                    `Gas used: ${receipt.gasUsed.toString()}`
                );


                usernameInput.value =
                    "";


                await fetchPlayerProfile();

            } catch (error) {

                console.error(
                    "Set username error:",
                    error
                );


                updateTransactionLog(
                    logRow,
                    "failed",
                    getErrorMessage(error)
                );


                btnSetUsername.disabled =
                    false;
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


            btnUpgradeClick.disabled =
                true;


            try {

                const cost =
                    await contract.getClickUpgradeCost(
                        profileState.clickLevel
                    );


                const approved =
                    await ensureApproval(
                        cost
                    );


                if (!approved) {

                    btnUpgradeClick.disabled =
                        false;

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
                    `<a href="https://arc.exploreme.pro/tx/${tx.hash}"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="monospace text-glow-blue">
                        ${tx.hash.substring(0, 10)}...
                     </a>`;


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


                btnUpgradeClick.disabled =
                    false;
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


            btnUpgradeMiner.disabled =
                true;


            try {

                const cost =
                    await contract.getUpgradeCost(
                        profileState.minerLevel
                    );


                const approved =
                    await ensureApproval(
                        cost
                    );


                if (!approved) {

                    btnUpgradeMiner.disabled =
                        false;

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
                    `<a href="https://arc.exploreme.pro/tx/${tx.hash}"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="monospace text-glow-blue">
                        ${tx.hash.substring(0, 10)}...
                     </a>`;


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


                btnUpgradeMiner.disabled =
                    false;
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


            btnClaimMining.disabled =
                true;


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
                    `<a href="https://arc.exploreme.pro/tx/${tx.hash}"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="monospace text-glow-blue">
                        ${tx.hash.substring(0, 10)}...
                     </a>`;


                const receipt =
                    await tx.wait();


                updateTransactionLog(
                    logRow,
                    "success",
                    `Gas used: ${receipt.gasUsed.toString()}`
                );


                localClicks =
                    0;


                if (localClicksEl) {
                    localClicksEl.textContent =
                        "0";
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
                    getErrorMessage(error)
                );


                btnClaimMining.disabled =
                    false;
            }

        }
    );

}


// ============================================================================
// BET HEADS
// ============================================================================

if (btnBetHeads) {

    btnBetHeads.addEventListener(
        "click",
        () => {

            betChoice =
                "heads";


            btnBetHeads.classList.add(
                "active"
            );


            if (btnBetTails) {

                btnBetTails.classList.remove(
                    "active"
                );
            }

        }
    );

}


// ============================================================================
// BET TAILS
// ============================================================================

if (btnBetTails) {

    btnBetTails.addEventListener(
        "click",
        () => {

            betChoice =
                "tails";


            btnBetTails.classList.add(
                "active"
            );


            if (btnBetHeads) {

                btnBetHeads.classList.remove(
                    "active"
                );
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

            if (
                profileState.balance <=
                0n
            ) {
                return;
            }


            const balance =
                parseFloat(
                    ethers.formatEther(
                        profileState.balance
                    )
                );


            const rounded =
                Math.floor(
                    balance / 10
                ) * 10;


            if (betAmountInput) {

                betAmountInput.value =
                    Math.max(
                        10,
                        rounded
                    );
            }

        }
    );

}


// ============================================================================
// COIN FLIP
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


            btnRoll.disabled =
                true;


            const approved =
                await ensureApproval(
                    betWei
                );


            if (!approved) {

                btnRoll.disabled =
                    false;

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


                if (logRow) {

                    logRow.cells[4].innerHTML =
                        `<a href="https://arc.exploreme.pro/tx/${tx.hash}"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="monospace text-glow-blue">
                            ${tx.hash.substring(0, 10)}...
                         </a>`;
                }


                const receipt =
                    await tx.wait();


                updateTransactionLog(
                    logRow,
                    "success",
                    `Gas used: ${receipt.gasUsed.toString()}`
                );


                // ------------------------------------------------------------
                // PARSE EVENT
                // ------------------------------------------------------------

                let won = false;
                let payout = 0n;


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
                            "CoinFlipResult"
                        ) {

                            won =
                                Boolean(
                                    parsed.args.won
                                );

                            payout =
                                parsed.args.payout;
                        }

                    } catch (e) {

                        // Ignore unrelated logs
                    }
                }


                const landedHeads =
                    (
                        isHeadsBet &&
                        won
                    ) ||
                    (
                        !isHeadsBet &&
                        !won
                    );


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


                        if (flipStatusMsg) {

                            if (won) {

                                flipStatusMsg.className =
                                    "flip-status-message won";

                                flipStatusMsg.innerHTML =
                                    `<i class="fa-solid fa-trophy"></i>
                                     YOU WON!
                                     Received
                                     ${ethers.formatEther(payout)}
                                     $CPLAY!`;

                            } else {

                                flipStatusMsg.className =
                                    "flip-status-message lost";

                                flipStatusMsg.innerHTML =
                                    `<i class="fa-solid fa-face-frown"></i>
                                     YOU LOST!
                                     Better luck next roll.`;
                            }

                        }


                        await fetchPlayerProfile();


                        btnRoll.disabled =
                            !profileState.luckyFlipEnabled ||
                            profileState.balance <
                                ethers.parseEther("10");

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
                    getErrorMessage(error)
                );


                if (flipStatusMsg) {

                    flipStatusMsg.className =
                        "flip-status-message lost";

                    flipStatusMsg.textContent =
                        "Transaction failed or rejected.";
                }


                btnRoll.disabled =
                    false;
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
            "Approval failed: contracts not initialized."
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
            "Current allowance:",
            currentAllowance.toString()
        );


        console.log(
            "Required:",
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
            `<a href="https://arc.exploreme.pro/tx/${tx.hash}"
                target="_blank"
                rel="noopener noreferrer"
                class="monospace text-glow-blue">
                ${tx.hash.substring(0, 10)}...
             </a>`;


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
// LEADERBOARD
// ============================================================================
//
// IMPORTANT:
// Disabled by default.
//
// The old implementation scanned thousands/millions of blocks with
// eth_getLogs. This is NOT necessary for the game to work and can cause
// RPC errors.
//

async function loadLeaderboard() {

    console.log(
        "Leaderboard scanning disabled."
    );


    if (leaderboardTbody) {

        leaderboardTbody.innerHTML =
            `<tr>
                <td colspan="3"
                    class="leaderboard-empty">
                    Leaderboard temporarily disabled.
                </td>
             </tr>`;
    }

}


// ============================================================================
// DISCONNECT BUTTON
// ============================================================================

if (btnDisconnect) {

    btnDisconnect.addEventListener(
        "click",
        disconnectWallet
    );
}


// ============================================================================
// NETWORK BUTTON
// ============================================================================

if (btnSwitchNetwork) {

    btnSwitchNetwork.addEventListener(
        "click",
        switchNetwork
    );
}


// ============================================================================
// CONNECT BUTTON
// ============================================================================

if (btnConnect) {

    btnConnect.addEventListener(
        "click",
        connectWallet
    );
}


// ============================================================================
// BACKGROUND PARTICLES
// ============================================================================

const canvas =
    document.getElementById(
        "bg-canvas"
    );


let ctx = null;
let particles = [];


if (canvas) {

    ctx =
        canvas.getContext("2d");


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


            if (
                this.y < 0
            ) {

                this.y =
                    canvas.height;

                this.x =
                    Math.random() *
                    canvas.width;
            }


            if (
                this.x < 0 ||
                this.x >
                    canvas.width
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
            particle => {

                particle.update();
                particle.draw();

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
    "========================================"
);

console.log(
    "Arc Cyber Miner starting..."
);

console.log(
    "Game contract:",
    DEFAULT_CONTRACTS["5042"]
);

console.log(
    "CPLAY token:",
    CPLAY_TOKEN_ADDRESS["5042"]
);

console.log(
    "========================================"
);


initWeb3();
