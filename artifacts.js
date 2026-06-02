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
  }
];
const CONTRACT_BYTECODE = "0x60806040523480156200001157600080fd5b506040518060400160405280600e81526020016d2130b9b2a83630bc902a37b5b2b760911b8152506040518060400160405280600581526020016442504c415960d81b8152508160039081620000689190620002b6565b506004620000778282620002b6565b505050620000963369d3c21bcecceda10000006200009c60201b60201c565b620003aa565b6001600160a01b038216620000cc5760405163ec442f0560e01b8152600060048201526024015b60405180910390fd5b620000da60008383620000de565b5050565b6001600160a01b0383166200010d57806002600082825462000101919062000382565b90915550620001819050565b6001600160a01b03831660009081526020819052604090205481811015620001625760405163391434e360e21b81526001600160a01b03851660048201526024810182905260448101839052606401620000c3565b6001600160a01b03841660009081526020819052604090209082900390555b6001600160a01b0382166200019f57600280548290039055620001be565b6001600160a01b03821660009081526020819052604090208054820190555b816001600160a01b0316836001600160a01b03167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef836040516200020491815260200190565b60405180910390a3505050565b634e487b7160e01b600052604160045260246000fd5b600181811c908216806200023c57607f821691505b6020821081036200025d57634e487b7160e01b600052602260045260246000fd5b50919050565b601f821115620002b157600081815260208120601f850160051c810160208610156200028c5750805b601f850160051c820191505b81811015620002ad5782815560010162000298565b5050505b505050565b81516001600160401b03811115620002d257620002d262000211565b620002ea81620002e3845462000227565b8462000263565b602080601f831160018114620003225760008415620003095750858301515b600019600386901b1c1916600185901b178555620002ad565b600085815260208120601f198616915b82811015620003535788860151825594840194600190910190840162000332565b5085821015620003725787850151600019600388901b60f8161c191681555b5050505050600190811b01905550565b80820180821115620003a457634e487b7160e01b600052601160045260246000fd5b92915050565b61118480620003ba6000396000f3fe608060405234801561001057600080fd5b506004361061018e5760003560e01c80638a877205116100de578063cd076bfb11610097578063dd62ed3e11610071578063dd62ed3e1461036b578063eb51716e146103a4578063fa58ccab146103ac578063ff329e7c146103e857600080fd5b8063cd076bfb1461030a578063d50f89891461031d578063d64042411461035857600080fd5b80638a877205146102a65780638d005908146102c657806394a611da146102d457806395d89b41146102dc578063a9059cbb146102e4578063b7683999146102f757600080fd5b806342966c681161014b57806370a082311161012557806370a0823114610251578063766976401461027a57806379cc67901461028a5780637d1d5d191461029d57600080fd5b806342966c681461022c5780634fe1533514610241578063510680361461024957600080fd5b806306fdde0314610193578063095ea7b3146101b15780630c49f8fa146101d457806318160ddd1461020257806323b872dd1461020a578063313ce5671461021d575b600080fd5b61019b6103fb565b6040516101a89190610ef8565b60405180910390f35b6101c46101bf366004610f62565b61048d565b60405190151581526020016101a8565b6101f46101e2366004610f8c565b60076020526000908152604090205481565b6040519081526020016101a8565b6002546101f4565b6101c4610218366004610fae565b6104a7565b604051601281526020016101a8565b61023f61023a366004610fea565b6104cb565b005b61023f6104d8565b61023f6105ba565b6101f461025f366004610f8c565b6001600160a01b031660009081526020819052604090205490565b6101f4683635c9adc5dea0000081565b61023f610298366004610f62565b610684565b6101f4610e1081565b6101f46102b4366004610f8c565b60056020526000908152604090205481565b6101f4662386f26fc1000081565b61023f61069d565b61019b6106a8565b6101c46102f2366004610f62565b6106b7565b6101f4610305366004610f8c565b6106c5565b6101f4610318366004610fea565b610753565b61033061032b366004610f8c565b61077d565b604080519586526020860194909452928401919091526060830152608082015260a0016101a8565b6101c4610366366004611003565b61082b565b6101f4610379366004611026565b6001600160a01b03918216600090815260016020908152604080832093909416825291909152205490565b61023f6109e5565b6103d36103ba366004610f8c565b6006602052600090815260409020805460019091015482565b604080519283526020830191909152016101a8565b6101f46103f6366004610fea565b610ab6565b60606003805461040a90611059565b80601f016020809104026020016040519081016040528092919081815260200182805461043690611059565b80156104835780601f1061045857610100808354040283529160200191610483565b820191906000526020600020905b81548152906001019060200180831161046657829003601f168201915b5050505050905090565b60003361049b818585610ace565b60019150505b92915050565b6000336104b5858285610ae0565b6104c0858585610b5f565b506001949350505050565b6104d53382610bbe565b50565b336000908152600560205260409020546104f590610e10906110a9565b4210156105555760405162461bcd60e51b8152602060048201526024808201527f46617563657420636f6f6c646f776e206163746976652e20576169742031206860448201526337bab91760e11b60648201526084015b60405180910390fd5b33600081815260056020526040902042905561057a90683635c9adc5dea00000610bf4565b604051683635c9adc5dea00000815233907f5d4f415c63cd8a5874d9d291cdd64cec37e5dc236d90d659c958d109d78074b39060200160405180910390a2565b33600090815260076020526040812054906105d482610753565b336000908152602081905260409020549091508111156106065760405162461bcd60e51b815260040161054c906110bc565b6106103382610bbe565b3360009081526007602052604081208054600192906106309084906110a9565b9091555050336000818152600760209081526040918290205482519081529081018490527f10e8583f43a219c057871d0e4c0ef326be53ac8b9c2b1dec594dcdb4943b367791015b60405180910390a25050565b61068f823383610ae0565b6106998282610bbe565b5050565b6106a633610c2a565b565b60606004805461040a90611059565b60003361049b818585610b5f565b6001600160a01b0381166000908152600660209081526040808320815180830190925280548083526001909101549282019290925290158061070957506020810151155b156107175750600092915050565b60008160200151426107299190611102565b8251909150662386f26fc10000906107419083611115565b61074b9190611115565b949350505050565b60006107608260016110a9565b61076b906032611115565b6104a190670de0b6b3a7640000611115565b60008060008060006107a4866001600160a01b031660009081526020819052604090205490565b6001600160a01b038716600090815260056020526040812054919650906107ce90610e10906110a9565b9050804210156107e7576107e24282611102565b6107ea565b60005b6001600160a01b0388166000908152600660209081526040808320546007909252909120549196509450925061081f876106c5565b91505091939590929450565b6000678ac7230489e800008210156108855760405162461bcd60e51b815260206004820152601760248201527f4d696e696d756d206265742069732031302042504c4159000000000000000000604482015260640161054c565b336000908152602081905260409020548211156108ee5760405162461bcd60e51b815260206004820152602160248201527f496e73756666696369656e742062616c616e636520746f20706c6163652062656044820152601d60fa1b606482015260840161054c565b6108f83383610bbe565b6000424433436040516020016109399493929190938452602084019290925260601b6bffffffffffffffffffffffff19166040830152605482015260740190565b60408051601f1981840301815291905280516020909101209050600061096060028361112c565b1590508415158114600081156109875761097b866002611115565b90506109873382610bf4565b6040805188151581528315156020820152908101879052606081018290526080810185905233907f252f1e877a9f7e94ea55dac9fd5fd640c5a682d79a42a733bd8a60e6129a322c9060a00160405180910390a25095945050505050565b33600090815260066020526040812054906109ff82610ab6565b33600090815260208190526040902054909150811115610a315760405162461bcd60e51b815260040161054c906110bc565b610a3a33610c2a565b610a443382610bbe565b336000908152600660205260408120805460019290610a649084906110a9565b9091555050336000818152600660209081526040918290204260018201555482519081529081018490527f130d426d189045e2db00f9a6350c403f4cc4896b0448c716f54000179040b4e69101610678565b6000610ac38260016110a9565b61076b906064611115565b610adb8383836001610cf9565b505050565b6001600160a01b03838116600090815260016020908152604080832093861683529290522054600019811015610b595781811015610b4a57604051637dc7a0d960e11b81526001600160a01b0384166004820152602481018290526044810183905260640161054c565b610b5984848484036000610cf9565b50505050565b6001600160a01b038316610b8957604051634b637e8f60e11b81526000600482015260240161054c565b6001600160a01b038216610bb35760405163ec442f0560e01b81526000600482015260240161054c565b610adb838383610dce565b6001600160a01b038216610be857604051634b637e8f60e11b81526000600482015260240161054c565b61069982600083610dce565b6001600160a01b038216610c1e5760405163ec442f0560e01b81526000600482015260240161054c565b61069960008383610dce565b6001600160a01b03811660009081526006602052604081208054909103610c55574260019091015550565b6000816001015442610c679190611102565b905080600003610c7657505050565b8154600090662386f26fc1000090610c8e9084611115565b610c989190611115565b42600185015590508015610b5957610cb08482610bf4565b836001600160a01b03167f2b0c260c0010c75eaf0b5071822a9ccf72234a0f0403ea2aa26c61c8afde3f2a82604051610ceb91815260200190565b60405180910390a250505050565b6001600160a01b038416610d235760405163e602df0560e01b81526000600482015260240161054c565b6001600160a01b038316610d4d57604051634a1406b160e11b81526000600482015260240161054c565b6001600160a01b0380851660009081526001602090815260408083209387168352929052208290558015610b5957826001600160a01b0316846001600160a01b03167f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b92584604051610dc091815260200190565b60405180910390a350505050565b6001600160a01b038316610df9578060026000828254610dee91906110a9565b90915550610e6b9050565b6001600160a01b03831660009081526020819052604090205481811015610e4c5760405163391434e360e21b81526001600160a01b0385166004820152602481018290526044810183905260640161054c565b6001600160a01b03841660009081526020819052604090209082900390555b6001600160a01b038216610e8757600280548290039055610ea6565b6001600160a01b03821660009081526020819052604090208054820190555b816001600160a01b0316836001600160a01b03167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef83604051610eeb91815260200190565b60405180910390a3505050565b600060208083528351808285015260005b81811015610f2557858101830151858201604001528201610f09565b506000604082860101526040601f19601f8301168501019250505092915050565b80356001600160a01b0381168114610f5d57600080fd5b919050565b60008060408385031215610f7557600080fd5b610f7e83610f46565b946020939093013593505050565b600060208284031215610f9e57600080fd5b610fa782610f46565b9392505050565b600080600060608486031215610fc357600080fd5b610fcc84610f46565b9250610fda60208501610f46565b9150604084013590509250925092565b600060208284031215610ffc57600080fd5b5035919050565b6000806040838503121561101657600080fd5b82358015158114610f7e57600080fd5b6000806040838503121561103957600080fd5b61104283610f46565b915061105060208401610f46565b90509250929050565b600181811c9082168061106d57607f821691505b60208210810361108d57634e487b7160e01b600052602260045260246000fd5b50919050565b634e487b7160e01b600052601160045260246000fd5b808201808211156104a1576104a1611093565b60208082526026908201527f496e73756666696369656e742042504c41592062616c616e636520666f72207560408201526570677261646560d01b606082015260800190565b818103818111156104a1576104a1611093565b80820281158282048414176104a1576104a1611093565b60008261114957634e487b7160e01b600052601260045260246000fd5b50069056fea264697066735822122094139ddb5e81a7cffb20b7fc97e1637bd0c51994578126dc4c0a85a77687a7c764736f6c63430008140033";
