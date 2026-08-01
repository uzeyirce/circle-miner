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
        "internalType": "string",
        "name": "username",
        "type": "string"
      }
    ],
    "name": "UsernameSet",
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
      },
      {
        "internalType": "string",
        "name": "username",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "playerTotalWinnings",
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
        "internalType": "string",
        "name": "newUsername",
        "type": "string"
      }
    ],
    "name": "setUsername",
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
    "name": "totalWinnings",
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
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "usernames",
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
const CONTRACT_BYTECODE = "0x60c06040523480156200001157600080fd5b506040516200163f3803806200163f83398101604081905262000034916200019d565b33806200005c57604051631e4fbdf760e01b8152600060048201526024015b60405180910390fd5b620000678162000130565b506001600160a01b038216620000c05760405162461bcd60e51b815260206004820152601560248201527f496e76616c696420746f6b656e20616464726573730000000000000000000000604482015260640162000053565b6001600160a01b038116620001185760405162461bcd60e51b815260206004820152601560248201527f496e76616c6964207661756c7420616464726573730000000000000000000000604482015260640162000053565b6001600160a01b039182166080521660a052620001d5565b600080546001600160a01b038381166001600160a01b0319831681178455604051919092169283917f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e09190a35050565b80516001600160a01b03811681146200019857600080fd5b919050565b60008060408385031215620001b157600080fd5b620001bc8362000180565b9150620001cc6020840162000180565b90509250929050565b60805160a0516113fe62000241600039600081816103680152818161055a015281816108e401528181610a880152610f0f01526000818161017d0152818161041f015281816104e90152818161071b0152818161080301528181610df80152610f3e01526113fe6000f3fe608060405234801561001057600080fd5b50600436106101735760003560e01c80638d005908116100de578063e1a4521811610097578063ee91877c11610071578063ee91877c146102f4578063f2fde38b14610314578063fa58ccab14610327578063fbfa77cf1461036357600080fd5b8063e1a45218146102d8578063eb51716e14610202578063ed59313a146102e157600080fd5b80638d005908146102775780638da5cb5b1461028557806394a611da14610202578063be37822814610296578063d50f89891461029f578063d6404241146102c557600080fd5b80636b33485b116101305780636b33485b1461021b5780636db7494a14610223578063715018a614610246578063766976401461020c578063866c8b921461024e5780638b8840e01461025757600080fd5b806301947389146101785780630c49f8fa146101bc57806342142a74146101ea5780634fe153351461020257806351068036146102025780636540742f1461020c575b600080fd5b61019f7f000000000000000000000000000000000000000000000000000000000000000081565b6040516001600160a01b0390911681526020015b60405180910390f35b6101dc6101ca366004610ff4565b60036020526000908152604090205481565b6040519081526020016101b3565b6101f2600081565b60405190151581526020016101b3565b61020a61038a565b005b6101dc678ac7230489e8000081565b6101f2600181565b6101f2610231366004610ff4565b60016020526000908152604090205460ff1681565b61020a6103fd565b6101dc61426881565b6101dc610265366004610ff4565b60056020526000908152604090205481565b6101dc66038d7ea4c6800081565b6000546001600160a01b031661019f565b6101dc6103e881565b6102b26102ad366004610ff4565b610411565b6040516101b3979695949392919061106a565b6101f26102d33660046110c1565b6106aa565b6101dc61271081565b61020a6102ef3660046110ed565b610b7b565b610307610302366004610ff4565b610c77565b6040516101b3919061115f565b61020a610322366004610ff4565b610d11565b61034e610335366004610ff4565b6002602052600090815260409020805460019091015482565b604080519283526020830191909152016101b3565b61019f7f000000000000000000000000000000000000000000000000000000000000000081565b60405162461bcd60e51b815260206004820152603c60248201527f436972636c65204d696e6572206973206e6f74206c69766520796574202d204c60448201527f75636b7920466c6970206f6e6c7920696e20746869732070686173650000000060648201526084015b60405180910390fd5b610405610d4f565b61040f6000610d7c565b565b6000806000806000606060007f00000000000000000000000000000000000000000000000000000000000000006001600160a01b03166370a08231896040518263ffffffff1660e01b815260040161047891906001600160a01b0391909116815260200190565b602060405180830381865afa158015610495573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906104b99190611172565b604051636eb1769f60e11b81526001600160a01b038a8116600483015230602483015291985060009750600196507f00000000000000000000000000000000000000000000000000000000000000009091169063dd62ed3e90604401602060405180830381865afa158015610532573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906105569190611172565b93507f00000000000000000000000000000000000000000000000000000000000000006001600160a01b0316630bf6cc086040518163ffffffff1660e01b8152600401602060405180830381865afa1580156105b6573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906105da9190611172565b6001600160a01b03891660009081526004602052604090208054919450906106019061118b565b80601f016020809104026020016040519081016040528092919081815260200182805461062d9061118b565b801561067a5780601f1061064f5761010080835404028352916020019161067a565b820191906000526020600020905b81548152906001019060200180831161065d57829003601f168201915b5050506001600160a01b03909a16600090815260056020526040902054989a979950959794969395509392915050565b6000678ac7230489e800008210156107045760405162461bcd60e51b815260206004820152601760248201527f4d696e696d756d206265742069732031302043504c415900000000000000000060448201526064016103f4565b6040516370a0823160e01b815233600482015282907f00000000000000000000000000000000000000000000000000000000000000006001600160a01b0316906370a0823190602401602060405180830381865afa15801561076a573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061078e9190611172565b10156107e65760405162461bcd60e51b815260206004820152602160248201527f496e73756666696369656e742062616c616e636520746f20706c6163652062656044820152601d60fa1b60648201526084016103f4565b604051636eb1769f60e11b815233600482015230602482015282907f00000000000000000000000000000000000000000000000000000000000000006001600160a01b03169063dd62ed3e90604401602060405180830381865afa158015610852573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906108769190611172565b10156108c45760405162461bcd60e51b815260206004820152601960248201527f417070726f76652043504c4159207370656e642066697273740000000000000060448201526064016103f4565b60006127106108d5614268856111db565b6108df9190611208565b9050807f00000000000000000000000000000000000000000000000000000000000000006001600160a01b0316630bf6cc086040518163ffffffff1660e01b8152600401602060405180830381865afa158015610940573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906109649190611172565b10156109e35760405162461bcd60e51b815260206004820152604260248201527f5661756c742063616e6e6f7420736166656c7920636f7665722074686973206260448201527f6574207269676874206e6f772c20747279206120736d616c6c657220616d6f756064820152611b9d60f21b608482015260a4016103f4565b60006109ee84610dcc565b509050600042443343604051602001610a329493929190938452602084019290925260601b6bffffffffffffffffffffffff19166040830152605482015260740190565b60408051601f19818403018152919052805160209091012090506000610a5960028361121c565b159050861515811460008115610b12575060405163117de2fd60e01b81523360048201526024810186905285907f00000000000000000000000000000000000000000000000000000000000000006001600160a01b03169063117de2fd90604401600060405180830381600087803b158015610ad457600080fd5b505af1158015610ae8573d6000803e3d6000fd5b50503360009081526005602052604081208054859450909250610b0c908490611230565b90915550505b604080518a151581528315156020820152908101899052606081018690526080810182905260a0810185905233907f297323638f1fb29c47d160a516642b7b8be1b5e42e1038d6dde058e253fbe5249060c00160405180910390a2509450505050505b92915050565b600082828080601f016020809104026020016040519081016040528093929190818152602001838380828437600092019190915250508251929350505015801590610bc857506014815111155b610c145760405162461bcd60e51b815260206004820181905260248201527f557365726e616d65206d75737420626520312d3230206368617261637465727360448201526064016103f4565b336000908152600460205260409020610c2e8385836112a8565b50336001600160a01b03167f74d8e560d2e870c35b35dc882df2a5c96e2bf1cdb5ef6dd2f9cb433c8d0488538484604051610c6a929190611369565b60405180910390a2505050565b60046020526000908152604090208054610c909061118b565b80601f0160208091040260200160405190810160405280929190818152602001828054610cbc9061118b565b8015610d095780601f10610cde57610100808354040283529160200191610d09565b820191906000526020600020905b815481529060010190602001808311610cec57829003601f168201915b505050505081565b610d19610d4f565b6001600160a01b038116610d4357604051631e4fbdf760e01b8152600060048201526024016103f4565b610d4c81610d7c565b50565b6000546001600160a01b0316331461040f5760405163118cdaa760e01b81523360048201526024016103f4565b600080546001600160a01b038381166001600160a01b0319831681178455604051919092169283917f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e09190a35050565b600080612710610dde6103e8856111db565b610de89190611208565b9150610df48284611398565b90507f00000000000000000000000000000000000000000000000000000000000000006001600160a01b03166323b872dd33610e386000546001600160a01b031690565b6040516001600160e01b031960e085901b1681526001600160a01b03928316600482015291166024820152604481018590526064016020604051808303816000875af1158015610e8c573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610eb091906113ab565b610ef25760405162461bcd60e51b8152602060048201526013602482015272119959481d1c985b9cd9995c8819985a5b1959606a1b60448201526064016103f4565b6040516323b872dd60e01b81523360048201526001600160a01b037f000000000000000000000000000000000000000000000000000000000000000081166024830152604482018390527f000000000000000000000000000000000000000000000000000000000000000016906323b872dd906064016020604051808303816000875af1158015610f87573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610fab91906113ab565b610fef5760405162461bcd60e51b815260206004820152601560248201527415985d5b1d081d1c985b9cd9995c8819985a5b1959605a1b60448201526064016103f4565b915091565b60006020828403121561100657600080fd5b81356001600160a01b038116811461101d57600080fd5b9392505050565b6000815180845260005b8181101561104a5760208185018101518683018201520161102e565b506000602082860101526020601f19601f83011685010191505092915050565b8781528615156020820152851515604082015284606082015283608082015260e060a0820152600061109f60e0830185611024565b90508260c083015298975050505050505050565b8015158114610d4c57600080fd5b600080604083850312156110d457600080fd5b82356110df816110b3565b946020939093013593505050565b6000806020838503121561110057600080fd5b823567ffffffffffffffff8082111561111857600080fd5b818501915085601f83011261112c57600080fd5b81358181111561113b57600080fd5b86602082850101111561114d57600080fd5b60209290920196919550909350505050565b60208152600061101d6020830184611024565b60006020828403121561118457600080fd5b5051919050565b600181811c9082168061119f57607f821691505b6020821081036111bf57634e487b7160e01b600052602260045260246000fd5b50919050565b634e487b7160e01b600052601160045260246000fd5b8082028115828204841417610b7557610b756111c5565b634e487b7160e01b600052601260045260246000fd5b600082611217576112176111f2565b500490565b60008261122b5761122b6111f2565b500690565b80820180821115610b7557610b756111c5565b634e487b7160e01b600052604160045260246000fd5b601f8211156112a357600081815260208120601f850160051c810160208610156112805750805b601f850160051c820191505b8181101561129f5782815560010161128c565b5050505b505050565b67ffffffffffffffff8311156112c0576112c0611243565b6112d4836112ce835461118b565b83611259565b6000601f84116001811461130857600085156112f05750838201355b600019600387901b1c1916600186901b178355611362565b600083815260209020601f19861690835b828110156113395786850135825560209485019460019092019101611319565b50868210156113565760001960f88860031b161c19848701351681555b505060018560011b0183555b5050505050565b60208152816020820152818360408301376000818301604090810191909152601f909201601f19160101919050565b81810381811115610b7557610b756111c5565b6000602082840312156113bd57600080fd5b815161101d816110b356fea2646970667358221220f2bf521002b928d9e11d612c6a68a3a509cb69e71b5685c7eaaf9e0e2a74e85b64736f6c63430008140033";
