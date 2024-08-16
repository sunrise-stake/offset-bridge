import {
    Connection,
    PublicKey,
    Keypair
} from '@solana/web3.js';
import {BRIDGE_INPUT_MINT_ADDRESS, CHAIN_ID_POLYGON, SOLANA_RPC_ENDPOINT, USER_KEYPAIR} from "./constants";
import {Program, AnchorProvider } from "@coral-xyz/anchor";
import {IDL, TokenSwap} from "./types/token_swap";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import {ethers} from "ethers";

const PROGRAM_ID = new PublicKey("suobUdMc9nSaQ1TjRkQA4K6CR9CmDiU9QViN7kVw74T");

// Read the holding contract address from the command line
const holdingContract = process.argv[2];
// ensure the holding contract is provided and is a valid ethereum address
if (!holdingContract || !!ethers.utils.isAddress(holdingContract)) {
    console.error('Usage: bun run scripts/initialize.ts <holdingContract>');
    process.exit(1);
}

(async () => {
    // Setup Solana RPC connection
    const connection = new Connection(SOLANA_RPC_ENDPOINT);

    const provider = new AnchorProvider(connection, new NodeWallet(USER_KEYPAIR), {});
    const program = new Program<TokenSwap>(IDL, PROGRAM_ID, provider);

    const stateAddress = Keypair.generate();
    console.log("stateAddress", stateAddress.publicKey.toBase58());

    const outputMint = new PublicKey(BRIDGE_INPUT_MINT_ADDRESS);

    const txid = await program.methods.initialize({
        outputMint,
        holdingContract,
        tokenChainId: CHAIN_ID_POLYGON,
        updateAuthority: USER_KEYPAIR.publicKey,
        }
    ).accounts({
        state: stateAddress.publicKey,
    }).signers([stateAddress]).rpc()


    console.log(`https://explorer.solana.com/tx/${txid}`);

})().catch((error) => {
    console.error(error);
    process.exit(1);
});