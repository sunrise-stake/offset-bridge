import {ConfirmOptions, Connection, PublicKey, sendAndConfirmTransaction, Signer, Transaction} from "@solana/web3.js";
import {INPUT_MINT_ADDRESS, OUTPUT_MINT_ADDRESS, SOLANA_RPC_ENDPOINT, USER_KEYPAIR} from "./constants";
import {createAssociatedTokenAccountInstruction, getAssociatedTokenAddress, ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID} from "@solana/spl-token";
import {inputAccount} from "./util";

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
    const associatedToken = await getAssociatedTokenAddress(mint, owner, true);

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

    const inputMintATA = await createAssociatedTokenAccount(connection, USER_KEYPAIR, new PublicKey(INPUT_MINT_ADDRESS), inputAccount);
    const outputMintATA = await createAssociatedTokenAccount(connection, USER_KEYPAIR, new PublicKey(OUTPUT_MINT_ADDRESS), inputAccount);

    console.log("inputMintATA", inputMintATA.toBase58());
    console.log("outputMintATA", outputMintATA.toBase58());
})().catch((error) => {
    console.error(error);
    process.exit(1);
});