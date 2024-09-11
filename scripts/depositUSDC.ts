import {
    Connection, PublicKey,
} from "@solana/web3.js";
import {SOLANA_RPC_ENDPOINT, USER_KEYPAIR, USDC_TOKEN_SOLANA, STATE_ADDRESS} from "./constants";
import {getAssociatedTokenAddressSync, transfer} from "spl-token-latest";
import {tokenAuthority} from "./util";

const usdcToSend = 1_000_000; // 1 USDC

(async () => {
    const connection = new Connection(SOLANA_RPC_ENDPOINT);
    const from = getAssociatedTokenAddressSync(new PublicKey(USDC_TOKEN_SOLANA), USER_KEYPAIR.publicKey);
    const to = getAssociatedTokenAddressSync(new PublicKey(USDC_TOKEN_SOLANA), tokenAuthority(STATE_ADDRESS), true);
    const tx= await transfer(connection, USER_KEYPAIR, from, to, USER_KEYPAIR.publicKey, usdcToSend);
    console.log("tx: ", tx);
})().catch((error) => {
    console.error(error);
    process.exit(1);
});