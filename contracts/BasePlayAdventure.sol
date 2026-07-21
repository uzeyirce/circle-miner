// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title BasePlayAdventure
 * @dev An ERC20 token ($CPLAY) combined with an idle mining and betting game.
 * Deployed on Arc Testnet.
 *
 * TOKENOMICS: Fixed supply of 1,000,000,000 CPLAY, minted once at deployment
 * directly to this contract (acts as the reward pool / treasury). No _mint()
 * calls exist anywhere else in this contract — faucet claims, mining rewards,
 * and coin-flip payouts are all paid OUT of this pool via _transfer(), and
 * upgrade costs / losing bets are paid INTO this pool. Total supply never
 * changes after deployment.
 */
contract BasePlayAdventure is ERC20, ERC20Burnable, Ownable {
    // Faucet settings
    uint256 public constant FAUCET_AMOUNT = 1000 * 10**18;
    uint256 public constant FAUCET_COOLDOWN = 1 hours;
    mapping(address => uint256) public lastFaucetClaim;

    // Idle Mining settings
    // Base mining rate: 0.01 CPLAY per second per level
    uint256 public constant BASE_MINING_RATE = 1 * 10**16;

    struct MinerState {
        uint256 level;
        uint256 lastClaimTime;
    }
    mapping(address => MinerState) public minerStates;

    // Click Upgrade settings
    mapping(address => uint256) public clickLevels;

    // Total fixed supply, minted once to this contract at deploy time.
    uint256 public constant TOTAL_SUPPLY = 1_000_000_000 * 10**18;

    // Events
    event FaucetClaimed(address indexed player, uint256 amount);
    event MinerUpgraded(address indexed player, uint256 newLevel, uint256 cost);
    event ClickUpgraded(address indexed player, uint256 newLevel, uint256 cost);
    event MiningClaimed(address indexed player, uint256 amount);
    event CoinFlipResult(
        address indexed player,
        bool betHeads,
        bool won,
        uint256 betAmount,
        uint256 payout,
        uint256 seed
    );
    event PoolWithdraw(address indexed to, uint256 amount);

    constructor() ERC20("CirclePlay Token", "CPLAY") Ownable(msg.sender) {
        // Mint the entire fixed supply to the contract itself. This is the
        // ONLY _mint() call that will ever happen. The contract acts as the
        // reward pool that faucet / mining / coin-flip payouts draw from.
        _mint(address(this), TOTAL_SUPPLY);
    }

    /**
     * @dev Claim free $CPLAY tokens from the faucet (paid from the pool).
     */
    function claimFaucet() external {
        require(
            block.timestamp >= lastFaucetClaim[msg.sender] + FAUCET_COOLDOWN,
            "Faucet cooldown active. Wait 1 hour."
        );
        require(balanceOf(address(this)) >= FAUCET_AMOUNT, "Faucet pool is empty");

        lastFaucetClaim[msg.sender] = block.timestamp;
        _transfer(address(this), msg.sender, FAUCET_AMOUNT);
        emit FaucetClaimed(msg.sender, FAUCET_AMOUNT);
    }

    /**
     * @dev Calculate cost to upgrade miner rig.
     */
    function getUpgradeCost(uint256 currentLevel) public pure returns (uint256) {
        return (currentLevel + 1) * 100 * 10**18; // 100 CPLAY base * level
    }

    /**
     * @dev Buy passive miner upgrade. Cost is paid INTO the pool (not burned).
     */
    function buyMinerUpgrade() external {
        uint256 currentLevel = minerStates[msg.sender].level;
        uint256 cost = getUpgradeCost(currentLevel);

        require(balanceOf(msg.sender) >= cost, "Insufficient CPLAY balance for upgrade");

        // Claim accumulated rewards before upgrading level
        _claimMiningInternal(msg.sender);

        // Send the upgrade cost into the reward pool (no burn — fixed supply)
        _transfer(msg.sender, address(this), cost);

        // Increment miner level and reset timer
        minerStates[msg.sender].level += 1;
        minerStates[msg.sender].lastClaimTime = block.timestamp;

        emit MinerUpgraded(msg.sender, minerStates[msg.sender].level, cost);
    }

    /**
     * @dev Calculate cost to upgrade click power.
     */
    function getClickUpgradeCost(uint256 currentLevel) public pure returns (uint256) {
        return (currentLevel + 1) * 50 * 10**18; // 50 CPLAY base * level
    }

    /**
     * @dev Buy click multiplier upgrade. Cost is paid INTO the pool (not burned).
     */
    function buyClickUpgrade() external {
        uint256 currentLevel = clickLevels[msg.sender];
        uint256 cost = getClickUpgradeCost(currentLevel);

        require(balanceOf(msg.sender) >= cost, "Insufficient CPLAY balance for upgrade");

        _transfer(msg.sender, address(this), cost);

        clickLevels[msg.sender] += 1;

        emit ClickUpgraded(msg.sender, clickLevels[msg.sender], cost);
    }

    /**
     * @dev Claim accumulated mining rewards.
     */
    function claimMining() external {
        _claimMiningInternal(msg.sender);
    }

    /**
     * @dev Internal function to handle mining rewards claiming, paid from the pool.
     * If the pool has less than the accrued reward, pays out whatever is
     * available rather than reverting (graceful degradation instead of
     * locking players out entirely if the pool runs low).
     */
    function _claimMiningInternal(address player) internal {
        MinerState storage state = minerStates[player];
        if (state.level == 0) {
            state.lastClaimTime = block.timestamp;
            return;
        }

        uint256 timeElapsed = block.timestamp - state.lastClaimTime;
        if (timeElapsed == 0) {
            return;
        }

        uint256 reward = timeElapsed * state.level * BASE_MINING_RATE;
        state.lastClaimTime = block.timestamp;

        if (reward == 0) {
            return;
        }

        uint256 poolBalance = balanceOf(address(this));
        uint256 payoutAmount = reward > poolBalance ? poolBalance : reward;

        if (payoutAmount > 0) {
            _transfer(address(this), player, payoutAmount);
            emit MiningClaimed(player, payoutAmount);
        }
    }

    /**
     * @dev Get accumulated rewards pending claim.
     */
    function pendingMiningRewards(address player) public view returns (uint256) {
        MinerState memory state = minerStates[player];
        if (state.level == 0 || state.lastClaimTime == 0) {
            return 0;
        }
        uint256 timeElapsed = block.timestamp - state.lastClaimTime;
        return timeElapsed * state.level * BASE_MINING_RATE;
    }

    /**
     * @dev Roll an on-chain coin flip bet using $CPLAY tokens.
     * The bet is moved into the pool up front; if the player wins, the pool
     * pays out 2x the bet. The pool must already hold at least `betAmount`
     * BEFORE the bet is accepted, guaranteeing it can always cover a win
     * without ever needing to mint new tokens.
     * @param betHeads true to bet Heads, false to bet Tails.
     * @param betAmount quantity of $CPLAY to bet.
     */
    function coinFlip(bool betHeads, uint256 betAmount) external returns (bool) {
        require(betAmount >= 10 * 10**18, "Minimum bet is 10 CPLAY");
        require(balanceOf(msg.sender) >= betAmount, "Insufficient balance to place bet");
        require(
            balanceOf(address(this)) >= betAmount,
            "Pool cannot safely cover this bet right now, try a smaller amount"
        );

        // Move the bet into the pool up front (no burn — fixed supply)
        _transfer(msg.sender, address(this), betAmount);

        // Generate pseudo-random result on-chain using block properties.
        // NOTE: this is NOT secure randomness (manipulable by validators/
        // sequencers) — fine for testnet play money, must be replaced with
        // a verifiable randomness source (e.g. Chainlink VRF) before any
        // mainnet deployment that carries real value.
        uint256 seed = uint256(
            keccak256(
                abi.encodePacked(
                    block.timestamp,
                    block.prevrandao,
                    msg.sender,
                    block.number
                )
            )
        );
        bool resultIsHeads = (seed % 2 == 0);
        bool won = (betHeads == resultIsHeads);

        uint256 payout = 0;
        if (won) {
            payout = betAmount * 2;
            _transfer(address(this), msg.sender, payout);
        }

        emit CoinFlipResult(msg.sender, betHeads, won, betAmount, payout, seed);
        return won;
    }

    /**
     * @dev Owner-only: withdraw from the pool (e.g. to seed DEX liquidity or
     * cover operational costs). Cannot exceed the pool's current balance —
     * this can only move existing supply around, it can never create new
     * tokens.
     */
    function ownerWithdrawPool(uint256 amount) external onlyOwner {
        require(balanceOf(address(this)) >= amount, "Insufficient pool balance");
        _transfer(address(this), owner(), amount);
        emit PoolWithdraw(owner(), amount);
    }

    /**
     * @dev Helper function for the web app to check a player's full profile state in 1 call.
     */
    function getPlayerProfile(address player) external view returns (
        uint256 balance,
        uint256 faucetCooldownLeft,
        uint256 minerLevel,
        uint256 clickLevel,
        uint256 pendingRewards
    ) {
        balance = balanceOf(player);

        uint256 nextFaucet = lastFaucetClaim[player] + FAUCET_COOLDOWN;
        faucetCooldownLeft = block.timestamp >= nextFaucet ? 0 : nextFaucet - block.timestamp;

        minerLevel = minerStates[player].level;
        clickLevel = clickLevels[player];
        pendingRewards = pendingMiningRewards(player);
    }

    /**
     * @dev Current pool balance — how much CPLAY is left to pay out.
     */
    function poolBalance() external view returns (uint256) {
        return balanceOf(address(this));
    }
}

