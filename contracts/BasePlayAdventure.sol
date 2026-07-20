// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

/**
 * @title BasePlayAdventure
 * @dev An ERC20 token ($CPLAY) combined with an idle mining and betting game.
 * Designed for Base Sepolia Testnet.
 */
contract BasePlayAdventure is ERC20, ERC20Burnable {
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

    constructor() ERC20("CirclePlay Token", "CPLAY") {
        // Mint initial supply of 1,000,000 CPLAY to the creator
        _mint(msg.sender, 1000000 * 10**18);
    }

    /**
     * @dev Claim free $CPLAY tokens from the faucet.
     */
    function claimFaucet() external {
        require(
            block.timestamp >= lastFaucetClaim[msg.sender] + FAUCET_COOLDOWN,
            "Faucet cooldown active. Wait 1 hour."
        );
        lastFaucetClaim[msg.sender] = block.timestamp;
        _mint(msg.sender, FAUCET_AMOUNT);
        emit FaucetClaimed(msg.sender, FAUCET_AMOUNT);
    }

    /**
     * @dev Calculate cost to upgrade miner rig.
     */
    function getUpgradeCost(uint256 currentLevel) public pure returns (uint256) {
        return (currentLevel + 1) * 100 * 10**18; // 100 CPLAY base * level
    }

    /**
     * @dev Buy passive miner upgrade.
     */
    function buyMinerUpgrade() external {
        uint256 currentLevel = minerStates[msg.sender].level;
        uint256 cost = getUpgradeCost(currentLevel);
        
        require(balanceOf(msg.sender) >= cost, "Insufficient CPLAY balance for upgrade");
        
        // Claim accumulated rewards before upgrading level
        _claimMiningInternal(msg.sender);
        
        // Burn the tokens spent on upgrade
        _burn(msg.sender, cost);
        
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
     * @dev Buy click multiplier upgrade.
     */
    function buyClickUpgrade() external {
        uint256 currentLevel = clickLevels[msg.sender];
        uint256 cost = getClickUpgradeCost(currentLevel);
        
        require(balanceOf(msg.sender) >= cost, "Insufficient CPLAY balance for upgrade");
        
        // Burn the tokens spent on upgrade
        _burn(msg.sender, cost);
        
        // Upgrade click level
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
     * @dev Internal function to handle mining rewards claiming.
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

        if (reward > 0) {
            _mint(player, reward);
            emit MiningClaimed(player, reward);
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
     * @param betHeads true to bet Heads, false to bet Tails.
     * @param betAmount quantity of $CPLAY to bet.
     */
    function coinFlip(bool betHeads, uint256 betAmount) external returns (bool) {
        require(betAmount >= 10 * 10**18, "Minimum bet is 10 CPLAY");
        require(balanceOf(msg.sender) >= betAmount, "Insufficient balance to place bet");

        // Burn the bet tokens upfront
        _burn(msg.sender, betAmount);

        // Generate pseudo-random result on-chain using block properties
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
            _mint(msg.sender, payout);
        }

        emit CoinFlipResult(msg.sender, betHeads, won, betAmount, payout, seed);
        return won;
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
}

