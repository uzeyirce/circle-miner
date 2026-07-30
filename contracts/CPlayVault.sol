// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CPlayVault
 * @dev Permanent token vault for the Circle Miner ecosystem. Holds $CPLAY
 * and pays out ONLY to whichever game contract is currently authorized.
 * This lets the game logic be upgraded freely without ever having to move
 * funds — the vault stays put, only the authorized "gameContract" pointer
 * changes.
 *
 * By design, there is NO owner withdrawal path. The owner can only choose
 * WHICH game contract is allowed to spend, never spend directly. This
 * mirrors the "liquidity locked forever" trust model already established
 * on the RadarDex LP for this token.
 */
contract CPlayVault is Ownable {
    IERC20 public immutable cplayToken;
    address public gameContract;

    event Funded(address indexed from, uint256 amount, uint256 newBalance);
    event PaidOut(address indexed to, uint256 amount, uint256 newBalance);
    event GameContractUpdated(address indexed oldGame, address indexed newGame);

    modifier onlyGame() {
        require(msg.sender == gameContract, "Only the active game contract can call this");
        _;
    }

    constructor(address tokenAddress) Ownable(msg.sender) {
        require(tokenAddress != address(0), "Invalid token address");
        cplayToken = IERC20(tokenAddress);
    }

    /**
     * @dev Point the vault at a new authorized game contract. The old
     * contract immediately loses payout access. Funds never move — only
     * this pointer changes.
     */
    function setGameContract(address newGameContract) external onlyOwner {
        require(newGameContract != address(0), "Invalid game contract address");
        address old = gameContract;
        gameContract = newGameContract;
        emit GameContractUpdated(old, newGameContract);
    }

    /**
     * @dev Deposit $CPLAY into the vault. Anyone can fund it (the owner,
     * or in the future community contributions). Requires
     * cplayToken.approve(vaultAddress, amount) first.
     */
    function fund(uint256 amount) external {
        require(cplayToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        emit Funded(msg.sender, amount, cplayToken.balanceOf(address(this)));
    }

    /**
     * @dev Pay out $CPLAY to a player. Only callable by the currently
     * authorized game contract.
     */
    function payout(address to, uint256 amount) external onlyGame {
        require(cplayToken.transfer(to, amount), "Transfer failed");
        emit PaidOut(to, amount, cplayToken.balanceOf(address(this)));
    }

    function vaultBalance() external view returns (uint256) {
        return cplayToken.balanceOf(address(this));
    }
}
