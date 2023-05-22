import fetch from 'node-fetch';
import JSBI from 'jsbi';
import {
    Connection,
    PublicKey,
    VersionedTransaction, MessageV0, TransactionMessage
} from '@solana/web3.js';
import {Jupiter, TOKEN_LIST_URL} from '@jup-ag/core';
import {ENV, INPUT_MINT_ADDRESS, OUTPUT_MINT_ADDRESS, SOLANA_RPC_ENDPOINT, Token, USER_KEYPAIR} from "./constants";
import {Program, AnchorProvider } from "@coral-xyz/anchor";
import {IDL, TokenSwap} from "./types/token_swap";
import BN from "bn.js";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";

const PROGRAM_ID = new PublicKey("sutsaKhPL3nMSPtvRY3e9MbpmqQbEJip6vYqT9AQcgN");
const STATE_ADDRESS = new PublicKey("FhVZksvDo2dFUCoqEwqv8idS9i4FtQ97amkcJ1d4MHS5");

(async () => {
    // Setup Solana RPC connection
    const connection = new Connection(SOLANA_RPC_ENDPOINT);

    // Fetch token list from Jupiter API
    // This token list contains token meta data
    const tokens: Token[] = await (await fetch(TOKEN_LIST_URL[ENV])).json() as Token[];

    //  Load Jupiter
    const jupiter = await Jupiter.load({
        connection,
        cluster: ENV,
        user: USER_KEYPAIR, // or public key
        // platformFeeAndAccounts:  NO_PLATFORM_FEE,
        // routeCacheDuration: CACHE_DURATION_MS
        // wrapUnwrapSOL: true (default) | false
    });

    const routeMap: Map<string, string[]> = jupiter.getRouteMap()

    const inputToken = tokens.find((t) => t.address == INPUT_MINT_ADDRESS);
    const outputToken = tokens.find((t) => t.address == OUTPUT_MINT_ADDRESS);

    if (!inputToken || !outputToken) {
        throw new Error("Input or output token not found");
    }

    const routes = await jupiter.computeRoutes({
        inputMint: new PublicKey(inputToken.address),
        outputMint: new PublicKey(outputToken.address),
        amount: JSBI.BigInt(100000), // 100k lamports
        slippageBps: 10  // 1 bps = 0.01%.
        // forceFetch (optional) => to force fetching routes and not use the cache.
        // intermediateTokens => if provided will only find routes that use the intermediate tokens.
        // feeBps => the extra fee in BPS you want to charge on top of this swap.
        // onlyDirectRoutes =>  Only show single hop routes.
        // swapMode => "ExactIn" | "ExactOut" Defaults to "ExactIn"  "ExactOut" is to support use cases like payments when you want an exact output amount.
        // enforceSingleTx =>  Only show routes where only one single transaction is used to perform the Jupiter swap.
    });

    // Routes are sorted based on outputAmount, so ideally the first route is the best.
    const bestRoute = routes.routesInfos[0]
    const { execute, swapTransaction , addressLookupTableAccounts } = await jupiter.exchange({
        routeInfo: bestRoute
    });

    // execute the swap transaction
    const provider = new AnchorProvider(connection, new NodeWallet(USER_KEYPAIR), {});
    const program = new Program<TokenSwap>(IDL, PROGRAM_ID, provider);
    const state = await program.account.state.fetch(STATE_ADDRESS);

    const message = (swapTransaction as VersionedTransaction).message as MessageV0;
    const messageAccountKeys = message.getAccountKeys({ addressLookupTableAccounts })
    let accountMetas = [];
    for (let i = 0; i < messageAccountKeys.length; i++) {
        const accountKey = messageAccountKeys.get(i);
        const accountMeta = {
            pubkey: accountKey,
            isSigner: message.isAccountSigner(i),
            isWritable: message.isAccountWritable(i)
        };
        accountMetas.push(accountMeta);
    }

    const ix = await program.methods.swap(new BN("10000")).accounts({
        state: STATE_ADDRESS
    }).remainingAccounts([
        ...accountMetas
    ]).instruction()


    const blockhash = await connection
        .getLatestBlockhash()
        .then((res) => res.blockhash);
    const messageV0 = new TransactionMessage({
        payerKey: USER_KEYPAIR.publicKey,
        recentBlockhash: blockhash,
        instructions: [ix],
    }).compileToV0Message(addressLookupTableAccounts);
    const transaction = new VersionedTransaction(messageV0);
    transaction.sign([USER_KEYPAIR])
    const txid = await connection.sendTransaction(transaction);
    console.log(`https://explorer.solana.com/tx/${txid}`);

})().catch((error) => {
    console.error(error);
    process.exit(1);
});