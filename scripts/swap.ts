import fetch from 'node-fetch';
import JSBI from 'jsbi';
import {
    Connection,
    PublicKey,
    VersionedTransaction, MessageV0, TransactionMessage, TransactionInstruction, AccountMeta
} from '@solana/web3.js';
import {ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID} from "@solana/spl-token";
import {Jupiter, JUPITER_PROGRAM_ID, TOKEN_LIST_URL} from '@jup-ag/core';
import {
    ENV,
    WRAPPED_SOL_TOKEN_MINT,
    BRIDGE_INPUT_MINT_ADDRESS,
    SOLANA_RPC_ENDPOINT,
    JupiterToken,
    USER_KEYPAIR,
    PROGRAM_ID, STATE_ADDRESS, USDC_TOKEN_SOLANA
} from "./constants";
import {Program, AnchorProvider, Wallet} from "@coral-xyz/anchor";
import {IDL, TokenSwap} from "./types/token_swap";
import {tokenAuthority} from "./util";

// Assume the input token is SOL unless specified otherwise
const SWAP_INPUT_TOKEN_MINT = process.argv[2] === "USDC" ? USDC_TOKEN_SOLANA : WRAPPED_SOL_TOKEN_MINT;

(async () => {
    // Setup Solana RPC connection
    const connection = new Connection(SOLANA_RPC_ENDPOINT);

    // Fetch token list from Jupiter API
    // This token list contains token meta data
    const tokens: JupiterToken[] = await (await fetch(TOKEN_LIST_URL[ENV])).json() as JupiterToken[];

    console.log("TOKEN AUTHORITY", tokenAuthority.toBase58())

    //  Load Jupiter
    const jupiter = await Jupiter.load({
        connection,
        cluster: ENV,
        user: tokenAuthority, // PDA owned by the swap program
        wrapUnwrapSOL: false // wrapping and unwrapping will try to sign with the inputAcount which is a PDA
        // user: USER_KEYPAIR, // or public key
        // platformFeeAndAccounts:  NO_PLATFORM_FEE,
        // routeCacheDuration: CACHE_DURATION_MS
        // wrapUnwrapSOL: true (default) | false
    });

    // const routeMap: Map<string, string[]> = jupiter.getRouteMap()

    const inputToken = tokens.find((t) => t.address == SWAP_INPUT_TOKEN_MINT);
    const outputToken = tokens.find((t) => t.address == BRIDGE_INPUT_MINT_ADDRESS);

    if (!inputToken || !outputToken) {
        throw new Error("Input or output token not found");
    }

    const routes = await jupiter.computeRoutes({
        inputMint: new PublicKey(inputToken.address),
        outputMint: new PublicKey(outputToken.address),
        amount: JSBI.BigInt(100000), // 100k lamports
        slippageBps: 10,  // 1 bps = 0.01%.
        // forceFetch (optional) => to force fetching routes and not use the cache.
        // intermediateTokens => if provided will only find routes that use the intermediate tokens.
        // feeBps => the extra fee in BPS you want to charge on top of this swap.
        // onlyDirectRoutes =>  Only show single hop routes.
        // swapMode => "ExactIn" | "ExactOut" Defaults to "ExactIn"  "ExactOut" is to support use cases like payments when you want an exact output amount.
        // enforceSingleTx: true // =>  Only show routes where only one single transaction is used to perform the Jupiter swap.
    });

    // const shortRoutes = routes.routesInfos.filter((r) => r.marketInfos.length == 2);));

    // Routes are sorted based on outputAmount, so ideally the first route is the best.
    const bestRoute = routes.routesInfos[0]
    routes.routesInfos.forEach((r, i) => {
        console.log(i + ": Route length: " + r.marketInfos.length);
    })
    const { execute, swapTransaction , addressLookupTableAccounts } = await jupiter.exchange({
        routeInfo: bestRoute
    });

    const jupiterTx = swapTransaction as VersionedTransaction;

    // create the swap instruction proxying the jupiter instruction
    const provider = new AnchorProvider(connection, new Wallet(USER_KEYPAIR), {});
    const program = new Program<TokenSwap>(IDL, PROGRAM_ID, provider);

    const message = jupiterTx.message as MessageV0;
    message.compiledInstructions.forEach((ix) => {
        console.log(message.staticAccountKeys[ix.programIdIndex].toString());
    });

    const jupiterIxIndex = message.compiledInstructions.findIndex(
        (ix) => message.staticAccountKeys[ix.programIdIndex].equals(JUPITER_PROGRAM_ID)
    );
    const jupiterIx = message.compiledInstructions[jupiterIxIndex];
    const messageAccountKeys = message.getAccountKeys({ addressLookupTableAccounts });

    // construct the swap account metas from the jupiter instruction
    const accountMetas = jupiterIx.accountKeyIndexes.map(jupiterIxAccountIndex => {
        return {
            pubkey: messageAccountKeys.get(jupiterIxAccountIndex),
            isSigner: false,// message.isAccountSigner(i), - this tx is permissionless through the proxy
            isWritable: message.isAccountWritable(jupiterIxAccountIndex)
        };
    });
    // the data for the jupiter instruction is passed straight through to the swap proxy
    const routeInfo = Buffer.from(jupiterIx.data);

    // create the swap instruction
    const swapIx = await program.methods.swap(routeInfo).accounts({
        state: STATE_ADDRESS,
        jupiterProgram: JUPITER_PROGRAM_ID,
    }).remainingAccounts([
        ...accountMetas
    ]).instruction()

    let seenJupiterIx = false;

    // get the rest of the instructions from the original transaction, (token account creation & closure etc)
    // preserving the order.
    const ixes: TransactionInstruction[] = message.compiledInstructions.map(ix => {
        if (ix === jupiterIx) {
            seenJupiterIx = true;
            // replace with the swap program instruction
            return swapIx;
        }

        // otherwise just copy over the instruction.
        // the account indices have changed so recreate the account metas
        const keys: AccountMeta[] = ix.accountKeyIndexes.map(index => ({
            pubkey: messageAccountKeys.get(index),
            isSigner: message.isAccountSigner(index),
            isWritable: message.isAccountWritable(index)
        }));

        if (messageAccountKeys.get(ix.programIdIndex).equals(ASSOCIATED_TOKEN_PROGRAM_ID)) {
            // it is a "create associated token account" instruction,
            // we change the rent payer of these instructions to the user keypair
            // and make the owner not a signer

            keys[0] = {
                pubkey: USER_KEYPAIR.publicKey,
                isSigner: true,
                isWritable: true
            }
            keys[2] = {
                pubkey: keys[2].pubkey,
                isSigner: false,
                isWritable: false
            }
        } else if (messageAccountKeys.get(ix.programIdIndex).equals(TOKEN_PROGRAM_ID)) {
            // if we have seen the jupiter instruction, this is a close token account instruction
            // for now, drop it
            if (seenJupiterIx) {
                return null;
            }
        }

        return new TransactionInstruction({
           keys,
           programId: messageAccountKeys.get(ix.programIdIndex),
           data: Buffer.from(ix.data)
        })
    }).filter(ix => ix !== null);

    console.log(JSON.stringify(ixes, null, 2));


    // generate a versioned transaction from the new instructions, using the same ALTs as before)
    const blockhash = await connection
        .getLatestBlockhash()
        .then((res) => res.blockhash);
    const messageV0 = new TransactionMessage({
        payerKey: USER_KEYPAIR.publicKey,
        recentBlockhash: blockhash,
        instructions: ixes,
    }).compileToV0Message(addressLookupTableAccounts);
    const transaction = new VersionedTransaction(messageV0);

    const newTxSigners = [];
    let keys = (transaction.message as MessageV0).getAccountKeys({ addressLookupTableAccounts });
    for (let i = 0; i < keys.length; i++) {
        if ((transaction.message as MessageV0).isAccountSigner(i)) {
            newTxSigners.push(keys.get(i));
        }
    }
    console.log("Signers: ", newTxSigners)

    // sign and send the transaction
    transaction.sign([USER_KEYPAIR])
    const txid = await connection.sendTransaction(transaction);
    console.log(`https://explorer.solana.com/tx/${txid}`);

})().catch((error) => {
    console.error(error);
    process.exit(1);
});