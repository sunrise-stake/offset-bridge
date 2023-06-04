import {
    Connection, PublicKey,
    sendAndConfirmTransaction,
    SystemProgram,
    Transaction
} from "@solana/web3.js";
import {STARTING_MINT_ADDRESS, SOLANA_RPC_ENDPOINT, USER_KEYPAIR} from "./constants";
import {createSyncNativeInstruction, getAssociatedTokenAddressSync} from "spl-token-latest";
import {tokenAuthority} from "./util";

const lamportsToSend = 1_000_000; // 0.1 SOL

(async () => {
    const connection = new Connection(SOLANA_RPC_ENDPOINT);
    const wrappedSolATA = getAssociatedTokenAddressSync(new PublicKey(STARTING_MINT_ADDRESS), tokenAuthority, true);

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