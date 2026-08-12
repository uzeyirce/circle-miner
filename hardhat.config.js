require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    "arc-mainnet": {
      url: "https://arc-mainnet.infura.io/v3/b6bf7d3508c941499b10025c0776eaf8",
      chainId: 5042,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    "arc-testnet": {
      url: "https://arc-mainnet.infura.io/v3/b6bf7d3508c941499b10025c0776eaf8",
      chainId: 5042002,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    base: {
      url: "https://arc-mainnet.infura.io/v3/b6bf7d3508c941499b10025c0776eaf8",
      chainId: 8453,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
  mocha: {
    timeout: 120000
  }
};
