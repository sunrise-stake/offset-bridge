
import fetch from 'node-fetch';
import JSBI from 'jsbi';
import {
    AddressLookupTableAccount,
    clusterApiUrl,
    Connection,
    PublicKey,
    Keypair,
    TransactionMessage,
    TransactionInstruction,
    Transaction,
    VersionedTransaction,
    Blockhash,
    AccountInfo
} from '@solana/web3.js';
import { PROGRAM_ID, STATE_ADDRESS } from './constants';
import {
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    getAssociatedTokenAddress,
    getOrCreateAssociatedTokenAccount,
  } from "@solana/spl-token";
import {Program, AnchorProvider, Wallet, Instruction} from "@coral-xyz/anchor";
// import { Jupiter, RouteInfo, TOKEN_LIST_URL } from '@jup-ag/core';
import {IDL, TokenSwap} from "./types/token_swap";
import {ENV, WRAPPED_SOL_TOKEN_MINT, BRIDGE_INPUT_MINT_ADDRESS, SOLANA_RPC_ENDPOINT, JupiterToken, USER_KEYPAIR} from "./constants";

const API_ENDPOINT = "https://quote-api.jup.ag/v6";
const JUPITER_PROGRAM_ID = "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4";

const getQuote = async (
    fromMint: PublicKey,
    toMint: PublicKey,
    amount: number
  ) => {
    return fetch(
      `${API_ENDPOINT}/quote?outputMint=${toMint.toBase58()}&inputMint=${fromMint.toBase58()}&amount=${amount}&slippage=0.01&onlyDirectRoutes=false`
    ).then((response) => response.json());
  };

const getSwapIx = async (
    user: PublicKey,
    // outputAccount: PublicKey,
    quote: any
  ) => {
    const data = {
      quoteResponse: quote,
      userPublicKey: user.toBase58(),
      // destinationTokenAccount: outputAccount.toBase58(),
    };
    return fetch(`${API_ENDPOINT}/swap-instructions`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }).then((response) => response.json());
  };

  export const getJupiterSwapIx = (
    instruction: any
  ) => {
    if (instruction === null) {
      return null;
    }
  
    return new TransactionInstruction({
      programId: new PublicKey(instruction.programId),
      keys: instruction.accounts.map((key) => ({
        pubkey: new PublicKey(key.pubkey),
        isSigner: key.isSigner,
        isWritable: key.isWritable,
      })),
      data: Buffer.from(instruction.data, "base64"),
    });
  };

  export const getAdressLookupTableAccounts = (
    keys: string[],
    addressLookupTableAccountInfos: any,
  ): AddressLookupTableAccount[] => {
  
    return addressLookupTableAccountInfos.reduce((acc, accountInfo, index) => {
      const addressLookupTableAddress = keys[index];
      if (accountInfo) {
        const addressLookupTableAccount = new AddressLookupTableAccount({
          key: new PublicKey(addressLookupTableAddress),
          state: AddressLookupTableAccount.deserialize(accountInfo.data),
        });
        acc.push(addressLookupTableAccount);
      }
  
      return acc;
    }, new Array<AddressLookupTableAccount>());
  };

  export const instructionDataToTransactionInstruction = (
    instructionPayload: any
  ) => {
    if (instructionPayload === null) {
      return null;
    }
  
    return new TransactionInstruction({
      programId: new PublicKey(instructionPayload.programId),
      keys: instructionPayload.accounts.map((key) => ({
        pubkey: new PublicKey(key.pubkey),
        isSigner: key.isSigner,
        isWritable: key.isWritable,
      })),
      data: Buffer.from(instructionPayload.data, "base64"),
    });
  };

  const swapToBridgeInputTx = (
    swapIx: TransactionInstruction,
    recentBlockhash: Blockhash,
    payer: Keypair,
    computeBudgetPayloads: any[],
    addressLookupTableAddresses: string[],
    addressLookupTableAccountInfos: any
  ) => {
  
    // If you want, you can add more lookup table accounts here
    const addressLookupTableAccounts = getAdressLookupTableAccounts(
      addressLookupTableAddresses, addressLookupTableAccountInfos
    );

    const instructions = [
      ...computeBudgetPayloads.map(instructionDataToTransactionInstruction),
      swapIx,
    ];

    const messageV0 = new TransactionMessage({
      payerKey: payer.publicKey,
      recentBlockhash: recentBlockhash,
      instructions,
    }).compileToV0Message(addressLookupTableAccounts);

    const transaction = new VersionedTransaction(messageV0);

    return transaction
  };

