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
          "name": "outputMint",
          "type": "publicKey"
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
          "name": "jupiterProgram",
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
            "name": "outputMint",
            "type": "publicKey"
          }
        ]
      }
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
          "name": "outputMint",
          "type": "publicKey"
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
          "name": "jupiterProgram",
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
            "name": "outputMint",
            "type": "publicKey"
          }
        ]
      }
    }
  ]
};
