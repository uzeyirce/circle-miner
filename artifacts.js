// Auto-generated from Hardhat compilation. Do not edit.
const CONTRACT_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "tokenAddress",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "vaultAddress",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
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
        "name": "vaultShare",
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
        "name": "vaultShare",
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
    "name": "CIRCLE_MINER_ENABLED",
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
    "name": "LUCKY_FLIP_ENABLED",
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
    "name": "buyClickUpgrade",
    "outputs": [],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "buyMinerUpgrade",
    "outputs": [],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "claimFaucet",
    "outputs": [],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "claimMining",
    "outputs": [],
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
    "name": "cplayToken",
    "outputs": [
      {
        "internalType": "contract IERC20",
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
    "name": "getPlayerProfile",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "balance",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "circleMinerEnabled",
        "type": "bool"
      },
      {
        "internalType": "bool",
        "name": "luckyFlipEnabled",
        "type": "bool"
      },
      {
        "internalType": "uint256",
        "name": "allowanceGiven",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "vaultBalanceNow",
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
    "inputs": [],
    "name": "renounceOwnership",
    "outputs": [],
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
    "name": "vault",
    "outputs": [
      {
        "internalType": "contract ICPlayVault",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];
const CONTRACT_BYTECODE = "0x60c060405234801561001057600080fd5b506040516200108c3803806200108c83398101604081905261003191610191565b338061005857604051631e4fbdf760e01b8152600060048201526024015b60405180910390fd5b61006181610125565b506001600160a01b0382166100b85760405162461bcd60e51b815260206004820152601560248201527f496e76616c696420746f6b656e20616464726573730000000000000000000000604482015260640161004f565b6001600160a01b03811661010e5760405162461bcd60e51b815260206004820152601560248201527f496e76616c6964207661756c7420616464726573730000000000000000000000604482015260640161004f565b6001600160a01b039182166080521660a0526101c4565b600080546001600160a01b038381166001600160a01b0319831681178455604051919092169283917f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e09190a35050565b80516001600160a01b038116811461018c57600080fd5b919050565b600080604083850312156101a457600080fd5b6101ad83610175565b91506101bb60208401610175565b90509250929050565b60805160a051610e5c6200023060003960008181610300015281816104ee015281816107b3015281816109570152610c2301526000818161014c015281816103b30152818161047d015281816105ea015281816106d201528181610b0c0152610c520152610e5c6000f3fe608060405234801561001057600080fd5b50600436106101425760003560e01c80638d005908116100b8578063d64042411161007c578063d640424114610290578063e1a45218146102a3578063eb51716e146101d1578063f2fde38b146102ac578063fa58ccab146102bf578063fbfa77cf146102fb57600080fd5b80638d005908146102265780638da5cb5b1461023457806394a611da146101d1578063be37822814610245578063d50f89891461024e57600080fd5b80636540742f1161010a5780636540742f146101db5780636b33485b146101ea5780636db7494a146101f2578063715018a61461021557806376697640146101db578063866c8b921461021d57600080fd5b806301947389146101475780630c49f8fa1461018b57806342142a74146101b95780634fe15335146101d157806351068036146101d1575b600080fd5b61016e7f000000000000000000000000000000000000000000000000000000000000000081565b6040516001600160a01b0390911681526020015b60405180910390f35b6101ab610199366004610d08565b60036020526000908152604090205481565b604051908152602001610182565b6101c1600081565b6040519015158152602001610182565b6101d9610322565b005b6101ab678ac7230489e8000081565b6101c1600181565b6101c1610200366004610d08565b60016020526000908152604090205460ff1681565b6101d9610395565b6101ab61426881565b6101ab66038d7ea4c6800081565b6000546001600160a01b031661016e565b6101ab6103e881565b61026161025c366004610d08565b6103a9565b604051610182959493929190948552921515602085015290151560408401526060830152608082015260a00190565b6101c161029e366004610d46565b610579565b6101ab61271081565b6101d96102ba366004610d08565b610a25565b6102e66102cd366004610d08565b6002602052600090815260409020805460019091015482565b60408051928352602083019190915201610182565b61016e7f000000000000000000000000000000000000000000000000000000000000000081565b60405162461bcd60e51b815260206004820152603c60248201527f436972636c65204d696e6572206973206e6f74206c69766520796574202d204c60448201527f75636b7920466c6970206f6e6c7920696e20746869732070686173650000000060648201526084015b60405180910390fd5b61039d610a63565b6103a76000610a90565b565b60008060008060007f00000000000000000000000000000000000000000000000000000000000000006001600160a01b03166370a08231876040518263ffffffff1660e01b815260040161040c91906001600160a01b0391909116815260200190565b602060405180830381865afa158015610429573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061044d9190610d72565b604051636eb1769f60e11b81526001600160a01b03888116600483015230602483015291965060009550600194507f00000000000000000000000000000000000000000000000000000000000000009091169063dd62ed3e90604401602060405180830381865afa1580156104c6573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906104ea9190610d72565b91507f00000000000000000000000000000000000000000000000000000000000000006001600160a01b0316630bf6cc086040518163ffffffff1660e01b8152600401602060405180830381865afa15801561054a573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061056e9190610d72565b905091939590929450565b6000678ac7230489e800008210156105d35760405162461bcd60e51b815260206004820152601760248201527f4d696e696d756d206265742069732031302043504c4159000000000000000000604482015260640161038c565b6040516370a0823160e01b815233600482015282907f00000000000000000000000000000000000000000000000000000000000000006001600160a01b0316906370a0823190602401602060405180830381865afa158015610639573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061065d9190610d72565b10156106b55760405162461bcd60e51b815260206004820152602160248201527f496e73756666696369656e742062616c616e636520746f20706c6163652062656044820152601d60fa1b606482015260840161038c565b604051636eb1769f60e11b815233600482015230602482015282907f00000000000000000000000000000000000000000000000000000000000000006001600160a01b03169063dd62ed3e90604401602060405180830381865afa158015610721573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906107459190610d72565b10156107935760405162461bcd60e51b815260206004820152601960248201527f417070726f76652043504c4159207370656e6420666972737400000000000000604482015260640161038c565b60006127106107a461426885610da1565b6107ae9190610dce565b9050807f00000000000000000000000000000000000000000000000000000000000000006001600160a01b0316630bf6cc086040518163ffffffff1660e01b8152600401602060405180830381865afa15801561080f573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906108339190610d72565b10156108b25760405162461bcd60e51b815260206004820152604260248201527f5661756c742063616e6e6f7420736166656c7920636f7665722074686973206260448201527f6574207269676874206e6f772c20747279206120736d616c6c657220616d6f756064820152611b9d60f21b608482015260a40161038c565b60006108bd84610ae0565b5090506000424433436040516020016109019493929190938452602084019290925260601b6bffffffffffffffffffffffff19166040830152605482015260740190565b60408051601f19818403018152919052805160209091012090506000610928600283610de2565b1590508615158114600081156109bc575060405163117de2fd60e01b81523360048201526024810186905285907f00000000000000000000000000000000000000000000000000000000000000006001600160a01b03169063117de2fd90604401600060405180830381600087803b1580156109a357600080fd5b505af11580156109b7573d6000803e3d6000fd5b505050505b604080518a151581528315156020820152908101899052606081018690526080810182905260a0810185905233907f297323638f1fb29c47d160a516642b7b8be1b5e42e1038d6dde058e253fbe5249060c00160405180910390a2509450505050505b92915050565b610a2d610a63565b6001600160a01b038116610a5757604051631e4fbdf760e01b81526000600482015260240161038c565b610a6081610a90565b50565b6000546001600160a01b031633146103a75760405163118cdaa760e01b815233600482015260240161038c565b600080546001600160a01b038381166001600160a01b0319831681178455604051919092169283917f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e09190a35050565b600080612710610af26103e885610da1565b610afc9190610dce565b9150610b088284610df6565b90507f00000000000000000000000000000000000000000000000000000000000000006001600160a01b03166323b872dd33610b4c6000546001600160a01b031690565b6040516001600160e01b031960e085901b1681526001600160a01b03928316600482015291166024820152604481018590526064016020604051808303816000875af1158015610ba0573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610bc49190610e09565b610c065760405162461bcd60e51b8152602060048201526013602482015272119959481d1c985b9cd9995c8819985a5b1959606a1b604482015260640161038c565b6040516323b872dd60e01b81523360048201526001600160a01b037f000000000000000000000000000000000000000000000000000000000000000081166024830152604482018390527f000000000000000000000000000000000000000000000000000000000000000016906323b872dd906064016020604051808303816000875af1158015610c9b573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610cbf9190610e09565b610d035760405162461bcd60e51b815260206004820152601560248201527415985d5b1d081d1c985b9cd9995c8819985a5b1959605a1b604482015260640161038c565b915091565b600060208284031215610d1a57600080fd5b81356001600160a01b0381168114610d3157600080fd5b9392505050565b8015158114610a6057600080fd5b60008060408385031215610d5957600080fd5b8235610d6481610d38565b946020939093013593505050565b600060208284031215610d8457600080fd5b5051919050565b634e487b7160e01b600052601160045260246000fd5b8082028115828204841417610a1f57610a1f610d8b565b634e487b7160e01b600052601260045260246000fd5b600082610ddd57610ddd610db8565b500490565b600082610df157610df1610db8565b500690565b81810381811115610a1f57610a1f610d8b565b600060208284031215610e1b57600080fd5b8151610d3181610d3856fea264697066735822122059e5dec20b967207455662610d078172f567c91fc188fdc0e1a6462bc912276464736f6c63430008140033";