(async () => {
    console.log("start");
    // Setup Solana RPC connection
    // const connection = new Connection(SOLANA_RPC_ENDPOINT);
    const connection = new Connection(clusterApiUrl("testnet"));
    const provider = new AnchorProvider(connection, new Wallet(USER_KEYPAIR), {});
    const program = new Program<TokenSwap>(IDL, PROGRAM_ID, provider);
    console.log(WRAPPED_SOL_TOKEN_MINT);
    console.log(BRIDGE_INPUT_MINT_ADDRESS);

    const quote = await getQuote(new PublicKey(WRAPPED_SOL_TOKEN_MINT), new PublicKey(BRIDGE_INPUT_MINT_ADDRESS), 1000000);
    console.log({ quote });

    // Routes are sorted based on outputAmount, so ideally the first route is the best.

    quote.routePlan.forEach((r) => {
        console.log({r});
    })

    

    const programATA = await getAssociatedTokenAddress(
      new PublicKey(BRIDGE_INPUT_MINT_ADDRESS),
      USER_KEYPAIR.publicKey
    )
    console.log(programATA);
    const programATA2 = PublicKey.findProgramAddressSync(
      [
        USER_KEYPAIR.publicKey.toBuffer(),
        TOKEN_PROGRAM_ID.toBuffer(),
        (new PublicKey(BRIDGE_INPUT_MINT_ADDRESS)).toBuffer(),
      ],
      ASSOCIATED_TOKEN_PROGRAM_ID
    )[0];
    console.log(programATA2);
    console.log(USER_KEYPAIR.publicKey);

    const jupiterIx = await getSwapIx(USER_KEYPAIR.publicKey,  quote); // programATA,

    console.log({ jupiterIx });
  
    const {
      computeBudgetInstructions, // The necessary instructions to setup the compute budget.
      swapInstruction,
      addressLookupTableAddresses, // The lookup table addresses that you can use if you are using versioned transaction.
    } = jupiterIx;

    const jupiterSwapIx = getJupiterSwapIx(swapInstruction);

    console.log({ jupiterSwapIx });

    const accountMetas = jupiterSwapIx.keys;

    console.log({ accountMetas });

    // create the swap instruction
    const swapIx = await program.methods.swap(jupiterSwapIx.data).accounts({
        state: STATE_ADDRESS,
        jupiterProgram: JUPITER_PROGRAM_ID,
    }).remainingAccounts([
        ...accountMetas
    ]).instruction()

    const blockhash = await connection
        .getLatestBlockhash()
        .then((res) => res.blockhash);

    const addressLookupTableAccountInfos = await connection.getMultipleAccountsInfo(
      addressLookupTableAddresses.map((key) => new PublicKey(key))
    );

    const swapTx = swapToBridgeInputTx(
      swapIx,
      blockhash,
      USER_KEYPAIR,
      computeBudgetInstructions,
      addressLookupTableAddresses,
      addressLookupTableAccountInfos
    );

    try {
      await provider.simulate(swapTx, [USER_KEYPAIR]);
  
      const txID = await provider.sendAndConfirm(swapTx, [USER_KEYPAIR]);
      console.log({ txID });
      console.log(`https://explorer.solana.com/tx/${txID}`);
    } catch (e) {
      console.log({ simulationResponse: e.simulationResponse });
    }

})().catch((error) => {
    console.error(error);
    process.exit(1);
});