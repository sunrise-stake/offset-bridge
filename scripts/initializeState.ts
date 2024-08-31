import {
    Connection,
    PublicKey,
} from '@solana/web3.js';
import {BRIDGE_INPUT_MINT_ADDRESS, CHAIN_ID_POLYGON, SOLANA_RPC_ENDPOINT, USER_KEYPAIR} from "./constants";
import {Program, AnchorProvider } from "@coral-xyz/anchor";
import {SwapBridge} from "./types/swap_bridge";
import IDL from './idls/swap_bridge.json';
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import {ethers} from "ethers";
import {deriveStateAddress} from "./util";

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
    const program = new Program<SwapBridge>(IDL as SwapBridge, provider);

    const outputMint = new PublicKey(BRIDGE_INPUT_MINT_ADDRESS);

    console.log("stateAddress", deriveStateAddress(USER_KEYPAIR.publicKey).toString());
    console.log("user", USER_KEYPAIR.publicKey.toBase58());
    console.log("outputMint", outputMint.toBase58());
    console.log("holdingContract", holdingContract);

    const signature = await program.methods.initialize({
        outputMint,
        holdingContract,
        tokenChainId: "" + CHAIN_ID_POLYGON,
        updateAuthority: USER_KEYPAIR.publicKey,
        }, 0 // default seed index. Set a higher value to create subsequent state accounts for the same user
    ).accounts({
        authority: provider.publicKey,
    }).rpc()

    console.log("Transaction sent:")
    console.log(`https://explorer.solana.com/tx/${signature}`);
    console.log("Waiting for confirmation...");

    const latestBlockhash = await connection.getLatestBlockhash();
    await connection.confirmTransaction({
        signature,
        ...latestBlockhash,
    });
    console.log("Transaction confirmed");


})().catch((error) => {
    console.error(error);
    process.exit(1);
});