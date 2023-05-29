import { Cluster } from "@solana/web3.js";
import bs58 from "bs58";
import { Keypair } from "@solana/web3.js";
import os from "os";

// require("dotenv").config();

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

// Token Mints
export const INPUT_MINT_ADDRESS = "So11111111111111111111111111111111111111112";
export const OUTPUT_MINT_ADDRESS = "E2VmbootbVCBkMNNxKQgCLMS1X3NoGMaYAsufaAsf7M" // USDCpo

// Interface
export interface Token {
    chainId: number; // 101,
    address: string; // '8f9s1sUmzUbVZMoMh6bufMueYH1u4BJSM57RCEvuVmFp',
    symbol: string; // 'TRUE',
    name: string; // 'TrueSight',
    decimals: number; // 9,
    logoURI: string; // 'https://i.ibb.co/pKTWrwP/true.jpg',
    tags: string[]; // [ 'utility-token', 'capital-token' ]
}