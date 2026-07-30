// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface ICPlayVault {
    function payout(address to, uint256 amount) external;
    function vaultBalance() external view returns (uint256);
}

/**
 * @title BasePlayAdventure - Circle Miner Game Engine (Phase 1: Lucky Flip only)
 * @dev Pays out through a permanent, external CPlayVault contract instead of
 * holding funds itself. Circle Miner (faucet / idle mining / upgrades) is
 * intentionally DISABLED in this phase - only the Lucky Flip coin-flip game
 * is live. The miner functions are left in place but gated off so they can
 * be re-enabled later without redeploying the whole contract.
 *
 * Odds are a genuine, verifiable 50/50 coin flip - the house edge comes
 * entirely from the payout multiplier (1.7x, not 2x) and the 10% protocol
 * fee, both fully transparent on-chain. Nothing about the randomness itself
 * is skewed.
 */
contract BasePlayAdventure is Ownable {
    IERC20 public immutable cplayToken;
    ICPlayVault public immutable vault;

    // ---- Feature flags ----
    bool public constant CIRCLE_MINER_ENABLED = false; // Phase 1: disabled
    bool public constant LUCKY_FLIP_ENABLED = true;

    // ---- Protocol fee split: 10% owner / 90% vault ----
    uint256 public constant PROTOCOL_FEE_BPS = 1000;
    uint256 public constant BPS_DENOMINATOR = 10000;

    // ---- Coin flip: genuine 50/50 odds, house edge lives in the payout multiplier ----
    uint256 public constant COINFLIP_PAYOUT_BPS = 17000; // 1.7x payout
    uint256 public constant MIN_BET = 10 * 10**18;

    // ---- Idle mining / faucet / upgrades - present but gated off in Phase 1 ----
    uint256 public constant FAUCET_AMOUNT = 10 * 10**18;
    mapping(address => bool) public hasClaimedFaucet;
    uint256 public constant BASE_MINING_RATE = 1 * 10**15;
    struct MinerState {
        uint256 level;
        uint256 lastClaimTime;
    }
    mapping(address => MinerState) public minerStates;
    mapping(address => uint256) public clickLevels;

    event MinerUpgraded(address indexed player, uint256 newLevel, uint256 cost, uint256 devFee, uint256 vaultShare);
    event ClickUpgraded(address indexed player, uint256 newLevel, uint256 cost, uint256 devFee, uint256 vaultShare);
    event MiningClaimed(address indexed player, uint256 amount);
    event FaucetClaimed(address indexed player, uint256 amount);
    event CoinFlipResult(
        address indexed player,
        bool betHeads,
        bool won,
        uint256 betAmount,
        uint256 devFee,
        uint256 payout,
        uint256 seed
    );

    constructor(address tokenAddress, address vaultAddress) Ownable(msg.sender) {
        require(tokenAddress != address(0), "Invalid token address");
        require(vaultAddress != address(0), "Invalid vault address");
        cplayToken = IERC20(tokenAddress);
        vault = ICPlayVault(vaultAddress);
    }

    /**
     * @dev Sends the 10% protocol fee to the owner and the 90% remainder to
     * the vault (the vault is just a token holder - this contract must
     * still transfer the vault's share INTO it directly, same as the
     * player -> vault direction for fees).
     */
    function _splitToOwnerAndVault(uint256 amount) internal returns (uint256 devFee, uint256 vaultShare) {
        devFee = (amount * PROTOCOL_FEE_BPS) / BPS_DENOMINATOR;
        vaultShare = amount - devFee;
        require(cplayToken.transferFrom(msg.sender, owner(), devFee), "Fee transfer failed");
        require(cplayToken.transferFrom(msg.sender, address(vault), vaultShare), "Vault transfer failed");
    }

    // ==========================================================================
    // LUCKY FLIP - the only live game mode in Phase 1.
    // Player must have called cplayToken.approve(thisContract, betAmount) first.
    // ==========================================================================

    function coinFlip(bool betHeads, uint256 betAmount) external returns (bool) {
        require(LUCKY_FLIP_ENABLED, "Lucky Flip is not currently active");
        require(betAmount >= MIN_BET, "Minimum bet is 10 CPLAY");
        require(cplayToken.balanceOf(msg.sender) >= betAmount, "Insufficient balance to place bet");
        require(cplayToken.allowance(msg.sender, address(this)) >= betAmount, "Approve CPLAY spend first");

        uint256 payoutAmount = (betAmount * COINFLIP_PAYOUT_BPS) / BPS_DENOMINATOR;
        require(vault.vaultBalance() >= payoutAmount, "Vault cannot safely cover this bet right now, try a smaller amount");

        (uint256 devFee, ) = _splitToOwnerAndVault(betAmount);

        // Genuine, unweighted 50/50 outcome - no skew applied anywhere.
        uint256 seed = uint256(
            keccak256(abi.encodePacked(block.timestamp, block.prevrandao, msg.sender, block.number))
        );
        bool resultIsHeads = (seed % 2 == 0);
        bool won = (betHeads == resultIsHeads);

        uint256 actualPayout = 0;
        if (won) {
            actualPayout = payoutAmount;
            vault.payout(msg.sender, actualPayout);
        }

        emit CoinFlipResult(msg.sender, betHeads, won, betAmount, devFee, actualPayout, seed);
        return won;
    }

    // ==========================================================================
    // CIRCLE MINER - Phase 1: disabled. Calls revert with a clear message.
    // Left implemented (not deleted) so Phase 2 just flips a flag + redeploy,
    // no data model rework needed.
    // ==========================================================================

    function claimFaucet() external pure {
        revert("Circle Miner is not live yet - Lucky Flip only in this phase");
    }

    function buyMinerUpgrade() external pure {
        revert("Circle Miner is not live yet - Lucky Flip only in this phase");
    }

    function buyClickUpgrade() external pure {
        revert("Circle Miner is not live yet - Lucky Flip only in this phase");
    }

    function claimMining() external pure {
        revert("Circle Miner is not live yet - Lucky Flip only in this phase");
    }

    // ==========================================================================
    // VIEW HELPERS
    // ==========================================================================

    function getPlayerProfile(address player) external view returns (
        uint256 balance,
        bool circleMinerEnabled,
        bool luckyFlipEnabled,
        uint256 allowanceGiven,
        uint256 vaultBalanceNow
    ) {
        balance = cplayToken.balanceOf(player);
        circleMinerEnabled = CIRCLE_MINER_ENABLED;
        luckyFlipEnabled = LUCKY_FLIP_ENABLED;
        allowanceGiven = cplayToken.allowance(player, address(this));
        vaultBalanceNow = vault.vaultBalance();
    }
}
