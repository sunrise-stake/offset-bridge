import { ConfirmOptions, Connection, PublicKey, sendAndConfirmTransaction, Signer, Transaction } from "@solana/web3.js";
import {
    WRAPPED_SOL_TOKEN_MINT,
    BRIDGE_INPUT_MINT_ADDRESS,
    SOLANA_RPC_ENDPOINT,
    USER_KEYPAIR,
    STATE_ADDRESS
} from "./constants";
import { createAssociatedTokenAccountInstruction, getAssociatedTokenAddressSync, ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID } from "spl-token-latest";
import { tokenAuthority } from "./util";

// copied from @solana/spl-token but allows owner off curve (ie PDA)
async function createAssociatedTokenAccount(
    connection: Connection,
    payer: Signer,
    mint: PublicKey,
    owner: PublicKey,
    confirmOptions?: ConfirmOptions,
    programId = TOKEN_PROGRAM_ID,
    associatedTokenProgramId = ASSOCIATED_TOKEN_PROGRAM_ID
): Promise<PublicKey> {
    const associatedToken = getAssociatedTokenAddressSync(mint, owner, true);

    console.log("https://explorer.solana.com/address/" + associatedToken.toBase58());

    const transaction = new Transaction().add(
        createAssociatedTokenAccountInstruction(
            payer.publicKey,
            associatedToken,
            owner,
            mint,
            programId,
            associatedTokenProgramId
        )
    );

    await sendAndConfirmTransaction(connection, transaction, [payer], confirmOptions);

    return associatedToken;
}

(async () => {
    const connection = new Connection(SOLANA_RPC_ENDPOINT);

    const inputMintATA = await createAssociatedTokenAccount(connection, USER_KEYPAIR, new PublicKey(WRAPPED_SOL_TOKEN_MINT), tokenAuthority(STATE_ADDRESS));
    const outputMintATA = await createAssociatedTokenAccount(connection, USER_KEYPAIR, new PublicKey(BRIDGE_INPUT_MINT_ADDRESS), tokenAuthority(STATE_ADDRESS));

    console.log("inputMintATA", inputMintATA.toBase58());
    console.log("outputMintATA", outputMintATA.toBase58());
})().catch((error) => {
    console.error(error);
    process.exit(1);
});