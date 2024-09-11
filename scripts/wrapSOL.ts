import {
    Connection, PublicKey,
    sendAndConfirmTransaction,
    SystemProgram,
    Transaction
} from "@solana/web3.js";
import {WRAPPED_SOL_TOKEN_MINT, SOLANA_RPC_ENDPOINT, USER_KEYPAIR, STATE_ADDRESS} from "./constants";
import {createSyncNativeInstruction, getAssociatedTokenAddressSync} from "spl-token-latest";
import {tokenAuthority} from "./util";

const lamportsToSend = 1_000_000; // 0.1 SOL

(async () => {
    const connection = new Connection(SOLANA_RPC_ENDPOINT);
    const wrappedSolATA = getAssociatedTokenAddressSync(new PublicKey(WRAPPED_SOL_TOKEN_MINT), tokenAuthority(STATE_ADDRESS), true);

    const tx = new Transaction().add(
        SystemProgram.transfer({
            fromPubkey: USER_KEYPAIR.publicKey, lamports: lamportsToSend, toPubkey: wrappedSolATA
        }),
        createSyncNativeInstruction(wrappedSolATA)
    );

    await sendAndConfirmTransaction(connection, tx, [USER_KEYPAIR]);
})().catch((error) => {
    console.error(error);
    process.exit(1);
});