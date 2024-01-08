export type TokenSwap = {
  "version": "0.1.0",
  "name": "token_swap",
  "instructions": [
    {
      "name": "initialize",
      "accounts": [
        {
          "name": "state",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "tokenAccountAuthority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "inputMint",
          "type": "publicKey"
        },
        {
          "name": "outputMint",
          "type": "publicKey"
        },
        {
          "name": "swapRateTolerance",
          "type": "u64"
        },
        {
          "name": "pythPriceFeedKey",
          "type": "publicKey"
        },
        {
          "name": "priceFeedStalenessThreshold",
          "type": "u64"
        },
        {
          "name": "updateAuthority",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "update",
      "accounts": [
        {
          "name": "state",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "inputMint",
          "type": "publicKey"
        },
        {
          "name": "outputMint",
          "type": "publicKey"
        },
        {
          "name": "swapRateTolerance",
          "type": "u64"
        },
        {
          "name": "pythPriceFeedKey",
          "type": "publicKey"
        },
        {
          "name": "priceFeedStalenessThreshold",
          "type": "u64"
        }
      ]
    },
    {
      "name": "wrap",
      "accounts": [
        {
          "name": "state",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenAccountAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenAccount",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The account containing tokens that will be transferred through the bridge"
          ]
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "swap",
      "accounts": [
        {
          "name": "state",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenAccountAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "inputMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenAtaAddressIn",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "outputMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenAtaAddressOut",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "jupiterProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "pythPriceFeedAccount",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "routeInfo",
          "type": "bytes"
        }
      ]
    },
    {
      "name": "bridge",
      "accounts": [
        {
          "name": "state",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The state account that identifies the mint of the token being transferred through the bridge",
            "and is also the token account authority"
          ]
        },
        {
          "name": "bridgeAuthority",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The wormhole bridge authority. This is the authority that will sign the bridge transaction",
            "and therefore needs to be a delegate on the token account.",
            "It will also be listed in the remainingAccounts list that are populated directly from the generated wormhole transaction on the client"
          ]
        },
        {
          "name": "tokenAccountAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenAccount",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The account containing tokens that will be transferred through the bridge"
          ]
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "wormholeProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "bridgeData",
          "type": "bytes"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "state",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "inputMint",
            "type": "publicKey"
          },
          {
            "name": "outputMint",
            "type": "publicKey"
          },
          {
            "name": "tolerance",
            "type": "u64"
          },
          {
            "name": "pythPriceFeedKey",
            "type": "publicKey"
          },
          {
            "name": "priceFeedStalenessThreshold",
            "type": "u64"
          },
          {
            "name": "updateAuthority",
            "type": "publicKey"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "UndesirableSwapRate",
      "msg": "Swap rate below accepted tolerance"
    },
    {
      "code": 6001,
      "name": "IncorrectTokenAuthority",
      "msg": "Incorrect token authority"
    },
    {
      "code": 6002,
      "name": "IncorrectPriceFeedOracleAccount",
      "msg": "Incorrect pyth price feed oracle account"
    }
  ]
};

export const IDL: TokenSwap = {
  "version": "0.1.0",
  "name": "token_swap",
  "instructions": [
    {
      "name": "initialize",
      "accounts": [
        {
          "name": "state",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "tokenAccountAuthority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "inputMint",
          "type": "publicKey"
        },
        {
          "name": "outputMint",
          "type": "publicKey"
        },
        {
          "name": "swapRateTolerance",
          "type": "u64"
        },
        {
          "name": "pythPriceFeedKey",
          "type": "publicKey"
        },
        {
          "name": "priceFeedStalenessThreshold",
          "type": "u64"
        },
        {
          "name": "updateAuthority",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "update",
      "accounts": [
        {
          "name": "state",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "inputMint",
          "type": "publicKey"
        },
        {
          "name": "outputMint",
          "type": "publicKey"
        },
        {
          "name": "swapRateTolerance",
          "type": "u64"
        },
        {
          "name": "pythPriceFeedKey",
          "type": "publicKey"
        },
        {
          "name": "priceFeedStalenessThreshold",
          "type": "u64"
        }
      ]
    },
    {
      "name": "wrap",
      "accounts": [
        {
          "name": "state",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenAccountAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenAccount",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The account containing tokens that will be transferred through the bridge"
          ]
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "swap",
      "accounts": [
        {
          "name": "state",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenAccountAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "inputMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenAtaAddressIn",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "outputMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenAtaAddressOut",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "jupiterProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "pythPriceFeedAccount",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "routeInfo",
          "type": "bytes"
        }
      ]
    },
    {
      "name": "bridge",
      "accounts": [
        {
          "name": "state",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The state account that identifies the mint of the token being transferred through the bridge",
            "and is also the token account authority"
          ]
        },
        {
          "name": "bridgeAuthority",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The wormhole bridge authority. This is the authority that will sign the bridge transaction",
            "and therefore needs to be a delegate on the token account.",
            "It will also be listed in the remainingAccounts list that are populated directly from the generated wormhole transaction on the client"
          ]
        },
        {
          "name": "tokenAccountAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenAccount",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The account containing tokens that will be transferred through the bridge"
          ]
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "wormholeProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "bridgeData",
          "type": "bytes"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "state",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "inputMint",
            "type": "publicKey"
          },
          {
            "name": "outputMint",
            "type": "publicKey"
          },
          {
            "name": "tolerance",
            "type": "u64"
          },
          {
            "name": "pythPriceFeedKey",
            "type": "publicKey"
          },
          {
            "name": "priceFeedStalenessThreshold",
            "type": "u64"
          },
          {
            "name": "updateAuthority",
            "type": "publicKey"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "UndesirableSwapRate",
      "msg": "Swap rate below accepted tolerance"
    },
    {
      "code": 6001,
      "name": "IncorrectTokenAuthority",
      "msg": "Incorrect token authority"
    },
    {
      "code": 6002,
      "name": "IncorrectPriceFeedOracleAccount",
      "msg": "Incorrect pyth price feed oracle account"
    }
  ]
};
