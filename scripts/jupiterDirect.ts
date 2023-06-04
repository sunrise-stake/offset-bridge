import fetch from 'node-fetch';
import JSBI from 'jsbi';
import {
    Connection,
    PublicKey,
    Keypair,
    TransactionInstruction,
    Transaction,
    VersionedTransaction
} from '@solana/web3.js';
import { Jupiter, RouteInfo, TOKEN_LIST_URL } from '@jup-ag/core';
import {ENV, WRAPPED_SOL_TOKEN_MINT, BRIDGE_INPUT_MINT_ADDRESS, SOLANA_RPC_ENDPOINT, JupiterToken, USER_KEYPAIR} from "./constants";

(async () => {
    // Setup Solana RPC connection
    const connection = new Connection(SOLANA_RPC_ENDPOINT);

    // Fetch token list from Jupiter API
    // This token list contains token meta data
    const tokens: JupiterToken[] = await (await fetch(TOKEN_LIST_URL[ENV])).json() as JupiterToken[];

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

    const inputToken = tokens.find((t) => t.address == WRAPPED_SOL_TOKEN_MINT);
    const outputToken = tokens.find((t) => t.address == BRIDGE_INPUT_MINT_ADDRESS);

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
    const { execute } = await jupiter.exchange({
        routeInfo: bestRoute
    });

    // Execute swap
    const swapResult: any = await execute(); // Force any to ignore TS misidentifying SwapResult type

    if (swapResult.error) {
        console.log(swapResult.error);
    } else {
        console.log(`https://explorer.solana.com/tx/${swapResult.txid}`);
        console.log(`inputAddress=${swapResult.inputAddress.toString()} outputAddress=${swapResult.outputAddress.toString()}`);
        console.log(`inputAmount=${swapResult.inputAmount} outputAmount=${swapResult.outputAmount}`);
    }

})().catch((error) => {
    console.error(error);
    process.exit(1);
});