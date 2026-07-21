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
        "name": "to",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "PoolWithdraw",
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
    "name": "FAUCET_COOLDOWN",
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
    "name": "TOTAL_SUPPLY",
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
        "name": "value",
        "type": "uint256"
      }
    ],
    "name": "burn",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      }
    ],
    "name": "burnFrom",
    "outputs": [],
    "stateMutability": "nonpayable",
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
        "internalType": "uint256",
        "name": "faucetCooldownLeft",
        "type": "uint256"
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
    "name": "lastFaucetClaim",
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
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "ownerWithdrawPool",
    "outputs": [],
    "stateMutability": "nonpayable",
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
    "inputs": [],
    "name": "poolBalance",
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
    "name": "renounceOwnership",
    "outputs": [],
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
  }
];
const CONTRACT_BYTECODE = "0x60806040523480156200001157600080fd5b50336040518060400160405280601081526020016f21b4b931b632a83630bc902a37b5b2b760811b8152506040518060400160405280600581526020016443504c415960d81b81525081600390816200006b91906200033f565b5060046200007a82826200033f565b5050506001600160a01b038116620000ad57604051631e4fbdf760e01b8152600060048201526024015b60405180910390fd5b620000b881620000d7565b50620000d1306b033b2e3c9fd0803ce800000062000129565b62000433565b600580546001600160a01b038381166001600160a01b0319831681179093556040519116919082907f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e090600090a35050565b6001600160a01b038216620001555760405163ec442f0560e01b815260006004820152602401620000a4565b620001636000838362000167565b5050565b6001600160a01b038316620001965780600260008282546200018a91906200040b565b909155506200020a9050565b6001600160a01b03831660009081526020819052604090205481811015620001eb5760405163391434e360e21b81526001600160a01b03851660048201526024810182905260448101839052606401620000a4565b6001600160a01b03841660009081526020819052604090209082900390555b6001600160a01b038216620002285760028054829003905562000247565b6001600160a01b03821660009081526020819052604090208054820190555b816001600160a01b0316836001600160a01b03167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef836040516200028d91815260200190565b60405180910390a3505050565b634e487b7160e01b600052604160045260246000fd5b600181811c90821680620002c557607f821691505b602082108103620002e657634e487b7160e01b600052602260045260246000fd5b50919050565b601f8211156200033a57600081815260208120601f850160051c81016020861015620003155750805b601f850160051c820191505b81811015620003365782815560010162000321565b5050505b505050565b81516001600160401b038111156200035b576200035b6200029a565b62000373816200036c8454620002b0565b84620002ec565b602080601f831160018114620003ab5760008415620003925750858301515b600019600386901b1c1916600185901b17855562000336565b600085815260208120601f198616915b82811015620003dc57888601518255948401946001909101908401620003bb565b5085821015620003fb5787850151600019600388901b60f8161c191681555b5050505050600190811b01905550565b808201808211156200042d57634e487b7160e01b600052601160045260246000fd5b92915050565b6114ae80620004436000396000f3fe608060405234801561001057600080fd5b50600436106101f05760003560e01c80638d0059081161010f578063cd076bfb116100a2578063eb51716e11610071578063eb51716e14610441578063f2fde38b14610449578063fa58ccab1461045c578063ff329e7c1461049857600080fd5b8063cd076bfb146103a7578063d50f8989146103ba578063d6404241146103f5578063dd62ed3e1461040857600080fd5b806395d89b41116100de57806395d89b411461037157806396365d4414610379578063a9059cbb14610381578063b76839991461039457600080fd5b80638d0059081461032d5780638da5cb5b1461033b578063902d55a51461035657806394a611da1461036957600080fd5b80635106803611610187578063766976401161015657806376697640146102e157806379cc6790146102f15780637d1d5d19146103045780638a8772051461030d57600080fd5b806351068036146102ab5780636aa26a94146102b357806370a08231146102c6578063715018a6146102d957600080fd5b806323b872dd116101c357806323b872dd1461026c578063313ce5671461027f57806342966c681461028e5780634fe15335146102a357600080fd5b806306fdde03146101f5578063095ea7b3146102135780630c49f8fa1461023657806318160ddd14610264575b600080fd5b6101fd6104ab565b60405161020a9190611222565b60405180910390f35b61022661022136600461128c565b61053d565b604051901515815260200161020a565b6102566102443660046112b6565b60086020526000908152604090205481565b60405190815260200161020a565b600254610256565b61022661027a3660046112d8565b610557565b6040516012815260200161020a565b6102a161029c366004611314565b61057b565b005b6102a1610588565b6102a16106c4565b6102a16102c1366004611314565b610787565b6102566102d43660046112b6565b610854565b6102a161086f565b610256683635c9adc5dea0000081565b6102a16102ff36600461128c565b610883565b610256610e1081565b61025661031b3660046112b6565b60066020526000908152604090205481565b610256662386f26fc1000081565b6005546040516001600160a01b03909116815260200161020a565b6102566b033b2e3c9fd0803ce800000081565b6102a161089c565b6101fd6108a5565b6102566108b4565b61022661038f36600461128c565b6108c4565b6102566103a23660046112b6565b6108d2565b6102566103b5366004611314565b610960565b6103cd6103c83660046112b6565b61098a565b604080519586526020860194909452928401919091526060830152608082015260a00161020a565b61022661040336600461132d565b610a22565b610256610416366004611350565b6001600160a01b03918216600090815260016020908152604080832093909416825291909152205490565b6102a1610c5f565b6102a16104573660046112b6565b610d29565b61048361046a3660046112b6565b6007602052600090815260409020805460019091015482565b6040805192835260208301919091520161020a565b6102566104a6366004611314565b610d64565b6060600380546104ba90611383565b80601f01602080910402602001604051908101604052809291908181526020018280546104e690611383565b80156105335780601f1061050857610100808354040283529160200191610533565b820191906000526020600020905b81548152906001019060200180831161051657829003601f168201915b5050505050905090565b60003361054b818585610d7c565b60019150505b92915050565b600033610565858285610d8e565b610570858585610e0d565b506001949350505050565b6105853382610e6c565b50565b336000908152600660205260409020546105a590610e10906113d3565b4210156106055760405162461bcd60e51b8152602060048201526024808201527f46617563657420636f6f6c646f776e206163746976652e20576169742031206860448201526337bab91760e11b60648201526084015b60405180910390fd5b683635c9adc5dea0000061061830610854565b101561065d5760405162461bcd60e51b815260206004820152601460248201527346617563657420706f6f6c20697320656d70747960601b60448201526064016105fc565b336000818152600660205260409020429055610684903090683635c9adc5dea00000610e0d565b604051683635c9adc5dea00000815233907f5d4f415c63cd8a5874d9d291cdd64cec37e5dc236d90d659c958d109d78074b39060200160405180910390a2565b33600090815260086020526040812054906106de82610960565b9050806106ea33610854565b10156107085760405162461bcd60e51b81526004016105fc906113e6565b610713333083610e0d565b3360009081526008602052604081208054600192906107339084906113d3565b9091555050336000818152600860209081526040918290205482519081529081018490527f10e8583f43a219c057871d0e4c0ef326be53ac8b9c2b1dec594dcdb4943b367791015b60405180910390a25050565b61078f610ea2565b8061079930610854565b10156107e75760405162461bcd60e51b815260206004820152601960248201527f496e73756666696369656e7420706f6f6c2062616c616e63650000000000000060448201526064016105fc565b610803306107fd6005546001600160a01b031690565b83610e0d565b6005546001600160a01b03166001600160a01b03167f61a0b4d879cd5e5653631acae542581573d52905e66efcbb6246efca1ef306d68260405161084991815260200190565b60405180910390a250565b6001600160a01b031660009081526020819052604090205490565b610877610ea2565b6108816000610ecf565b565b61088e823383610d8e565b6108988282610e6c565b5050565b61088133610f21565b6060600480546104ba90611383565b60006108bf30610854565b905090565b60003361054b818585610e0d565b6001600160a01b0381166000908152600760209081526040808320815180830190925280548083526001909101549282019290925290158061091657506020810151155b156109245750600092915050565b6000816020015142610936919061142c565b8251909150662386f26fc100009061094e908361143f565b610958919061143f565b949350505050565b600061096d8260016113d3565b61097890603261143f565b61055190670de0b6b3a764000061143f565b600080600080600061099b86610854565b6001600160a01b038716600090815260066020526040812054919650906109c590610e10906113d3565b9050804210156109de576109d9428261142c565b6109e1565b60005b6001600160a01b03881660009081526007602090815260408083205460089092529091205491965094509250610a16876108d2565b91505091939590929450565b6000678ac7230489e80000821015610a7c5760405162461bcd60e51b815260206004820152601760248201527f4d696e696d756d206265742069732031302043504c415900000000000000000060448201526064016105fc565b81610a8633610854565b1015610ade5760405162461bcd60e51b815260206004820152602160248201527f496e73756666696369656e742062616c616e636520746f20706c6163652062656044820152601d60fa1b60648201526084016105fc565b81610ae830610854565b1015610b665760405162461bcd60e51b815260206004820152604160248201527f506f6f6c2063616e6e6f7420736166656c7920636f766572207468697320626560448201527f74207269676874206e6f772c20747279206120736d616c6c657220616d6f756e6064820152601d60fa1b608482015260a4016105fc565b610b71333084610e0d565b600042443343604051602001610bb29493929190938452602084019290925260601b6bffffffffffffffffffffffff19166040830152605482015260740190565b60408051601f19818403018152919052805160209091012090506000610bd9600283611456565b159050841515811460008115610c0157610bf486600261143f565b9050610c01303383610e0d565b6040805188151581528315156020820152908101879052606081018290526080810185905233907f252f1e877a9f7e94ea55dac9fd5fd640c5a682d79a42a733bd8a60e6129a322c9060a00160405180910390a25095945050505050565b3360009081526007602052604081205490610c7982610d64565b905080610c8533610854565b1015610ca35760405162461bcd60e51b81526004016105fc906113e6565b610cac33610f21565b610cb7333083610e0d565b336000908152600760205260408120805460019290610cd79084906113d3565b9091555050336000818152600760209081526040918290204260018201555482519081529081018490527f130d426d189045e2db00f9a6350c403f4cc4896b0448c716f54000179040b4e6910161077b565b610d31610ea2565b6001600160a01b038116610d5b57604051631e4fbdf760e01b8152600060048201526024016105fc565b61058581610ecf565b6000610d718260016113d3565b61097890606461143f565b610d898383836001611023565b505050565b6001600160a01b03838116600090815260016020908152604080832093861683529290522054600019811015610e075781811015610df857604051637dc7a0d960e11b81526001600160a01b038416600482015260248101829052604481018390526064016105fc565b610e0784848484036000611023565b50505050565b6001600160a01b038316610e3757604051634b637e8f60e11b8152600060048201526024016105fc565b6001600160a01b038216610e615760405163ec442f0560e01b8152600060048201526024016105fc565b610d898383836110f8565b6001600160a01b038216610e9657604051634b637e8f60e11b8152600060048201526024016105fc565b610898826000836110f8565b6005546001600160a01b031633146108815760405163118cdaa760e01b81523360048201526024016105fc565b600580546001600160a01b038381166001600160a01b0319831681179093556040519116919082907f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e090600090a35050565b6001600160a01b03811660009081526007602052604081208054909103610f4c574260019091015550565b6000816001015442610f5e919061142c565b905080600003610f6d57505050565b8154600090662386f26fc1000090610f85908461143f565b610f8f919061143f565b42600185015590506000819003610fa65750505050565b6000610fb130610854565b90506000818311610fc25782610fc4565b815b9050801561101b57610fd7308783610e0d565b856001600160a01b03167f2b0c260c0010c75eaf0b5071822a9ccf72234a0f0403ea2aa26c61c8afde3f2a8260405161101291815260200190565b60405180910390a25b505050505050565b6001600160a01b03841661104d5760405163e602df0560e01b8152600060048201526024016105fc565b6001600160a01b03831661107757604051634a1406b160e11b8152600060048201526024016105fc565b6001600160a01b0380851660009081526001602090815260408083209387168352929052208290558015610e0757826001600160a01b0316846001600160a01b03167f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925846040516110ea91815260200190565b60405180910390a350505050565b6001600160a01b03831661112357806002600082825461111891906113d3565b909155506111959050565b6001600160a01b038316600090815260208190526040902054818110156111765760405163391434e360e21b81526001600160a01b038516600482015260248101829052604481018390526064016105fc565b6001600160a01b03841660009081526020819052604090209082900390555b6001600160a01b0382166111b1576002805482900390556111d0565b6001600160a01b03821660009081526020819052604090208054820190555b816001600160a01b0316836001600160a01b03167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef8360405161121591815260200190565b60405180910390a3505050565b600060208083528351808285015260005b8181101561124f57858101830151858201604001528201611233565b506000604082860101526040601f19601f8301168501019250505092915050565b80356001600160a01b038116811461128757600080fd5b919050565b6000806040838503121561129f57600080fd5b6112a883611270565b946020939093013593505050565b6000602082840312156112c857600080fd5b6112d182611270565b9392505050565b6000806000606084860312156112ed57600080fd5b6112f684611270565b925061130460208501611270565b9150604084013590509250925092565b60006020828403121561132657600080fd5b5035919050565b6000806040838503121561134057600080fd5b823580151581146112a857600080fd5b6000806040838503121561136357600080fd5b61136c83611270565b915061137a60208401611270565b90509250929050565b600181811c9082168061139757607f821691505b6020821081036113b757634e487b7160e01b600052602260045260246000fd5b50919050565b634e487b7160e01b600052601160045260246000fd5b80820180821115610551576105516113bd565b60208082526026908201527f496e73756666696369656e742043504c41592062616c616e636520666f72207560408201526570677261646560d01b606082015260800190565b81810381811115610551576105516113bd565b8082028115828204841417610551576105516113bd565b60008261147357634e487b7160e01b600052601260045260246000fd5b50069056fea26469706673582212207ae74f5c533ea4076c1414ff25b9366add86fb2b23cce0529781f7ee4b7e03e964736f6c63430008140033";
