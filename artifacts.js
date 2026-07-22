// Auto-generated from Hardhat compilation. Do not edit.
const CONTRACT_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "allowance",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "needed",
        "type": "uint256"
      }
    ],
    "name": "ERC20InsufficientAllowance",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "sender",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "balance",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "needed",
        "type": "uint256"
      }
    ],
    "name": "ERC20InsufficientBalance",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "approver",
        "type": "address"
      }
    ],
    "name": "ERC20InvalidApprover",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "receiver",
        "type": "address"
      }
    ],
    "name": "ERC20InvalidReceiver",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "sender",
        "type": "address"
      }
    ],
    "name": "ERC20InvalidSender",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      }
    ],
    "name": "ERC20InvalidSpender",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "OwnableInvalidOwner",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "OwnableUnauthorizedAccount",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "spender",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      }
    ],
    "name": "Approval",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "buyer",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "usdcIn",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "tokensOut",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "newPrice",
        "type": "uint256"
      }
    ],
    "name": "Bought",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "player",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "newLevel",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "cost",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "devFee",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "poolShare",
        "type": "uint256"
      }
    ],
    "name": "ClickUpgraded",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "player",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "betHeads",
        "type": "bool"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "won",
        "type": "bool"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "betAmount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "devFee",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "payout",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "seed",
        "type": "uint256"
      }
    ],
    "name": "CoinFlipResult",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "player",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "FaucetClaimed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "newBalance",
        "type": "uint256"
      }
    ],
    "name": "FaucetPoolFunded",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "newBalance",
        "type": "uint256"
      }
    ],
    "name": "GamePoolFunded",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "player",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "newLevel",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "cost",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "devFee",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "poolShare",
        "type": "uint256"
      }
    ],
    "name": "MinerUpgraded",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "player",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "MiningClaimed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "previousOwner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "OwnershipTransferred",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "seller",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "tokensIn",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "usdcOut",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "newPrice",
        "type": "uint256"
      }
    ],
    "name": "Sold",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      }
    ],
    "name": "Transfer",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "BASE_MINING_RATE",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "BPS_DENOMINATOR",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "COINFLIP_PAYOUT_BPS",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "FAUCET_AMOUNT",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "MAX_SUPPLY",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "MIN_BET",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "PROTOCOL_FEE_BPS",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "VIRTUAL_USDC_OFFSET",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      }
    ],
    "name": "allowance",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      }
    ],
    "name": "approve",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "balanceOf",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "minTokensOut",
        "type": "uint256"
      }
    ],
    "name": "buy",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "tokensOut",
        "type": "uint256"
      }
    ],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "buyClickUpgrade",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "buyMinerUpgrade",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "claimFaucet",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "claimMining",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "clickLevels",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bool",
        "name": "betHeads",
        "type": "bool"
      },
      {
        "internalType": "uint256",
        "name": "betAmount",
        "type": "uint256"
      }
    ],
    "name": "coinFlip",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [
      {
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "faucetPoolBalance",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "fundFaucetPool",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "fundGamePool",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "gamePoolBalance",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "currentLevel",
        "type": "uint256"
      }
    ],
    "name": "getClickUpgradeCost",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getCurrentPrice",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "player",
        "type": "address"
      }
    ],
    "name": "getPlayerProfile",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "balance",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "faucetClaimed",
        "type": "bool"
      },
      {
        "internalType": "uint256",
        "name": "minerLevel",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "clickLevel",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "pendingRewards",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "currentLevel",
        "type": "uint256"
      }
    ],
    "name": "getUpgradeCost",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "hasClaimedFaucet",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "minerStates",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "level",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "lastClaimTime",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "name",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "player",
        "type": "address"
      }
    ],
    "name": "pendingMiningRewards",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "usdcIn",
        "type": "uint256"
      }
    ],
    "name": "previewBuy",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "tokensOut",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokensIn",
        "type": "uint256"
      }
    ],
    "name": "previewSell",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "usdcOut",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "renounceOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokensIn",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "minUsdcOut",
        "type": "uint256"
      }
    ],
    "name": "sell",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "usdcOut",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "symbol",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalSupply",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      }
    ],
    "name": "transfer",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      }
    ],
    "name": "transferFrom",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "transferOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "virtualTokenReserve",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "virtualUsdcReserve",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];
