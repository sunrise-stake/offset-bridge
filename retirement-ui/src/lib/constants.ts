import {Cluster, PublicKey} from "@solana/web3.js";
import {keccak256, Hex} from "viem";

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
export const PROGRAM_ID = new PublicKey("suobUdMc9nSaQ1TjRkQA4K6CR9CmDiU9QViN7kVw74T");
export const StateAddress: Record<string, string> = {
    "Default": "4U6vxUjMGhiaM8GzmH8KKvs8q7L3zxjDV5eRJnyfAtgF"
};

export const POLYGON_TEST_TOKEN_BRIDGE_ADDRESS = "0x377D55a7928c046E18eEbb61977e714d2a76472a";
export const POLYGON_TOKEN_BRIDGE_ADDRESS = "0x5a58505a96D1dbf8dF91cB21B54419FC36e93fdE";
export const POLYGON_BRIDGE_ADDRESS = "0x7A4B5a56256163F07b2C80A7cA55aBE66c4ec4d7";
export const SOL_TEST_TOKEN_BRIDGE_ADDRESS = new PublicKey("DZnkkTmCiFWfYTfT41X3Rd1kDgozqzxWaHqsw6W4x2oe");
export const SOL_TEST_BRIDGE_ADDRESS = new PublicKey("3u8hJUVTA4jH1wYAyUur7FFZVQ8H635K3tSHHF4ssjQ5");
export const SOL_TOKEN_BRIDGE_ADDRESS = new PublicKey("wormDTUJ6AWPNvk59vGQbDvGJmqbDTdgWgAqcLBCgUb");
export const POLYGON_NFT_BRIDGE_ADDRESS = "0x90BBd86a6Fe93D3bc3ed6335935447E75fAb7fCf"
export const SOL_NFT_BRIDGE_ADDRESS = "WnFt12ZrnzZrFZkt2xsNsaNWoQribnuQ5B5FrDbwDhD";
export const SOL_BRIDGE_ADDRESS = new PublicKey("worm2ZoG2kUd4vFXhvjh93UUH596ayRfgQ2MgjNMTth");
export const CHAIN_ID_POLYGON = 5;
export const CHAIN_ID_SOLANA = 1;

export const MAX_NUM_PRECISION = 5;

// Token Mints
// usdc test token on solana , https://developers.circle.com/developer/docs/usdc-on-testnet#usdc-on-solana-testnet
export const USDC_TEST_TOKEN_SOLANA = new PublicKey("Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr"); // interface: https://spl-token-faucet.com/?token-name=USDC
export const USDC_TOKEN_SOLANA = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
export const USDC_TOKEN_POLYGON = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174";

export const USDC_TOKEN_DECIMALS = 6;

export const WRAPPED_SOL_TOKEN_MINT = new PublicKey("So11111111111111111111111111111111111111112");
export const WRAPPED_SOL_TOKEN_DECIMALS = 9;
export const BRIDGE_INPUT_MINT_ADDRESS = new PublicKey("E2VmbootbVCBkMNNxKQgCLMS1X3NoGMaYAsufaAsf7M") // USDCpo on Solana
export const BRIDGE_INPUT_MINT_DECIMALS = 6;
export const BRIDGE_INPUT_TOKEN_SYMBOL = "USDCpo";

export const RETIREMENT_CERT_MINT_AUTHORITY_SOLANA = new PublicKey("3iBi3CaSBMR72MB5RGqwAu2CsgQVEFUrmTEHBvym8f9i");

export const supportedInputTokens: SolanaToken[] = [
    {
        mint: USDC_TOKEN_SOLANA,
        decimals: USDC_TOKEN_DECIMALS,
        symbol: "USDC",
        swapsTo: BRIDGE_INPUT_MINT_ADDRESS
    },{
        mint: WRAPPED_SOL_TOKEN_MINT,
        decimals: WRAPPED_SOL_TOKEN_DECIMALS,
        symbol: "SOL",
        swapsTo: USDC_TOKEN_SOLANA
    }
];



export const BRIDGE_OUTPUT_TOKEN_CONTRACT = USDC_TOKEN_POLYGON; // USDC on polygon
export const BRIDGE_OUTPUT_TOKEN_DECIMALS = 6;
export const BRIDGE_OUTPUT_TOKEN_SYMBOL = "USDC";

export type HoldingContract = {
    name: string;
    description: string;
    address: string;
}
// Holding contract deployed on Polygon mainnet
export const HOLDING_CONTRACT_FACTORY_ADDRESS = "0x3BC9a3826E4df57869dE0eD7d7D5d0799982c3d5" as const;

export const NCT_TOKEN_ADDRESS = "0xd838290e877e0188a4a44700463419ed96c16107" as const;
export const RETIREMENT_CONTRACT = "0x7E088Aa3B61427DAc9903Cd7a02E23A66B810a07";
export const RETIREMENT_ERC721 = "0x5e377f16E4ec6001652befD737341a28889Af002" as const;
export const DEFAULT_RETIREMENT_PROJECT = "0x463de2a5c6E8Bb0c87F4Aa80a02689e6680F72C7" as const;
export const DEFAULT_BENEFICIARY = "Solana";

export const DUMMY_PUBLIC_KEY = new PublicKey("11111111111111111111111111111111")

// export const WORMHOLE_RPC_HOSTS = ["http://guardian:7071"];
export const WORMHOLE_RPC_HOSTS_TESTNET = ["https://wormhole-v2-testnet-api.certus.one"];
export const WORMHOLE_RPC_HOSTS_MAINNET = ["https://wormhole-v2-mainnet-api.certus.one",
    "https://wormhole.inotel.ro",
    "https://wormhole-v2-mainnet-api.mcf.rocks",
    "https://wormhole-v2-mainnet-api.chainlayer.network",
    "https://wormhole-v2-mainnet-api.staking.fund",
    "https://wormhole-v2-mainnet.01node.com"];

// const WORMHOLE_RPC_HOST = ["https://wormhole-v2-testnet-api.certus.one"];

export interface SolanaToken {
    mint: PublicKey,
    decimals: number,
    symbol: string,
    swapsTo: PublicKey
}

export interface JupiterToken {
    chainId: number; // 101,
    address: string; // '8f9s1sUmzUbVZMoMh6bufMueYH1u4BJSM57RCEvuVmFp',
    symbol: string; // 'TRUE',
    name: string; // 'TrueSight',
    decimals: number; // 9,
    logoURI: string; // 'https://i.ibb.co/pKTWrwP/true.jpg',
    tags: string[]; // [ 'utility-token', 'capital-token' ]
}

export const holdingContractFactorySalt = (address:string): Hex => {
    const unhashedSalt = `sunrise-v0.0.2${address}`
    return keccak256(Buffer.from(unhashedSalt), 'hex');
}

