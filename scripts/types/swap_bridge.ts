/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/swap_bridge.json`.
 */
export type SwapBridge = {
  "address": "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4",
  "metadata": {
    "name": "swapBridge",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "bridge",
      "discriminator": [
        174,
        41,
        120,
        146,
        98,
        218,
        169,
        25
      ],
      "accounts": [
        {
          "name": "state",
          "docs": [
            "State account specifying the mint of the token being transferred through the bridge",
            "and the recipient address on the target chain"
          ]
        },
        {
          "name": "bridgeAuthority",
          "docs": [
            "The wormhole bridge authority. This is the authority that will sign the bridge transaction",
            "and therefore needs to be a delegate on the token account.",
            "It will also be listed in the remainingAccounts list that are populated directly from the generated wormhole transaction on the client"
          ]
        },
        {
          "name": "tokenAccountAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  111,
                  107,
                  101,
                  110,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "state"
              }
            ]
          }
        },
        {
          "name": "tokenAccount",
          "docs": [
            "The account containing tokens that will be transferred through the bridge"
          ]
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "wormholeProgram",
          "address": "wormDTUJ6AWPNvk59vGQbDvGJmqbDTdgWgAqcLBCgUb"
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
    },
    {
      "name": "initialize",
      "discriminator": [
        175,
        175,
        109,
        31,
        13,
        152,
        155,
        237
      ],
      "accounts": [
        {
          "name": "state",
          "docs": [
            "Initialize the state account"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  97,
                  116,
                  101,
                  95,
                  97,
                  100,
                  100,
                  114,
                  101,
                  115,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              },
              {
                "kind": "arg",
                "path": "stateIndex"
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "stateIn",
          "type": {
            "defined": {
              "name": "genericStateInput"
            }
          }
        },
        {
          "name": "stateIndex",
          "type": "u8"
        }
      ]
    },
    {
      "name": "swap",
      "discriminator": [
        248,
        198,
        158,
        145,
        225,
        117,
        135,
        200
      ],
      "accounts": [
        {
          "name": "state"
        },
        {
          "name": "jupiterProgram",
          "address": "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4"
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
      "name": "updateState",
      "discriminator": [
        135,
        112,
        215,
        75,
        247,
        185,
        53,
        176
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "state",
          "writable": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "stateIn",
          "type": {
            "defined": {
              "name": "genericStateInput"
            }
          }
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "state",
      "discriminator": [
        216,
        146,
        107,
        94,
        104,
        75,
        182,
        177
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "incorrectDestinationAccount",
      "msg": "Wormhole target address does not match holding contract specified in state"
    },
    {
      "code": 6001,
      "name": "unauthorized",
      "msg": "Incorrect update authority"
    }
  ],
  "types": [
    {
      "name": "genericStateInput",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "outputMint",
            "docs": [
              "Mint of the wrapped USDC token to be bridged over to the target chain"
            ],
            "type": "pubkey"
          },
          {
            "name": "holdingContract",
            "docs": [
              "Holding contract on the target chain to receive the bridged tokens"
            ],
            "type": "string"
          },
          {
            "name": "tokenChainId",
            "docs": [
              "Wormhole ID specifying the target chain"
            ],
            "type": "string"
          },
          {
            "name": "updateAuthority",
            "docs": [
              "Authority who can update the data in the state account"
            ],
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "state",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "outputMint",
            "docs": [
              "Mint of the wrapped USDC token to be bridged over to the target chain"
            ],
            "type": "pubkey"
          },
          {
            "name": "holdingContract",
            "docs": [
              "Holding contract on the target chain to receive the bridged tokens"
            ],
            "type": "string"
          },
          {
            "name": "tokenChainId",
            "docs": [
              "Wormhole ID specifying the target chain"
            ],
            "type": "string"
          },
          {
            "name": "updateAuthority",
            "docs": [
              "Authority who can update the data in the state account"
            ],
            "type": "pubkey"
          }
        ]
      }
    }
  ]
};
