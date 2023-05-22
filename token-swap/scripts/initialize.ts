import {
    Connection,
    PublicKey,
    Keypair
} from '@solana/web3.js';
import { OUTPUT_MINT_ADDRESS, SOLANA_RPC_ENDPOINT, USER_KEYPAIR} from "./constants";
import {Program, AnchorProvider } from "@coral-xyz/anchor";
import {IDL, TokenSwap} from "./types/token_swap";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { getAssociatedTokenAddress } from "@solana/spl-token";

const PROGRAM_ID = new PublicKey("sutsaKhPL3nMSPtvRY3e9MbpmqQbEJip6vYqT9AQcgN");

(async () => {
    // Setup Solana RPC connection
    const connection = new Connection(SOLANA_RPC_ENDPOINT);

    // execute the swap transaction
    const provider = new AnchorProvider(connection, new NodeWallet(USER_KEYPAIR), {});
    const program = new Program<TokenSwap>(IDL, PROGRAM_ID, provider);

    const stateAddress = Keypair.generate();
    console.log("stateAddress", stateAddress.publicKey.toBase58());

    const outputMint = new PublicKey(OUTPUT_MINT_ADDRESS);
    const outputAccount = await getAssociatedTokenAddress(
        outputMint,
        USER_KEYPAIR.publicKey
    );

    const txid = await program.methods.initialize(
        outputMint,
        outputAccount,
    ).accounts({
        state: stateAddress.publicKey,
    }).signers([stateAddress]).rpc()


    console.log(`https://explorer.solana.com/tx/${txid}`);

})().catch((error) => {
    console.error(error);
    process.exit(1);
});