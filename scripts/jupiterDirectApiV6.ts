import fetch from 'node-fetch';
import {
    Connection,
    PublicKey,
} from '@solana/web3.js';
import {WRAPPED_SOL_TOKEN_MINT, BRIDGE_INPUT_MINT_ADDRESS, SOLANA_RPC_ENDPOINT, USER_KEYPAIR} from "./constants";

const API_ENDPOINT = "https://quote-api.jup.ag/v6";

const getQuote = async (
    fromMint: PublicKey,
    toMint: PublicKey,
    amount: number
  ) => {
    return fetch(
      `${API_ENDPOINT}/quote?outputMint=${toMint.toBase58()}&inputMint=${fromMint.toBase58()}&amount=${amount}&slippage=0.01&onlyDirectRoutes=false`
    ).then((response) => response.json());
  };

const executeSwap = async (
    user: PublicKey,
    quote: any
  ) => {
    const data = {
      quoteResponse: quote,
      userPublicKey: user.toBase58(),
    };
    return fetch(`${API_ENDPOINT}/swap`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }).then((response) => response.json());
  };

(async () => {
    console.log("start");
    // Setup Solana RPC connection
    const connection = new Connection(SOLANA_RPC_ENDPOINT);
    console.log(WRAPPED_SOL_TOKEN_MINT);
    console.log(BRIDGE_INPUT_MINT_ADDRESS);

    const quote = await getQuote(new PublicKey(WRAPPED_SOL_TOKEN_MINT), new PublicKey(BRIDGE_INPUT_MINT_ADDRESS), 1000000);
    console.log({ quote });

    // Routes are sorted based on outputAmount, so ideally the first route is the best.

    quote.routePlan.forEach((r) => {
        console.log({r});
    })

    // Execute swap
    const swapResult = await executeSwap(USER_KEYPAIR.publicKey, quote);

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