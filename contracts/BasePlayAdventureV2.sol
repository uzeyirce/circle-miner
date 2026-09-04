// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface ICPlayVault {
    function payout(address to, uint256 amount) external;
    function vaultBalance() external view returns (uint256);
}

/**
 * @title BasePlayAdventureV2 — Circle Miner Game Engine
 *
 * Changes from V1:
 *  - Economy parameters are OWNER-CONFIGURABLE (no redeploy needed to tune)
 *  - Feature flags are real state variables → emergency kill switch works
 *  - Coin flip uses COMMIT-REVEAL randomness (block producer can no longer
 *    see the outcome before including the tx)
 *  - Faucet is live and configurable
 *  - Mining rewards that get clipped by a low vault are tracked as debt
 *    instead of silently vanishing
 *  - ReentrancyGuard on all value-moving functions
 *  - Owner can migrate player state from the V1 contract
 *
 * The CPLAY token itself is unchanged — this contract only replaces game logic.
 */
contract BasePlayAdventureV2 is Ownable, ReentrancyGuard {
    IERC20 public immutable cplayToken;
    ICPlayVault public immutable vault;

    // ---- Feature flags (mutable → kill switch) ----
    bool public circleMinerEnabled = true;
    bool public luckyFlipEnabled = true;
    bool public faucetEnabled = true;

    // ---- Protocol fee split (configurable) ----
    uint256 public protocolFeeBps = 1000; // 10% owner / 90% vault
    uint256 public constant BPS_DENOMINATOR = 10000;

    // ---- Coin flip (configurable) ----
    uint256 public coinflipPayoutBps = 17000; // 1.7x
    uint256 public minBet = 10 * 10**18;

    // ---- Mining economy (configurable — this is what V1 could never change) ----
    uint256 public baseMiningRate = 5 * 10**15; // 0.005 CPLAY/sec/level (5x V1)
    uint256 public minerUpgradeBase = 100 * 10**18;
    uint256 public clickUpgradeBase = 50 * 10**18;
    uint256 public clickBonusPercent = 10; // +10% mining per click level

    // ---- Faucet (configurable) ----
    uint256 public faucetAmount = 20 * 10**18;
    mapping(address => bool) public hasClaimedFaucet;

    // ---- Player state ----
    struct MinerState {
        uint256 level;
        uint256 lastClaimTime;
    }
    mapping(address => MinerState) public minerStates;
    mapping(address => uint256) public clickLevels;
    mapping(address => string) public usernames;
    mapping(address => uint256) public totalWinnings;

    // Rewards owed but not paid because the vault was low (V1 silently dropped these)
    mapping(address => uint256) public miningDebt;

    // ---- Commit-reveal for coin flip ----
    struct FlipCommit {
        bytes32 commitHash;
        uint256 betAmount;
        bool betHeads;
        uint256 commitBlock;
        bool settled;
    }
    mapping(address => FlipCommit) public pendingFlips;
    uint256 public revealDelayBlocks = 1;   // must reveal at least this many blocks later
    uint256 public revealWindowBlocks = 256; // blockhash is only available for ~256 blocks

    // ---- Events ----
    event MinerUpgraded(address indexed player, uint256 newLevel, uint256 cost, uint256 devFee, uint256 vaultShare);
    event ClickUpgraded(address indexed player, uint256 newLevel, uint256 cost, uint256 devFee, uint256 vaultShare);
    event MiningClaimed(address indexed player, uint256 earned, uint256 paid, uint256 debtAdded);
    event FaucetClaimed(address indexed player, uint256 amount);
    event UsernameSet(address indexed player, string username);
    event FlipCommitted(address indexed player, bool betHeads, uint256 betAmount, uint256 commitBlock);
    event CoinFlipResult(
        address indexed player,
        bool betHeads,
        bool won,
        uint256 betAmount,
        uint256 devFee,
        uint256 payout,
        uint256 seed
    );
    event ConfigChanged(string key, uint256 value);
    event FeatureToggled(string feature, bool enabled);
    event PlayerMigrated(address indexed player, uint256 minerLevel, uint256 clickLevel, uint256 winnings);

    constructor(address tokenAddress, address vaultAddress) Ownable(msg.sender) {
        require(tokenAddress != address(0), "Invalid token address");
        require(vaultAddress != address(0), "Invalid vault address");
        cplayToken = IERC20(tokenAddress);
        vault = ICPlayVault(vaultAddress);
    }

    // ==========================================================================
    // OWNER CONTROLS — kill switch + economy tuning (the whole point of V2)
    // ==========================================================================

    function setCircleMinerEnabled(bool v) external onlyOwner { circleMinerEnabled = v; emit FeatureToggled("circleMiner", v); }
    function setLuckyFlipEnabled(bool v) external onlyOwner { luckyFlipEnabled = v; emit FeatureToggled("luckyFlip", v); }
    function setFaucetEnabled(bool v) external onlyOwner { faucetEnabled = v; emit FeatureToggled("faucet", v); }

    /// @dev Halts everything at once. Use if an exploit is suspected.
    function emergencyPause() external onlyOwner {
        circleMinerEnabled = false;
        luckyFlipEnabled = false;
        faucetEnabled = false;
        emit FeatureToggled("ALL", false);
    }

    function setBaseMiningRate(uint256 v) external onlyOwner { baseMiningRate = v; emit ConfigChanged("baseMiningRate", v); }
    function setMinerUpgradeBase(uint256 v) external onlyOwner { minerUpgradeBase = v; emit ConfigChanged("minerUpgradeBase", v); }
    function setClickUpgradeBase(uint256 v) external onlyOwner { clickUpgradeBase = v; emit ConfigChanged("clickUpgradeBase", v); }
    function setClickBonusPercent(uint256 v) external onlyOwner { require(v <= 100, "Max 100%"); clickBonusPercent = v; emit ConfigChanged("clickBonusPercent", v); }
    function setFaucetAmount(uint256 v) external onlyOwner { faucetAmount = v; emit ConfigChanged("faucetAmount", v); }
    function setMinBet(uint256 v) external onlyOwner { require(v > 0, "Min bet must be > 0"); minBet = v; emit ConfigChanged("minBet", v); }

    function setProtocolFeeBps(uint256 v) external onlyOwner {
        require(v <= 2000, "Fee cannot exceed 20%"); // hard cap protects players
        protocolFeeBps = v;
        emit ConfigChanged("protocolFeeBps", v);
    }

    function setCoinflipPayoutBps(uint256 v) external onlyOwner {
        require(v >= 10000 && v <= 20000, "Payout must be between 1x and 2x");
        coinflipPayoutBps = v;
        emit ConfigChanged("coinflipPayoutBps", v);
    }

    function setRevealDelayBlocks(uint256 v) external onlyOwner {
        require(v >= 1 && v <= 10, "Delay must be 1-10 blocks");
        revealDelayBlocks = v;
        emit ConfigChanged("revealDelayBlocks", v);
    }

    // ==========================================================================
    // MIGRATION — owner copies player state over from V1. One-way, owner-only.
    // ==========================================================================

    function migratePlayers(
        address[] calldata players,
        uint256[] calldata minerLevels,
        uint256[] calldata clickLevelsIn,
        uint256[] calldata winnings
    ) external onlyOwner {
        require(
            players.length == minerLevels.length &&
            players.length == clickLevelsIn.length &&
            players.length == winnings.length,
            "Array length mismatch"
        );
        for (uint256 i = 0; i < players.length; i++) {
            address p = players[i];
            minerStates[p].level = minerLevels[i];
            minerStates[p].lastClaimTime = block.timestamp; // start accruing from now
            clickLevels[p] = clickLevelsIn[i];
            totalWinnings[p] = winnings[i];
            emit PlayerMigrated(p, minerLevels[i], clickLevelsIn[i], winnings[i]);
        }
    }

    function migrateUsernames(address[] calldata players, string[] calldata names) external onlyOwner {
        require(players.length == names.length, "Array length mismatch");
        for (uint256 i = 0; i < players.length; i++) {
            usernames[players[i]] = names[i];
            emit UsernameSet(players[i], names[i]);
        }
    }

    // ==========================================================================
    // INTERNAL
    // ==========================================================================

    function _splitToOwnerAndVault(uint256 amount) internal returns (uint256 devFee, uint256 vaultShare) {
        devFee = (amount * protocolFeeBps) / BPS_DENOMINATOR;
        vaultShare = amount - devFee;
        require(cplayToken.transferFrom(msg.sender, owner(), devFee), "Fee transfer failed");
        require(cplayToken.transferFrom(msg.sender, address(vault), vaultShare), "Vault transfer failed");
    }

    // ==========================================================================
    // LUCKY FLIP — commit-reveal. Two transactions, but the outcome can no
    // longer be predicted or censored by whoever produces the block.
    // ==========================================================================

    /**
     * @dev Step 1. Player commits to a bet with a hash of their secret.
     * The bet amount is taken now; the outcome is unknown to everyone,
     * including the block producer, because it depends on a future blockhash
     * AND a secret only the player knows.
     *
     * commitHash = keccak256(abi.encodePacked(secret, msg.sender))
     */
    function commitFlip(bool betHeads, uint256 betAmount, bytes32 commitHash) external nonReentrant {
        require(luckyFlipEnabled, "Lucky Flip is not currently active");
        require(betAmount >= minBet, "Bet below minimum");
        require(commitHash != bytes32(0), "Invalid commit hash");
        require(pendingFlips[msg.sender].settled || pendingFlips[msg.sender].commitHash == bytes32(0), "Settle your previous flip first");

        uint256 payoutAmount = (betAmount * coinflipPayoutBps) / BPS_DENOMINATOR;
        require(vault.vaultBalance() >= payoutAmount, "Vault cannot cover this bet right now, try smaller");

        _splitToOwnerAndVault(betAmount);

        pendingFlips[msg.sender] = FlipCommit({
            commitHash: commitHash,
            betAmount: betAmount,
            betHeads: betHeads,
            commitBlock: block.number,
            settled: false
        });

        emit FlipCommitted(msg.sender, betHeads, betAmount, block.number);
    }

    /**
     * @dev Step 2. Player reveals their secret. The outcome mixes the secret
     * with a blockhash that did not exist when the commit was made.
     */
    function revealFlip(bytes32 secret) external nonReentrant returns (bool won) {
        FlipCommit storage c = pendingFlips[msg.sender];
        require(c.commitHash != bytes32(0) && !c.settled, "No pending flip");
        require(keccak256(abi.encodePacked(secret, msg.sender)) == c.commitHash, "Secret does not match commit");
        require(block.number > c.commitBlock + revealDelayBlocks, "Too early to reveal");
        require(block.number <= c.commitBlock + revealWindowBlocks, "Reveal window expired");

        bytes32 futureHash = blockhash(c.commitBlock + revealDelayBlocks);
        require(futureHash != bytes32(0), "Block hash unavailable, reveal expired");

        uint256 seed = uint256(keccak256(abi.encodePacked(secret, futureHash, msg.sender)));
        bool resultIsHeads = (seed % 2 == 0);
        won = (c.betHeads == resultIsHeads);

        c.settled = true;

        uint256 devFee = (c.betAmount * protocolFeeBps) / BPS_DENOMINATOR;
        uint256 actualPayout = 0;

        if (won) {
            actualPayout = (c.betAmount * coinflipPayoutBps) / BPS_DENOMINATOR;
            totalWinnings[msg.sender] += actualPayout; // effects before interaction
            vault.payout(msg.sender, actualPayout);
        }

        emit CoinFlipResult(msg.sender, c.betHeads, won, c.betAmount, devFee, actualPayout, seed);
        return won;
    }

    /**
     * @dev If a player never reveals (or misses the window), the bet is simply
     * lost to the vault — same as losing. This clears their slot so they can
     * play again.
     */
    function forfeitExpiredFlip() external {
        FlipCommit storage c = pendingFlips[msg.sender];
        require(c.commitHash != bytes32(0) && !c.settled, "No pending flip");
        require(block.number > c.commitBlock + revealWindowBlocks, "Flip has not expired yet");
        c.settled = true;
        emit CoinFlipResult(msg.sender, c.betHeads, false, c.betAmount, 0, 0, 0);
    }

    // ==========================================================================
    // USERNAME
    // ==========================================================================

    function setUsername(string calldata newUsername) external {
        bytes memory nameBytes = bytes(newUsername);
        require(nameBytes.length > 0 && nameBytes.length <= 20, "Username must be 1-20 characters");
        usernames[msg.sender] = newUsername;
        emit UsernameSet(msg.sender, newUsername);
    }

    // ==========================================================================
    // FAUCET — now actually live
    // ==========================================================================

    function claimFaucet() external nonReentrant {
        require(faucetEnabled, "Faucet is not currently active");
        require(!hasClaimedFaucet[msg.sender], "Faucet already claimed");
        require(vault.vaultBalance() >= faucetAmount, "Vault is empty, try again later");

        hasClaimedFaucet[msg.sender] = true;
        vault.payout(msg.sender, faucetAmount);

        emit FaucetClaimed(msg.sender, faucetAmount);
    }

    // ==========================================================================
    // CIRCLE MINER
    // ==========================================================================

    function getUpgradeCost(uint256 currentLevel) public view returns (uint256) {
        return (currentLevel + 1) * minerUpgradeBase;
    }

    function getClickUpgradeCost(uint256 currentLevel) public view returns (uint256) {
        return (currentLevel + 1) * clickUpgradeBase;
    }

    function buyMinerUpgrade() external nonReentrant {
        require(circleMinerEnabled, "Circle Miner is not currently active");
        uint256 cost = getUpgradeCost(minerStates[msg.sender].level);
        require(cplayToken.balanceOf(msg.sender) >= cost, "Insufficient CPLAY balance");
        require(cplayToken.allowance(msg.sender, address(this)) >= cost, "Approve CPLAY spend first");

        _claimMiningInternal(msg.sender);
        (uint256 devFee, uint256 vaultShare) = _splitToOwnerAndVault(cost);

        minerStates[msg.sender].level += 1;
        minerStates[msg.sender].lastClaimTime = block.timestamp;

        emit MinerUpgraded(msg.sender, minerStates[msg.sender].level, cost, devFee, vaultShare);
    }

    function buyClickUpgrade() external nonReentrant {
        require(circleMinerEnabled, "Circle Miner is not currently active");
        uint256 cost = getClickUpgradeCost(clickLevels[msg.sender]);
        require(cplayToken.balanceOf(msg.sender) >= cost, "Insufficient CPLAY balance");
        require(cplayToken.allowance(msg.sender, address(this)) >= cost, "Approve CPLAY spend first");

        _claimMiningInternal(msg.sender); // settle at old rate before boosting

        (uint256 devFee, uint256 vaultShare) = _splitToOwnerAndVault(cost);
        clickLevels[msg.sender] += 1;

        emit ClickUpgraded(msg.sender, clickLevels[msg.sender], cost, devFee, vaultShare);
    }

    function claimMining() external nonReentrant {
        require(circleMinerEnabled, "Circle Miner is not currently active");
        _claimMiningInternal(msg.sender);
    }

    /**
     * @dev Unlike V1, anything the vault could not cover is recorded as debt
     * and paid out on a later claim instead of vanishing.
     */
    function _claimMiningInternal(address player) internal {
        MinerState storage state = minerStates[player];
        if (state.level == 0) {
            state.lastClaimTime = block.timestamp;
            return;
        }

        uint256 timeElapsed = block.timestamp - state.lastClaimTime;
        state.lastClaimTime = block.timestamp;

        uint256 baseReward = timeElapsed * state.level * baseMiningRate;
        uint256 clickBonus = (baseReward * clickLevels[player] * clickBonusPercent) / 100;
        uint256 earned = baseReward + clickBonus + miningDebt[player];

        if (earned == 0) return;

        uint256 vaultBal = vault.vaultBalance();
        uint256 paid = earned > vaultBal ? vaultBal : earned;
        uint256 unpaid = earned - paid;

        miningDebt[player] = unpaid;

        if (paid > 0) {
            vault.payout(player, paid);
        }

        emit MiningClaimed(player, earned, paid, unpaid);
    }

    function pendingMiningRewards(address player) public view returns (uint256) {
        MinerState memory state = minerStates[player];
        if (state.level == 0 || state.lastClaimTime == 0) return miningDebt[player];
        uint256 timeElapsed = block.timestamp - state.lastClaimTime;
        uint256 baseReward = timeElapsed * state.level * baseMiningRate;
        uint256 clickBonus = (baseReward * clickLevels[player] * clickBonusPercent) / 100;
        return baseReward + clickBonus + miningDebt[player];
    }

    // ==========================================================================
    // VIEWS
    // ==========================================================================

    /// @dev Same 11-value shape as V1 so the existing frontend decoder still works.
    function getPlayerProfile(address player) external view returns (
        uint256 balance,
        bool circleMinerEnabled_,
        bool luckyFlipEnabled_,
        uint256 allowanceGiven,
        uint256 vaultBalanceNow,
        string memory username,
        uint256 playerTotalWinnings,
        bool faucetClaimed,
        uint256 minerLevel,
        uint256 clickLevel,
        uint256 pendingRewards
    ) {
        balance = cplayToken.balanceOf(player);
        circleMinerEnabled_ = circleMinerEnabled;
        luckyFlipEnabled_ = luckyFlipEnabled;
        allowanceGiven = cplayToken.allowance(player, address(this));
        vaultBalanceNow = vault.vaultBalance();
        username = usernames[player];
        playerTotalWinnings = totalWinnings[player];
        faucetClaimed = hasClaimedFaucet[player];
        minerLevel = minerStates[player].level;
        clickLevel = clickLevels[player];
        pendingRewards = pendingMiningRewards(player);
    }

    function getPendingFlip(address player) external view returns (
        bool hasPending,
        bool betHeads,
        uint256 betAmount,
        uint256 commitBlock,
        bool canReveal,
        bool expired
    ) {
        FlipCommit memory c = pendingFlips[player];
        hasPending = c.commitHash != bytes32(0) && !c.settled;
        betHeads = c.betHeads;
        betAmount = c.betAmount;
        commitBlock = c.commitBlock;
        canReveal = hasPending && block.number > c.commitBlock + revealDelayBlocks && block.number <= c.commitBlock + revealWindowBlocks;
        expired = hasPending && block.number > c.commitBlock + revealWindowBlocks;
    }
}
