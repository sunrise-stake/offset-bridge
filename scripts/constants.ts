import { Cluster, PublicKey, Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import os from "os";

require("dotenv").config();

// Endpoints, connection
export const ENV: Cluster = (process.env.CLUSTER as Cluster) || "mainnet-beta";

// Sometimes, your RPC endpoint may reject you if you spam too many RPC calls. Sometimes, your PRC server
// may have invalid cache and cause problems. Also, a paid RPC server is always recommended.
export const SOLANA_RPC_ENDPOINT = process.env.SOLANA_RPC_ENDPOINT ||
    (ENV === "devnet"
        ? "https://api.devnet.solana.com"
        : "https://neat-hidden-sanctuary.solana-mainnet.discover.quiknode.pro/2af5315d336f9ae920028bbb90a73b724dc1bbed");
// !IMPORTANT:  This example is using a quiknode free plan that is shared and has limits so should not be used for productions.
// Wallets
export const USER_KEYPAIR =
    process.env.SOLANA_PRIVATE_KEY ? Keypair.fromSecretKey(bs58.decode(process.env.SOLANA_PRIVATE_KEY)) : Keypair.fromSecretKey(Buffer.from(require(os.homedir() + '/.config/solana/id.json')));

export const PROGRAM_ID = new PublicKey("suobUdMc9nSaQ1TjRkQA4K6CR9CmDiU9QViN7kVw74T");
export const STATE_ADDRESS = new PublicKey("HwSjfH6zmRTkp4rYoEsEcZ2J3GARMNEtGcXf3Lq8aPxy");

// Wormhole 
export const POLYGON_TEST_TOKEN_BRIDGE_ADDRESS = "0x377D55a7928c046E18eEbb61977e714d2a76472a";
export const POLYGON_TEST_BRIDGE_ADDRESS = "0x0CBE91CF822c73C2315FB05100C2F714765d5c20";
export const SOL_TEST_TOKEN_BRIDGE_ADDRESS = "DZnkkTmCiFWfYTfT41X3Rd1kDgozqzxWaHqsw6W4x2oe";
export const SOL_TEST_BRIDGE_ADDRESS = "3u8hJUVTA4jH1wYAyUur7FFZVQ8H635K3tSHHF4ssjQ5";

export const POLYGON_BRIDGE_ADDRESS = "0x7A4B5a56256163F07b2C80A7cA55aBE66c4ec4d7";
export const POLYGON_TOKEN_BRIDGE_ADDRESS = "0x5a58505a96D1dbf8dF91cB21B54419FC36e93fdE";
// "B6RHG3mfcckmrYN1UhmJzyS1XX3fZKbkeUcpJe9Sy3FE";
// "Bridge1p5gheXUvJ6jGWGeCsgPKgnE3YgdGKRVCMY9o";
export const SOL_TOKEN_BRIDGE_ADDRESS = "wormDTUJ6AWPNvk59vGQbDvGJmqbDTdgWgAqcLBCgUb";
export const SOL_BRIDGE_ADDRESS = "worm2ZoG2kUd4vFXhvjh93UUH596ayRfgQ2MgjNMTth";

export const CHAIN_ID_POLYGON = 5;
export const CHAIN_ID_SOLANA = 1;

//NFT 
export const POLYGON_TEST_NFT_BRIDGE_ADDRESS = "0x51a02d0dcb5e52F5b92bdAA38FA013C91c7309A9";
export const SOLANA_TEST_NFT_BRIDGE_ADDRESS = "2rHhojZ7hpu1zA91nvZmT8TqWWvMcKmmNBCr2mKTtMq4";
export const POLYGON_NFT_BRIDGE_ADDRESS = "0x90BBd86a6Fe93D3bc3ed6335935447E75fAb7fCf"
export const SOLANA_NFT_BRIDGE_ADDRESS = "WnFt12ZrnzZrFZkt2xsNsaNWoQribnuQ5B5FrDbwDhD";
export const RETIREMENT_CERT = "0x5e377f16E4ec6001652befD737341a28889Af002";


// Token Mints
// usdc test token on solana , https://developers.circle.com/developer/docs/usdc-on-testnet#usdc-on-solana-testnet
// const USDC_TEST_TOKEN = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
export const USDC_TEST_TOKEN_SOLANA = "Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr"; // interface: https://spl-token-faucet.com/?token-name=USDC
export const USDC_TOKEN_SOLANA = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
export const USDC_TOKEN_POLYGON = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174";


export const WRAPPED_SOL_TOKEN_MINT = "So11111111111111111111111111111111111111112";
export const BRIDGE_INPUT_MINT_ADDRESS = "E2VmbootbVCBkMNNxKQgCLMS1X3NoGMaYAsufaAsf7M" // USDCpo on Solana

export const BRIDGE_OUTPUT_TOKEN_CONTRACT = USDC_TOKEN_POLYGON; // USDC on polygon

// Holding contract deployed on Polygon mainnet
export const HOLDING_CONTRACT_ADDRESS = "0x669Dd15b1A25f34E87e6eCAe2A855ae5a336d9e3"
//"0x7022404732CB3ec5aC95c2c75080A76226AA74F5";
// retire: 0xef1996E77FA763B8A97F34d2318C6611f108878f

// export const WORMHOLE_RPC_HOSTS = ["http://guardian:7071"];
export const WORMHOLE_RPC_HOSTS_TESTNET = ["https://wormhole-v2-testnet-api.certus.one"];
export const WORMHOLE_RPC_HOSTS_MAINNET = ["https://wormhole-v2-mainnet-api.certus.one",
    "https://wormhole.inotel.ro",
    "https://wormhole-v2-mainnet-api.mcf.rocks",
    "https://wormhole-v2-mainnet-api.chainlayer.network",
    "https://wormhole-v2-mainnet-api.staking.fund",
    // "https://wormhole-v2-mainnet.01node.com" // CORS restriction
];

// const WORMHOLE_RPC_HOST = ["https://wormhole-v2-testnet-api.certus.one"];


// Interface
export interface JupiterToken {
    chainId: number; // 101,
    address: string; // '8f9s1sUmzUbVZMoMh6bufMueYH1u4BJSM57RCEvuVmFp',
    symbol: string; // 'TRUE',
    name: string; // 'TrueSight',
    decimals: number; // 9,
    logoURI: string; // 'https://i.ibb.co/pKTWrwP/true.jpg',
    tags: string[]; // [ 'utility-token', 'capital-token' ]
}

// ABIs
export const HOLDING_CONTRACT_ABI = [
    {
        "inputs": [],
        "name": "InsufficientFunds",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "InvalidRetireContract",
        "type": "error"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "uint8",
                "name": "version",
                "type": "uint8"
            }
        ],
        "name": "Initialized",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "tco2",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "beneficiary",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "string",
                "name": "beneficiaryName",
                "type": "string"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "Offset",
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
        "name": "BRIDGE",
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
        "name": "CERT",
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
        "name": "SolanaAccountAddress",
        "outputs": [
            {
                "internalType": "bytes32",
                "name": "",
                "type": "bytes32"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "USDC",
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
        "name": "beneficiary",
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
        "name": "beneficiaryName",
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
                "internalType": "uint256",
                "name": "tokenId",
                "type": "uint256"
            }
        ],
        "name": "bridgeNFT",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "sequence",
                "type": "uint256"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "tokenId",
                "type": "uint256"
            },
            {
                "internalType": "bytes32",
                "name": "solanaAccountAddress",
                "type": "bytes32"
            }
        ],
        "name": "bridgeToAddress",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "sequence",
                "type": "uint256"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "newTco2",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "newBeneficiary",
                "type": "address"
            },
            {
                "internalType": "string",
                "name": "newBeneficiaryName",
                "type": "string"
            },
            {
                "internalType": "bytes32",
                "name": "newSolanaAccountAddress",
                "type": "bytes32"
            },
            {
                "internalType": "address",
                "name": "newRetireContract",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "owner",
                "type": "address"
            }
        ],
        "name": "initialize",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "entity",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "message",
                "type": "string"
            }
        ],
        "name": "offset",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "operator",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "from",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "tokenId",
                "type": "uint256"
            },
            {
                "internalType": "bytes",
                "name": "data",
                "type": "bytes"
            }
        ],
        "name": "onERC721Received",
        "outputs": [
            {
                "internalType": "bytes4",
                "name": "",
                "type": "bytes4"
            }
        ],
        "stateMutability": "nonpayable",
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
        "inputs": [],
        "name": "retireContract",
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
                "name": "newBeneficiary",
                "type": "address"
            },
            {
                "internalType": "string",
                "name": "newBeneficiaryName",
                "type": "string"
            }
        ],
        "name": "setBeneficiary",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "newRetireContract",
                "type": "address"
            }
        ],
        "name": "setRetireContract",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "newSolanaAccountAddress",
                "type": "bytes32"
            }
        ],
        "name": "setSolanaAccountAddress",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "newTco2",
                "type": "address"
            }
        ],
        "name": "setTCO2",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "tco2",
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