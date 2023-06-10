import { Cluster, PublicKey, Keypair } from "@solana/web3.js";
import bs58 from "bs58";

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
export const PROGRAM_ID = new PublicKey("sutsaKhPL3nMSPtvRY3e9MbpmqQbEJip6vYqT9AQcgN");
export const STATE_ADDRESS = new PublicKey("FhVZksvDo2dFUCoqEwqv8idS9i4FtQ97amkcJ1d4MHS5");


export const POLYGON_TEST_TOKEN_BRIDGE_ADDRESS = "0x377D55a7928c046E18eEbb61977e714d2a76472a";
export const POLYGON_TOKEN_BRIDGE_ADDRESS = "0x5a58505a96D1dbf8dF91cB21B54419FC36e93fdE";
export const SOL_TEST_TOKEN_BRIDGE_ADDRESS = new PublicKey("DZnkkTmCiFWfYTfT41X3Rd1kDgozqzxWaHqsw6W4x2oe");
export const SOL_TEST_BRIDGE_ADDRESS = new PublicKey("3u8hJUVTA4jH1wYAyUur7FFZVQ8H635K3tSHHF4ssjQ5");
export const SOL_TOKEN_BRIDGE_ADDRESS = new PublicKey("wormDTUJ6AWPNvk59vGQbDvGJmqbDTdgWgAqcLBCgUb");
export const SOL_BRIDGE_ADDRESS = new PublicKey("worm2ZoG2kUd4vFXhvjh93UUH596ayRfgQ2MgjNMTth");
export const CHAIN_ID_POLYGON = 5;
export const CHAIN_ID_SOLANA = 1;

// Token Mints
// usdc test token on solana , https://developers.circle.com/developer/docs/usdc-on-testnet#usdc-on-solana-testnet
export const USDC_TEST_TOKEN_SOLANA = new PublicKey("Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr"); // interface: https://spl-token-faucet.com/?token-name=USDC
export const USDC_TOKEN_SOLANA = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
export const USDC_TOKEN_POLYGON = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174";


export const WRAPPED_SOL_TOKEN_MINT = new PublicKey("So11111111111111111111111111111111111111112");
export const BRIDGE_INPUT_MINT_ADDRESS = new PublicKey("E2VmbootbVCBkMNNxKQgCLMS1X3NoGMaYAsufaAsf7M") // USDCpo on Solana
export const BRIDGE_INPUT_MINT_DECIMALS = 6;
export const BRIDGE_INPUT_TOKEN_SYMBOL = "USDCpo";


export const BRIDGE_OUTPUT_TOKEN_CONTRACT = USDC_TOKEN_POLYGON; // USDC on polygon
export const BRIDGE_OUTPUT_TOKEN_DECIMALS = 6;
export const BRIDGE_OUTPUT_TOKEN_SYMBOL = "USDC";

// Holding contract deployed on Polygon mainnet
export const HOLDING_CONTRACT_ADDRESS = "0x7022404732CB3ec5aC95c2c75080A76226AA74F5";

// export const WORMHOLE_RPC_HOSTS = ["http://guardian:7071"];
export const WORMHOLE_RPC_HOSTS_TESTNET = ["https://wormhole-v2-testnet-api.certus.one"];
export const WORMHOLE_RPC_HOSTS_MAINNET = ["https://wormhole-v2-mainnet-api.certus.one",
    "https://wormhole.inotel.ro",
    "https://wormhole-v2-mainnet-api.mcf.rocks",
    "https://wormhole-v2-mainnet-api.chainlayer.network",
    "https://wormhole-v2-mainnet-api.staking.fund",
    "https://wormhole-v2-mainnet.01node.com"];

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
            }
        ],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
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
] as const;

export const WORMHOLE_BRIDGE_ABI = [{
    inputs: [
        {
            internalType: "bytes",
            name: "encodedVm",
            type: "bytes",
        },
    ],
    name: "completeTransfer",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
}] as const;