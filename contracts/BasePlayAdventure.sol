// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title BasePlayAdventure — Circle Miner Game Engine
 * @dev This contract does NOT mint or own the $CPLAY token. $CPLAY is an
 * EXTERNAL ERC20 token (deployed elsewhere, e.g. via an external launcher).
 * This contract only manages game logic (faucet, idle mining, coin flip)
 * against a balance of that external token that it holds.
 *
 * FLOW
 * ----
 * 1. Owner deploys $CPLAY separately (external contract, out of our control).
 * 2. Owner deploys THIS contract, pointing it at the $CPLAY token address.
 * 3. Owner calls cplayToken.approve(thisContract, amount) on the TOKEN
 *    contract from their dev-buy wallet.
 * 4. Owner calls fundFaucetPool() / fundGamePool() on THIS contract, which
 *    pulls tokens in via transferFrom (using the approval from step 3).
 * 5. Players call cplayToken.approve(thisContract, amount) before any
 *    upgrade purchase or bet, same pattern as step 3 — standard ERC20
 *    two-step spend approval.
 *
 * Every payout (faucet, mining, coin-flip win) comes ONLY from tokens that
 * were explicitly funded into this contract this way — this contract can
 * never mint, and can never pull more than what it's been given.
 */
contract BasePlayAdventure is Ownable {
    IERC20 public immutable cplayToken;

    // ---- Faucet: one-time welcome grant, paid ONLY from its own separate pool ----
    uint256 public constant FAUCET_AMOUNT = 10 * 10**18;
    mapping(address => bool) public hasClaimedFaucet;
    uint256 public faucetPoolBalance;

    // ---- Game reward pool (mining + coin-flip), fully separate from faucet pool ----
    uint256 public gamePoolBalance;
    uint256 public constant PROTOCOL_FEE_BPS = 1000;   // 10.00% to owner
    uint256 public constant BPS_DENOMINATOR = 10000;

    // ---- Idle mining ----
    uint256 public constant BASE_MINING_RATE = 1 * 10**15; // 0.001 CPLAY/sec/level
    struct MinerState {
        uint256 level;
        uint256 lastClaimTime;
    }
    mapping(address => MinerState) public minerStates;

    // ---- Click upgrade: boosts on-chain mining reward (+10% per level) ----
    mapping(address => uint256) public clickLevels;

    // ---- Coin flip ----
    uint256 public constant COINFLIP_PAYOUT_BPS = 18000; // 1.8x payout
    uint256 public constant MIN_BET = 10 * 10**18;

    // Events
    event FaucetClaimed(address indexed player, uint256 amount);
    event FaucetPoolFunded(uint256 amount, uint256 newBalance);
    event GamePoolFunded(uint256 amount, uint256 newBalance);
    event MinerUpgraded(address indexed player, uint256 newLevel, uint256 cost, uint256 devFee, uint256 poolShare);
    event ClickUpgraded(address indexed player, uint256 newLevel, uint256 cost, uint256 devFee, uint256 poolShare);
    event MiningClaimed(address indexed player, uint256 amount);
    event CoinFlipResult(
        address indexed player,
        bool betHeads,
        bool won,
        uint256 betAmount,
        uint256 devFee,
        uint256 payout,
        uint256 seed
    );

    constructor(address tokenAddress) Ownable(msg.sender) {
        require(tokenAddress != address(0), "Invalid token address");
        cplayToken = IERC20(tokenAddress);
    }

    // ==========================================================================
    // OWNER: fund the two separate pools. Requires cplayToken.approve(this, amount)
    // to have been called first, from the SAME wallet calling these functions.
    // ==========================================================================

    function fundFaucetPool(uint256 amount) external onlyOwner {
        require(cplayToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        faucetPoolBalance += amount;
        emit FaucetPoolFunded(amount, faucetPoolBalance);
    }

    function fundGamePool(uint256 amount) external onlyOwner {
        require(cplayToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        gamePoolBalance += amount;
        emit GamePoolFunded(amount, gamePoolBalance);
    }

    // ==========================================================================
    // FAUCET — one-time welcome grant, paid ONLY from faucetPoolBalance
    // ==========================================================================

    function claimFaucet() external {
        require(!hasClaimedFaucet[msg.sender], "Welcome grant already claimed");
        require(faucetPoolBalance >= FAUCET_AMOUNT, "Faucet pool is empty");

        hasClaimedFaucet[msg.sender] = true;
        faucetPoolBalance -= FAUCET_AMOUNT;
        require(cplayToken.transfer(msg.sender, FAUCET_AMOUNT), "Transfer failed");
        emit FaucetClaimed(msg.sender, FAUCET_AMOUNT);
    }

    // ==========================================================================
    // UPGRADES — cost split 10% owner / 90% game pool.
    // Player must have called cplayToken.approve(thisContract, cost) first.
    // ==========================================================================

    function getUpgradeCost(uint256 currentLevel) public pure returns (uint256) {
        return (currentLevel + 1) * 100 * 10**18;
    }

    function getClickUpgradeCost(uint256 currentLevel) public pure returns (uint256) {
        return (currentLevel + 1) * 50 * 10**18;
    }

    function _splitIntoPool(uint256 cost) internal returns (uint256 devFee, uint256 poolShare) {
        devFee = (cost * PROTOCOL_FEE_BPS) / BPS_DENOMINATOR;
        poolShare = cost - devFee;
        require(cplayToken.transferFrom(msg.sender, owner(), devFee), "Fee transfer failed");
        require(cplayToken.transferFrom(msg.sender, address(this), poolShare), "Pool transfer failed");
        gamePoolBalance += poolShare;
    }

    function buyMinerUpgrade() external {
        uint256 currentLevel = minerStates[msg.sender].level;
        uint256 cost = getUpgradeCost(currentLevel);
        require(cplayToken.balanceOf(msg.sender) >= cost, "Insufficient CPLAY balance for upgrade");
        require(cplayToken.allowance(msg.sender, address(this)) >= cost, "Approve CPLAY spend first");

        _claimMiningInternal(msg.sender);

        (uint256 devFee, uint256 poolShare) = _splitIntoPool(cost);

        minerStates[msg.sender].level += 1;
        minerStates[msg.sender].lastClaimTime = block.timestamp;

        emit MinerUpgraded(msg.sender, minerStates[msg.sender].level, cost, devFee, poolShare);
    }

    function buyClickUpgrade() external {
        uint256 currentLevel = clickLevels[msg.sender];
        uint256 cost = getClickUpgradeCost(currentLevel);
        require(cplayToken.balanceOf(msg.sender) >= cost, "Insufficient CPLAY balance for upgrade");
        require(cplayToken.allowance(msg.sender, address(this)) >= cost, "Approve CPLAY spend first");

        (uint256 devFee, uint256 poolShare) = _splitIntoPool(cost);

        clickLevels[msg.sender] += 1;

        emit ClickUpgraded(msg.sender, clickLevels[msg.sender], cost, devFee, poolShare);
    }

    // ==========================================================================
    // IDLE MINING — paid ONLY from gamePoolBalance.
    // ==========================================================================

    function claimMining() external {
        _claimMiningInternal(msg.sender);
    }

    function _claimMiningInternal(address player) internal {
        MinerState storage state = minerStates[player];
        if (state.level == 0) {
            state.lastClaimTime = block.timestamp;
            return;
        }

        uint256 timeElapsed = block.timestamp - state.lastClaimTime;
        if (timeElapsed == 0) return;

        uint256 baseReward = timeElapsed * state.level * BASE_MINING_RATE;
        uint256 clickBonus = (baseReward * clickLevels[player] * 10) / 100; // +10% per click level
        uint256 reward = baseReward + clickBonus;

        state.lastClaimTime = block.timestamp;
        if (reward == 0) return;

        uint256 payoutAmount = reward > gamePoolBalance ? gamePoolBalance : reward;
        if (payoutAmount > 0) {
            gamePoolBalance -= payoutAmount;
            require(cplayToken.transfer(player, payoutAmount), "Transfer failed");
            emit MiningClaimed(player, payoutAmount);
        }
    }

    function pendingMiningRewards(address player) public view returns (uint256) {
        MinerState memory state = minerStates[player];
        if (state.level == 0 || state.lastClaimTime == 0) return 0;
        uint256 timeElapsed = block.timestamp - state.lastClaimTime;
        uint256 baseReward = timeElapsed * state.level * BASE_MINING_RATE;
        uint256 clickBonus = (baseReward * clickLevels[player] * 10) / 100;
        return baseReward + clickBonus;
    }

    // ==========================================================================
    // COIN FLIP — bet split 10% owner / 90% game pool up front; wins pay 1.8x
    // from the game pool. Pool depth is checked BEFORE accepting the bet.
    // Player must have called cplayToken.approve(thisContract, betAmount) first.
    // ==========================================================================

    function coinFlip(bool betHeads, uint256 betAmount) external returns (bool) {
        require(betAmount >= MIN_BET, "Minimum bet is 10 CPLAY");
        require(cplayToken.balanceOf(msg.sender) >= betAmount, "Insufficient balance to place bet");
        require(cplayToken.allowance(msg.sender, address(this)) >= betAmount, "Approve CPLAY spend first");

        uint256 payout = (betAmount * COINFLIP_PAYOUT_BPS) / BPS_DENOMINATOR;
        require(gamePoolBalance >= payout, "Pool cannot safely cover this bet right now, try a smaller amount");

        (uint256 devFee, uint256 poolShare) = _splitIntoPool(betAmount);

        uint256 seed = uint256(
            keccak256(abi.encodePacked(block.timestamp, block.prevrandao, msg.sender, block.number))
        );
        bool resultIsHeads = (seed % 2 == 0);
        bool won = (betHeads == resultIsHeads);

        uint256 actualPayout = 0;
        if (won) {
            actualPayout = payout;
            gamePoolBalance -= actualPayout;
            require(cplayToken.transfer(msg.sender, actualPayout), "Transfer failed");
        }

        emit CoinFlipResult(msg.sender, betHeads, won, betAmount, devFee, actualPayout, seed);
        return won;
    }

    // ==========================================================================
    // VIEW HELPERS
    // ==========================================================================

    function getPlayerProfile(address player) external view returns (
        uint256 balance,
        bool faucetClaimed,
        uint256 minerLevel,
        uint256 clickLevel,
        uint256 pendingRewards,
        uint256 allowanceGiven
    ) {
        balance = cplayToken.balanceOf(player);
        faucetClaimed = hasClaimedFaucet[player];
        minerLevel = minerStates[player].level;
        clickLevel = clickLevels[player];
        pendingRewards = pendingMiningRewards(player);
        allowanceGiven = cplayToken.allowance(player, address(this));
    }
}