const CONTRACT_BYTECODE = "0x60806040523480156200001157600080fd5b50336040518060400160405280601081526020016f21b4b931b632a83630bc902a37b5b2b760811b8152506040518060400160405280600581526020016443504c415960d81b81525081600390816200006b9190620001d2565b5060046200007a8282620001d2565b5050506001600160a01b038116620000ac57604051631e4fbdf760e01b81526000600482015260240160405180910390fd5b620000b781620000db565b5068a2a15d09519be000006006556b033b2e3c9fd0803ce80000006007556200029e565b600580546001600160a01b038381166001600160a01b0319831681179093556040519116919082907f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e090600090a35050565b634e487b7160e01b600052604160045260246000fd5b600181811c908216806200015857607f821691505b6020821081036200017957634e487b7160e01b600052602260045260246000fd5b50919050565b601f821115620001cd57600081815260208120601f850160051c81016020861015620001a85750805b601f850160051c820191505b81811015620001c957828155600101620001b4565b5050505b505050565b81516001600160401b03811115620001ee57620001ee6200012d565b6200020681620001ff845462000143565b846200017f565b602080601f8311600181146200023e5760008415620002255750858301515b600019600386901b1c1916600185901b178555620001c9565b600085815260208120601f198616915b828110156200026f578886015182559484019460019091019084016200024e565b50858210156200028e5787850151600019600388901b60f8161c191681555b5050505050600190811b01905550565b611ee580620002ae6000396000f3fe60806040526004361061025c5760003560e01c80638da5cb5b11610144578063d79875eb116100b6578063eb91d37e1161007a578063eb91d37e146106ef578063f2fde38b14610704578063f31add9414610724578063fa58ccab1461073a578063fb3dd95f14610783578063ff329e7c146107a357600080fd5b8063d79875eb1461064b578063d96a094a1461066b578063dd62ed3e1461067e578063e1a45218146106c4578063eb51716e146106da57600080fd5b8063af52249111610108578063af5224911461056d578063b76839991461058d578063be378228146105ad578063cd076bfb146105c3578063d50f8989146105e3578063d64042411461062b57600080fd5b80638da5cb5b146104e557806394a611da1461050d57806395d89b41146105225780639ac27dd314610537578063a9059cbb1461054d57600080fd5b80634fe15335116101dd57806370a08231116101a157806370a082311461044c578063715018a61461048257806371514401146104975780637669764014610400578063866c8b92146104b45780638d005908146104ca57600080fd5b80634fe15335146103b457806351068036146103cb5780635edc4695146103e05780636540742f146104005780636db7494a1461041c57600080fd5b806323b872dd1161022457806323b872dd14610322578063313ce5671461034257806332cb6b0c1461035e578063343ee3b71461037e578063481532791461039457600080fd5b806306fdde0314610261578063095ea7b31461028c5780630c49f8fa146102bc5780631416f7b1146102f757806318160ddd1461030d575b600080fd5b34801561026d57600080fd5b506102766107c3565b6040516102839190611c22565b60405180910390f35b34801561029857600080fd5b506102ac6102a7366004611c8c565b610855565b6040519015158152602001610283565b3480156102c857600080fd5b506102e96102d7366004611cb6565b600c6020526000908152604090205481565b604051908152602001610283565b34801561030357600080fd5b506102e960065481565b34801561031957600080fd5b506002546102e9565b34801561032e57600080fd5b506102ac61033d366004611cd1565b61086f565b34801561034e57600080fd5b5060405160128152602001610283565b34801561036a57600080fd5b506102e96b033b2e3c9fd0803ce800000081565b34801561038a57600080fd5b506102e960075481565b3480156103a057600080fd5b506102e96103af366004611d0d565b610895565b3480156103c057600080fd5b506103c96108d1565b005b3480156103d757600080fd5b506103c9610a13565b3480156103ec57600080fd5b506103c96103fb366004611d0d565b610af5565b34801561040c57600080fd5b506102e9678ac7230489e8000081565b34801561042857600080fd5b506102ac610437366004611cb6565b60086020526000908152604090205460ff1681565b34801561045857600080fd5b506102e9610467366004611cb6565b6001600160a01b031660009081526020819052604090205490565b34801561048e57600080fd5b506103c9610b60565b3480156104a357600080fd5b506102e968a2a15d09519be0000081565b3480156104c057600080fd5b506102e961465081565b3480156104d657600080fd5b506102e966038d7ea4c6800081565b3480156104f157600080fd5b506005546040516001600160a01b039091168152602001610283565b34801561051957600080fd5b506103c9610b74565b34801561052e57600080fd5b50610276610b7d565b34801561054357600080fd5b506102e9600a5481565b34801561055957600080fd5b506102ac610568366004611c8c565b610b8c565b34801561057957600080fd5b506103c9610588366004611d0d565b610b9a565b34801561059957600080fd5b506102e96105a8366004611cb6565b610bfe565b3480156105b957600080fd5b506102e96103e881565b3480156105cf57600080fd5b506102e96105de366004611d0d565b610cdd565b3480156105ef57600080fd5b506106036105fe366004611cb6565b610d07565b604080519586529315156020860152928401919091526060830152608082015260a001610283565b34801561063757600080fd5b506102ac610646366004611d26565b610d7c565b34801561065757600080fd5b506102e9610666366004611d49565b610ff4565b6102e9610679366004611d0d565b611264565b34801561068a57600080fd5b506102e9610699366004611d6b565b6001600160a01b03918216600090815260016020908152604080832093909416825291909152205490565b3480156106d057600080fd5b506102e961271081565b3480156106e657600080fd5b506103c9611400565b3480156106fb57600080fd5b506102e96114e7565b34801561071057600080fd5b506103c961071f366004611cb6565b611505565b34801561073057600080fd5b506102e960095481565b34801561074657600080fd5b5061076e610755366004611cb6565b600b602052600090815260409020805460019091015482565b60408051928352602083019190915201610283565b34801561078f57600080fd5b506102e961079e366004611d0d565b611543565b3480156107af57600080fd5b506102e96107be366004611d0d565b611577565b6060600380546107d290611d9e565b80601f01602080910402602001604051908101604052809291908181526020018280546107fe90611d9e565b801561084b5780601f106108205761010080835404028352916020019161084b565b820191906000526020600020905b81548152906001019060200180831161082e57829003601f168201915b5050505050905090565b60003361086381858561158f565b60019150505b92915050565b60003361087d8582856115a1565b610888858585611620565b60019150505b9392505050565b600080826006546108a69190611dee565b905060006108b96006546007548461167f565b9050806007546108c99190611e01565b949350505050565b3360009081526008602052604090205460ff16156109365760405162461bcd60e51b815260206004820152601d60248201527f57656c636f6d65206772616e7420616c726561647920636c61696d656400000060448201526064015b60405180910390fd5b678ac7230489e8000060095410156109875760405162461bcd60e51b815260206004820152601460248201527346617563657420706f6f6c20697320656d70747960601b604482015260640161092d565b336000908152600860205260408120805460ff1916600117905560098054678ac7230489e8000092906109bb908490611e01565b909155506109d490503033678ac7230489e80000611620565b604051678ac7230489e80000815233907f5d4f415c63cd8a5874d9d291cdd64cec37e5dc236d90d659c958d109d78074b39060200160405180910390a2565b336000908152600c602052604081205490610a2d82610cdd565b33600090815260208190526040902054909150811115610a5f5760405162461bcd60e51b815260040161092d90611e14565b600080610a6b83611734565b336000908152600c602052604081208054939550919350600192610a90908490611dee565b9091555050336000818152600c6020908152604091829020548251908152908101869052908101849052606081018390527fceabc3138c5622082e5156e3762491756cf0ab36ec0ec24f6cbb4c65063e3921906080015b60405180910390a250505050565b610afd6117a3565b610b08333083611620565b8060096000828254610b1a9190611dee565b90915550506009546040805183815260208101929092527ff840c4114af4ce1a50d3cc177463ffcbd5f56f726a68119e1e6732b4cd435d8991015b60405180910390a150565b610b686117a3565b610b7260006117d0565b565b610b7233611822565b6060600480546107d290611d9e565b600033610863818585611620565b610ba26117a3565b610bad333083611620565b80600a6000828254610bbf9190611dee565b9091555050600a546040805183815260208101929092527f3b3a44002b7bdca6b302f4177fc82bd71c529d139d0e669feb68933aaa4586249101610b55565b6001600160a01b0381166000908152600b602090815260408083208151808301909252805480835260019091015492820192909252901580610c4257506020810151155b15610c505750600092915050565b6000816020015142610c629190611e01565b9050600066038d7ea4c68000836000015183610c7e9190611e5a565b610c889190611e5a565b6001600160a01b0386166000908152600c602052604081205491925090606490610cb29084611e5a565b610cbd90600a611e5a565b610cc79190611e87565b9050610cd38183611dee565b9695505050505050565b6000610cea826001611dee565b610cf5906032611e5a565b61086990670de0b6b3a7640000611e5a565b6000806000806000610d2e866001600160a01b031660009081526020819052604090205490565b6001600160a01b038716600090815260086020908152604080832054600b835281842054600c90935292205492975060ff909116955093509150610d7186610bfe565b905091939590929450565b6000678ac7230489e80000821015610dd65760405162461bcd60e51b815260206004820152601760248201527f4d696e696d756d206265742069732031302043504c4159000000000000000000604482015260640161092d565b33600090815260208190526040902054821115610e3f5760405162461bcd60e51b815260206004820152602160248201527f496e73756666696369656e742062616c616e636520746f20706c6163652062656044820152601d60fa1b606482015260840161092d565b6000612710610e5061465085611e5a565b610e5a9190611e87565b905080600a541015610ede5760405162461bcd60e51b815260206004820152604160248201527f506f6f6c2063616e6e6f7420736166656c7920636f766572207468697320626560448201527f74207269676874206e6f772c20747279206120736d616c6c657220616d6f756e6064820152601d60fa1b608482015260a40161092d565b600080610eea85611734565b91509150600042443343604051602001610f2f9493929190938452602084019290925260601b6bffffffffffffffffffffffff19166040830152605482015260740190565b60408051601f19818403018152919052805160209091012090506000610f56600283611e9b565b159050871515811460008115610f8c5786905080600a6000828254610f7b9190611e01565b90915550610f8c9050303383611620565b604080518b1515815283151560208201529081018a9052606081018790526080810182905260a0810185905233907f297323638f1fb29c47d160a516642b7b8be1b5e42e1038d6dde058e253fbe5249060c00160405180910390a25098975050505050505050565b600080831161103a5760405162461bcd60e51b81526020600482015260126024820152710416d6f756e74206d757374206265203e20360741b604482015260640161092d565b336000908152602081905260409020548311156110995760405162461bcd60e51b815260206004820152601a60248201527f496e73756666696369656e742043504c41592062616c616e6365000000000000604482015260640161092d565b6000836007546110a99190611dee565b905060006110bc6006546007548461167f565b9050806006546110cc9190611e01565b92508383101561111e5760405162461bcd60e51b815260206004820152601f60248201527f536c6970706167653a20757364634f75742062656c6f77206d696e696d756d00604482015260640161092d565b8247101561116e5760405162461bcd60e51b815260206004820152601a60248201527f4375727665207265736572766520696e73756666696369656e74000000000000604482015260640161092d565b600681905560078290556111823386611983565b604051600090339085908381818185875af1925050503d80600081146111c4576040519150601f19603f3d011682016040523d82523d6000602084013e6111c9565b606091505b50509050806112115760405162461bcd60e51b81526020600482015260146024820152731554d110c81d1c985b9cd9995c8819985a5b195960621b604482015260640161092d565b337fe029f26dbcf8c42dd2f352c10214a7fc26773dc62482c6241334a0402ac09a80878661123d6114e7565b6040805193845260208401929092529082015260600160405180910390a250505092915050565b60008034116112a85760405162461bcd60e51b815260206004820152601060248201526f53656e64205553444320746f2062757960801b604482015260640161092d565b6000346006546112b89190611dee565b905060006112cb6006546007548461167f565b9050806007546112db9190611e01565b9250838310156113375760405162461bcd60e51b815260206004820152602160248201527f536c6970706167653a20746f6b656e734f75742062656c6f77206d696e696d756044820152606d60f81b606482015260840161092d565b6b033b2e3c9fd0803ce80000008361134e60025490565b6113589190611dee565b111561139b5760405162461bcd60e51b815260206004820152601260248201527145786365656473206d617820737570706c7960701b604482015260640161092d565b600682905560078190556113af33846119bd565b337fedba86fd2b22962d534e70ad9b0ff8730de46f636146f2bab6a72cbb1ebbcc5334856113db6114e7565b6040805193845260208401929092529082015260600160405180910390a25050919050565b336000908152600b60205260408120549061141a82611577565b3360009081526020819052604090205490915081111561144c5760405162461bcd60e51b815260040161092d90611e14565b61145533611822565b60008061146183611734565b336000908152600b602052604081208054939550919350600192611486908490611dee565b9091555050336000818152600b6020908152604091829020426001820155548251908152908101869052908101849052606081018390527f27bdd6ff15a2693ad6713a52f42b1921c838421153b163f13f15ed0e9aa6701490608001610ae7565b6000611500600654670de0b6b3a764000060075461167f565b905090565b61150d6117a3565b6001600160a01b03811661153757604051631e4fbdf760e01b81526000600482015260240161092d565b611540816117d0565b50565b600080826007546115549190611dee565b905060006115676006546007548461167f565b9050806006546108c99190611e01565b6000611584826001611dee565b610cf5906064611e5a565b61159c83838360016119f3565b505050565b6001600160a01b0383811660009081526001602090815260408083209386168352929052205460001981101561161a578181101561160b57604051637dc7a0d960e11b81526001600160a01b0384166004820152602481018290526044810183905260640161092d565b61161a848484840360006119f3565b50505050565b6001600160a01b03831661164a57604051634b637e8f60e11b81526000600482015260240161092d565b6001600160a01b0382166116745760405163ec442f0560e01b81526000600482015260240161092d565b61159c838383611ac8565b600080600061168e8686611bf2565b91509150816000036116b3578381816116a9576116a9611e71565b049250505061088e565b8184116116ca576116ca6003851502601118611c10565b6000848688096000868103871696879004966002600389028118808a02820302808a02820302808a02820302808a02820302808a02820302808a02909103029181900381900460010185841190960395909502919093039390930492909217029150509392505050565b6000806127106117466103e885611e5a565b6117509190611e87565b915061175c8284611e01565b905061177a336117746005546001600160a01b031690565b84611620565b611785333083611620565b80600a60008282546117979190611dee565b92505081905550915091565b6005546001600160a01b03163314610b725760405163118cdaa760e01b815233600482015260240161092d565b600580546001600160a01b038381166001600160a01b0319831681179093556040519116919082907f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e090600090a35050565b6001600160a01b0381166000908152600b60205260408120805490910361184d574260019091015550565b600081600101544261185f9190611e01565b90508060000361186e57505050565b815460009066038d7ea4c68000906118869084611e5a565b6118909190611e5a565b6001600160a01b0385166000908152600c6020526040812054919250906064906118ba9084611e5a565b6118c590600a611e5a565b6118cf9190611e87565b905060006118dd8284611dee565b426001870155905060008190036118f657505050505050565b6000600a548211611907578161190b565b600a545b9050801561197a5780600a60008282546119259190611e01565b909155506119369050308883611620565b866001600160a01b03167f2b0c260c0010c75eaf0b5071822a9ccf72234a0f0403ea2aa26c61c8afde3f2a8260405161197191815260200190565b60405180910390a25b50505050505050565b6001600160a01b0382166119ad57604051634b637e8f60e11b81526000600482015260240161092d565b6119b982600083611ac8565b5050565b6001600160a01b0382166119e75760405163ec442f0560e01b81526000600482015260240161092d565b6119b960008383611ac8565b6001600160a01b038416611a1d5760405163e602df0560e01b81526000600482015260240161092d565b6001600160a01b038316611a4757604051634a1406b160e11b81526000600482015260240161092d565b6001600160a01b038085166000908152600160209081526040808320938716835292905220829055801561161a57826001600160a01b0316846001600160a01b03167f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b92584604051611aba91815260200190565b60405180910390a350505050565b6001600160a01b038316611af3578060026000828254611ae89190611dee565b90915550611b659050565b6001600160a01b03831660009081526020819052604090205481811015611b465760405163391434e360e21b81526001600160a01b0385166004820152602481018290526044810183905260640161092d565b6001600160a01b03841660009081526020819052604090209082900390555b6001600160a01b038216611b8157600280548290039055611ba0565b6001600160a01b03821660009081526020819052604090208054820190555b816001600160a01b0316836001600160a01b03167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef83604051611be591815260200190565b60405180910390a3505050565b60008060001983850993909202808410938190039390930393915050565b634e487b71600052806020526024601cfd5b600060208083528351808285015260005b81811015611c4f57858101830151858201604001528201611c33565b506000604082860101526040601f19601f8301168501019250505092915050565b80356001600160a01b0381168114611c8757600080fd5b919050565b60008060408385031215611c9f57600080fd5b611ca883611c70565b946020939093013593505050565b600060208284031215611cc857600080fd5b61088e82611c70565b600080600060608486031215611ce657600080fd5b611cef84611c70565b9250611cfd60208501611c70565b9150604084013590509250925092565b600060208284031215611d1f57600080fd5b5035919050565b60008060408385031215611d3957600080fd5b82358015158114611ca857600080fd5b60008060408385031215611d5c57600080fd5b50508035926020909101359150565b60008060408385031215611d7e57600080fd5b611d8783611c70565b9150611d9560208401611c70565b90509250929050565b600181811c90821680611db257607f821691505b602082108103611dd257634e487b7160e01b600052602260045260246000fd5b50919050565b634e487b7160e01b600052601160045260246000fd5b8082018082111561086957610869611dd8565b8181038181111561086957610869611dd8565b60208082526026908201527f496e73756666696369656e742043504c41592062616c616e636520666f72207560408201526570677261646560d01b606082015260800190565b808202811582820484141761086957610869611dd8565b634e487b7160e01b600052601260045260246000fd5b600082611e9657611e96611e71565b500490565b600082611eaa57611eaa611e71565b50069056fea26469706673582212204c0e4a73e4a1375c334778e6d128786043179cc47570b84567f644237e25c98164736f6c63430008140033";
