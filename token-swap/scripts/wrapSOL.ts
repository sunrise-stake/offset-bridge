import {
    Connection, PublicKey,
    sendAndConfirmTransaction,
    SystemProgram,
    Transaction
} from "@solana/web3.js";
import {INPUT_MINT_ADDRESS, SOLANA_RPC_ENDPOINT, USER_KEYPAIR} from "./constants";
import {getAssociatedTokenAddress, createSyncNativeInstruction} from "@solana/spl-token";
import {inputAccount} from "./util";

const lamportsToSend = 1_000_000; // 0.1 SOL

(async () => {
    const connection = new Connection(SOLANA_RPC_ENDPOINT);
    const wrappedSolATA = await getAssociatedTokenAddress(new PublicKey(INPUT_MINT_ADDRESS), inputAccount, true);

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