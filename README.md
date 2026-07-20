# Circle Miner & Lucky Flip 🚀

A decentralized Web3 cyberpunk clicker and coin flip betting game running on the **Arc Testnet** (and compatible with a local Hardhat node).

## Features

1. **Faucet**: Claim 1,000 free test $CPLAY tokens every hour to play the game (cooldown enforced on-chain).
2. **Circle Miner**:
   - **Clicker**: Click the glowing $C icon to accumulate energy.
   - **Super-Click Upgrade**: Boosts clicking efficiency (+1 multiplier) using $CPLAY tokens.
   - **Circle Mining Rig**: Buy and upgrade passive rigs that continuously mine $CPLAY on-chain at a rate of 0.01 CPLAY/sec per level.
3. **Lucky Flip (Coin Toss)**: Bet your $CPLAY on Heads or Tails. Guesses are resolved on-chain using pseudo-randomness. A correct guess pays out double, while an incorrect guess burns the bet.
4. **Developer Control Center**:
   - **1-Click Browser Deployer**: Don't want to configure keys or CLI commands? Deploy a fresh contract instance directly from the browser using MetaMask or a compatible wallet! The frontend automatically captures the deployed address and saves it to your local storage.
   - **Custom Contract Address Input**: Paste any custom deployed contract address to test different instances.
5. **Session Transaction Logs**: Real-time list of all session blockchain transactions with direct links to Arcscan.

---

## Technical Stack

- **Smart Contract**: Solidity `^0.8.20` using OpenZeppelin ERC20 standards, deployed on Arc Testnet (chain ID `5042002`).
- **Frontend**: HTML5, Vanilla CSS3 (custom cyberpunk design, glassmorphism, 3D rotating coin flips), Vanilla JavaScript, and Ethers.js v6.
- **Environment**: Hardhat.

---

## Quickstart

### Prerequisites

Make sure you have [Node.js](https://nodejs.org/) installed.

### 1. Install Dependencies

Install the project dependencies (Hardhat and OpenZeppelin contracts):

```bash
npm install
```

### 2. Compile the Smart Contracts

Compile the Solidity source code to generate compiled artifacts, ABI, and bytecode:

```bash
npx hardhat compile
```

This compiles `contracts/BasePlayAdventure.sol` (token: **CirclePlay Token / $CPLAY**) and saves artifacts to the `artifacts/` folder.

### 3. Extract ABI for Frontend

Run our custom extraction script to automatically update the frontend ABI configuration file `artifacts.js`:

```bash
node extract_artifacts.js
```

### 4. Run the Game Locally

You can serve the game files using any static web server (such as `live-server`, `http-server`, or `npx serve`):

```bash
npx serve .
```

Then open the local URL (typically `http://localhost:3000` or `http://localhost:5000`) in your browser with MetaMask (or another wallet extension) configured for **Arc Testnet**.

---

## Deploying the Smart Contract

You have two options to deploy the smart contract:

### Option A: 1-Click Browser Deployment (Recommended)

1. Connect your wallet to **Arc Testnet** on the game page (chain ID `5042002`, RPC `https://rpc.testnet.arc.network`) — the app will prompt to add/switch automatically.
2. Ensure you have some test USDC for gas — Arc uses USDC as its native gas token. Get some free from the [Circle Faucet](https://faucet.circle.com).
3. Navigate to the **Developer Panel** tab in the game sidebar.
4. Click the **Deploy Contract via Wallet** button and sign the wallet transaction.
5. Once confirmed, the contract address will update automatically and the game will activate!

### Option B: CLI Deployment using Hardhat

1. Set your environment variable:
   ```bash
   export PRIVATE_KEY="your-private-key-with-arc-testnet-usdc-for-gas"
   ```
2. Deploy using Hardhat:
   ```bash
   npx hardhat run scripts/deploy.js --network arc-testnet
   ```
3. Copy the output contract address and paste it into the **Smart Contract** input box in the game's **Developer Panel** (or update the `DEFAULT_CONTRACTS["5042002"]` value in `app.js`).

---

## Network Reference

| Parameter | Value |
|---|---|
| Network Name | Arc Testnet |
| Chain ID | `5042002` (`0x4cef52`) |
| RPC URL | `https://rpc.testnet.arc.network` |
| Native Currency | USDC (18 decimals) |
| Block Explorer | https://testnet.arcscan.app |
| Faucet | https://faucet.circle.com |

> ⚠️ Arc Testnet only — test funds, zero real value. Not affiliated with Circle or Arc.
