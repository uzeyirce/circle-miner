// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

/**
 * @title BasePlayAdventure ($CPLAY)
 * @dev Bonding-curve token + idle mining / coin-flip game, deployed on Arc Testnet.
 *
 * TOKENOMICS OVERVIEW
 * --------------------
 * - Hard cap: 1,000,000,000 CPLAY. The ONLY way new tokens are ever minted is
 *   through buy() on the bonding curve. There is no other _mint() call in
 *   this contract, anywhere, ever.
 * - The bonding curve uses a constant-product virtual-reserve model (the
 *   same mechanism popularized by pump.fun): price starts low and rises
 *   automatically as people buy, and falls as people sell. The curve is
 *   funded in Arc's native currency, which is USDC (18 decimals) on Arc.
 * - Two SEPARATE internal pools, both funded by the owner transferring their
 *   own (curve-bought) tokens in — never freshly minted:
 *     1) faucetPoolBalance — funds the one-time 10 CPLAY welcome grant per
 *        wallet. Exhaustible; once empty, claimFaucet() reverts.
 *     2) gamePoolBalance — funds mining rewards and coin-flip payouts.
 *        90% of every upgrade purchase and every bet placed flows INTO this
 *        pool; 10% flows immediately to the owner (protocol fee). Coin-flip
 *        wins pay out at 1.8x the bet from this pool, sized so the pool is
 *        sustainable on average over many plays (not a guaranteed-loss
 *        mint-on-win design like the old version).
 */
