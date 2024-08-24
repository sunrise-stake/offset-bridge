import {
    Connection,
    PublicKey,
    Keypair
} from '@solana/web3.js';
import {BRIDGE_INPUT_MINT_ADDRESS, CHAIN_ID_POLYGON, SOLANA_RPC_ENDPOINT, USER_KEYPAIR} from "./constants";
import {Program, AnchorProvider } from "@coral-xyz/anchor";
import {TokenSwap} from "./types/token_swap";
import IDL from './idls/token_swap.json';
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import {ethers} from "ethers";

// Read the holding contract address from the command line
const holdingContract = process.argv[2];
// ensure the holding contract is provided and is a valid ethereum address
if (!holdingContract || !ethers.utils.isAddress(holdingContract)) {
    console.error('Usage: bun run scripts/initializeState.ts <holdingContract>');
    process.exit(1);
}

(async () => {
    // Setup Solana RPC connection
    const connection = new Connection(SOLANA_RPC_ENDPOINT);

    const provider = new AnchorProvider(connection, new NodeWallet(USER_KEYPAIR), {});
    const program = new Program<TokenSwap>(IDL as TokenSwap, provider);

    const stateAddress = Keypair.generate();
    const outputMint = new PublicKey(BRIDGE_INPUT_MINT_ADDRESS);

    console.log("stateAddress", stateAddress.publicKey.toBase58());
    console.log("user", USER_KEYPAIR.publicKey.toBase58());
    console.log("outputMint", outputMint.toBase58());
    console.log("holdingContract", holdingContract);

    const txid = await program.methods.initialize({
        outputMint,
        holdingContract,
        tokenChainId: "" + CHAIN_ID_POLYGON,
        updateAuthority: USER_KEYPAIR.publicKey,
        }
    ).accounts({
        state: stateAddress.publicKey,
        authority: provider.publicKey,
    }).signers([stateAddress]).rpc()


    console.log(`https://explorer.solana.com/tx/${txid}`);

})().catch((error) => {
    console.error(error);
    process.exit(1);
});