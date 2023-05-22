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
        },
        {
          "name": "outputAccount",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "swap",
      "accounts": [
        {
          "name": "state",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
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
          },
          {
            "name": "outputAccount",
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
        },
        {
          "name": "outputAccount",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "swap",
      "accounts": [
        {
          "name": "state",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
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
          },
          {
            "name": "outputAccount",
            "type": "publicKey"
          }
        ]
      }
    }
  ]
};