contract BasePlayAdventure is ERC20, Ownable {
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18;

    // ---- Bonding curve state (constant product, pump.fun-style virtual reserves) ----
    uint256 public constant VIRTUAL_USDC_OFFSET = 3_000 * 10**18; // phantom starting depth
    uint256 public virtualUsdcReserve; // = real USDC held for the curve + VIRTUAL_USDC_OFFSET
    uint256 public virtualTokenReserve; // starts at MAX_SUPPLY, decreases as tokens are bought

    // ---- Faucet: one-time welcome grant, paid from its own separate pool ----
    uint256 public constant FAUCET_AMOUNT = 10 * 10**18;
    mapping(address => bool) public hasClaimedFaucet;
    uint256 public faucetPoolBalance;

    // ---- Game reward pool (mining + coin-flip), fully separate from faucet pool ----
    uint256 public gamePoolBalance;
    uint256 public constant PROTOCOL_FEE_BPS = 1000;   // 10.00% to owner
    uint256 public constant BPS_DENOMINATOR = 10000;

    // ---- Idle mining ----
    uint256 public constant BASE_MINING_RATE = 1 * 10**15; // 0.001 CPLAY/sec/level (1/10th of the original rate)
    struct MinerState {
        uint256 level;
        uint256 lastClaimTime;
    }
    mapping(address => MinerState) public minerStates;

    // ---- Click upgrade: now genuinely boosts on-chain mining reward (+10% per level) ----
    mapping(address => uint256) public clickLevels;

    // ---- Coin flip ----
    uint256 public constant COINFLIP_PAYOUT_BPS = 18000; // 1.8x payout
    uint256 public constant MIN_BET = 10 * 10**18;

    // Events
    event Bought(address indexed buyer, uint256 usdcIn, uint256 tokensOut, uint256 newPrice);
    event Sold(address indexed seller, uint256 tokensIn, uint256 usdcOut, uint256 newPrice);
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

    constructor() ERC20("CirclePlay Token", "CPLAY") Ownable(msg.sender) {
        virtualUsdcReserve = VIRTUAL_USDC_OFFSET;
        virtualTokenReserve = MAX_SUPPLY;
    }

    // ==========================================================================
    // BONDING CURVE — buy / sell against Arc's native USDC
    // ==========================================================================

    /**
     * @dev Buy CPLAY with native USDC at the current curve price. Send USDC
     * as msg.value. Slippage protection via minTokensOut.
     */
    function buy(uint256 minTokensOut) external payable returns (uint256 tokensOut) {
        require(msg.value > 0, "Send USDC to buy");

        uint256 newVirtualUsdcReserve = virtualUsdcReserve + msg.value;
        uint256 newVirtualTokenReserve = Math.mulDiv(virtualUsdcReserve, virtualTokenReserve, newVirtualUsdcReserve);
        tokensOut = virtualTokenReserve - newVirtualTokenReserve;

        require(tokensOut >= minTokensOut, "Slippage: tokensOut below minimum");
        require(totalSupply() + tokensOut <= MAX_SUPPLY, "Exceeds max supply");

        virtualUsdcReserve = newVirtualUsdcReserve;
        virtualTokenReserve = newVirtualTokenReserve;

        _mint(msg.sender, tokensOut);

        emit Bought(msg.sender, msg.value, tokensOut, getCurrentPrice());
    }

    /**
     * @dev Sell CPLAY back into the curve for native USDC. Slippage
     * protection via minUsdcOut.
     */
    function sell(uint256 tokensIn, uint256 minUsdcOut) external returns (uint256 usdcOut) {
        require(tokensIn > 0, "Amount must be > 0");
        require(balanceOf(msg.sender) >= tokensIn, "Insufficient CPLAY balance");

        uint256 newVirtualTokenReserve = virtualTokenReserve + tokensIn;
        uint256 newVirtualUsdcReserve = Math.mulDiv(virtualUsdcReserve, virtualTokenReserve, newVirtualTokenReserve);
        usdcOut = virtualUsdcReserve - newVirtualUsdcReserve;

        require(usdcOut >= minUsdcOut, "Slippage: usdcOut below minimum");
        require(address(this).balance >= usdcOut, "Curve reserve insufficient");

        virtualUsdcReserve = newVirtualUsdcReserve;
        virtualTokenReserve = newVirtualTokenReserve;

        _burn(msg.sender, tokensIn);

        (bool success, ) = msg.sender.call{value: usdcOut}("");
        require(success, "USDC transfer failed");

        emit Sold(msg.sender, tokensIn, usdcOut, getCurrentPrice());
    }

    /// @dev Current spot price of 1 whole CPLAY in native USDC (18 decimals).
    function getCurrentPrice() public view returns (uint256) {
        return Math.mulDiv(virtualUsdcReserve, 10**18, virtualTokenReserve);
    }

    /// @dev Preview how many tokens a given USDC input would currently buy.
    function previewBuy(uint256 usdcIn) external view returns (uint256 tokensOut) {
        uint256 newVirtualUsdcReserve = virtualUsdcReserve + usdcIn;
        uint256 newVirtualTokenReserve = Math.mulDiv(virtualUsdcReserve, virtualTokenReserve, newVirtualUsdcReserve);
        tokensOut = virtualTokenReserve - newVirtualTokenReserve;
    }

    /// @dev Preview how much USDC a given token input would currently return.
    function previewSell(uint256 tokensIn) external view returns (uint256 usdcOut) {
        uint256 newVirtualTokenReserve = virtualTokenReserve + tokensIn;
        uint256 newVirtualUsdcReserve = Math.mulDiv(virtualUsdcReserve, virtualTokenReserve, newVirtualTokenReserve);
        usdcOut = virtualUsdcReserve - newVirtualUsdcReserve;
    }

    // ==========================================================================
    // OWNER: fund the two separate pools from the owner's own (curve-bought) balance
    // ==========================================================================

    function fundFaucetPool(uint256 amount) external onlyOwner {
        _transfer(msg.sender, address(this), amount);
        faucetPoolBalance += amount;
        emit FaucetPoolFunded(amount, faucetPoolBalance);
    }

    function fundGamePool(uint256 amount) external onlyOwner {
        _transfer(msg.sender, address(this), amount);
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
        _transfer(address(this), msg.sender, FAUCET_AMOUNT);
        emit FaucetClaimed(msg.sender, FAUCET_AMOUNT);
    }

    // ==========================================================================
    // UPGRADES — cost split 10% owner / 90% game pool
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
        _transfer(msg.sender, owner(), devFee);
        _transfer(msg.sender, address(this), poolShare);
        gamePoolBalance += poolShare;
    }

    function buyMinerUpgrade() external {
        uint256 currentLevel = minerStates[msg.sender].level;
        uint256 cost = getUpgradeCost(currentLevel);
        require(balanceOf(msg.sender) >= cost, "Insufficient CPLAY balance for upgrade");

        _claimMiningInternal(msg.sender);

        (uint256 devFee, uint256 poolShare) = _splitIntoPool(cost);

        minerStates[msg.sender].level += 1;
        minerStates[msg.sender].lastClaimTime = block.timestamp;

        emit MinerUpgraded(msg.sender, minerStates[msg.sender].level, cost, devFee, poolShare);
    }

    function buyClickUpgrade() external {
        uint256 currentLevel = clickLevels[msg.sender];
        uint256 cost = getClickUpgradeCost(currentLevel);
        require(balanceOf(msg.sender) >= cost, "Insufficient CPLAY balance for upgrade");

        (uint256 devFee, uint256 poolShare) = _splitIntoPool(cost);

        clickLevels[msg.sender] += 1;

        emit ClickUpgraded(msg.sender, clickLevels[msg.sender], cost, devFee, poolShare);
    }

    // ==========================================================================
    // IDLE MINING — paid ONLY from gamePoolBalance. Click level now genuinely
    // boosts the reward (+10% per click level), fixing the old version where
    // the click upgrade had no real on-chain effect.
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
            _transfer(address(this), player, payoutAmount);
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
    // from the game pool. Pool depth is checked BEFORE accepting the bet so a
    // win can always be paid without ever minting new tokens.
    // ==========================================================================

    function coinFlip(bool betHeads, uint256 betAmount) external returns (bool) {
        require(betAmount >= MIN_BET, "Minimum bet is 10 CPLAY");
        require(balanceOf(msg.sender) >= betAmount, "Insufficient balance to place bet");

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
            _transfer(address(this), msg.sender, actualPayout);
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
        uint256 pendingRewards
    ) {
        balance = balanceOf(player);
        faucetClaimed = hasClaimedFaucet[player];
        minerLevel = minerStates[player].level;
        clickLevel = clickLevels[player];
        pendingRewards = pendingMiningRewards(player);
    }
}
