
import fetch from 'node-fetch';
import fs from "fs";
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
import { PROGRAM_ID } from './constants';
import {
    ASSOCIATED_TOKEN_PROGRAM_ID,
    Account,
    TOKEN_PROGRAM_ID,
    getAssociatedTokenAddress,
    getOrCreateAssociatedTokenAccount,
  } from "@solana/spl-token";
import {Program, AnchorProvider, Wallet, Instruction} from "@coral-xyz/anchor";
// import { Jupiter, RouteInfo, TOKEN_LIST_URL } from '@jup-ag/core';
import {IDL, TokenSwap} from "./types/token_swap";
import {ENV, WRAPPED_SOL_TOKEN_MINT, BRIDGE_INPUT_MINT_ADDRESS, SOLANA_RPC_ENDPOINT, JupiterToken, USER_KEYPAIR} from "./constants";
import { getQuote, getSwapIx, swapToBridgeInputTx, getJupiterSwapIx, tokenAuthority } from './util';
import { TEST_STATE_ADDRESS, testTokenAuthority } from "./util";

const API_ENDPOINT = "https://quote-api.jup.ag/v6";
const JUPITER_PROGRAM_ID = "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4";
const SOL_USDC_PRICEFEED_ID = new PublicKey("H6ARHf6YXhGYeQfUzQNGk6rDNnLBQKrenN712K4AQJEG");

(async () => {
    console.log("start");
    // Setup Solana RPC connection
    // const connection = new Connection(SOLANA_RPC_ENDPOINT);
    const connection = new Connection(clusterApiUrl("mainnet-beta"));
    const provider = new AnchorProvider(connection, new Wallet(USER_KEYPAIR), {});
    const program = new Program<TokenSwap>(IDL, PROGRAM_ID, provider);
    console.log(WRAPPED_SOL_TOKEN_MINT);
    console.log(BRIDGE_INPUT_MINT_ADDRESS);

    const quote = await getQuote(new PublicKey(WRAPPED_SOL_TOKEN_MINT), new PublicKey(BRIDGE_INPUT_MINT_ADDRESS), 1000000, 18);
    console.log({ quote });
    fs.writeFile("token-swap/tests/fixtures/jupiter_quote.json", JSON.stringify(quote, null, 4), (err) => {
      if (err) {
          console.log("Error writing file:", err);
      } else {
          console.log("Successfully wrote file for jupiter quote.");
      }
  });
    // Routes are sorted based on outputAmount, so ideally the first route is the best.

    quote.routePlan.forEach((r) => {
        console.log({r});
    })

    
    /*
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
    */

    const jupiterIx = await getSwapIx(testTokenAuthority, quote); //USER_KEYPAIR.publicKey,  quote); // programATA,

    console.log({ jupiterIx });
  
    const {
      computeBudgetInstructions, // The necessary instructions to setup the compute budget.
      swapInstruction,
      addressLookupTableAddresses, // The lookup table addresses that you can use if you are using versioned transaction.
    } = jupiterIx;

    const jupiterSwapIx = getJupiterSwapIx(swapInstruction);

    console.log({ jupiterSwapIx });

    fs.writeFile("token-swap/tests/fixtures/jupiter_swap_ix_data.json", JSON.stringify(jupiterSwapIx.data.toJSON(), null, 4), (err) => {
        if (err) {
            console.log("Error writing file:", err);
        } else {
            console.log("Successfully wrote file for jupiter swap ix data.");
        }
    });
    const accountMetas = jupiterSwapIx.keys;
    fs.writeFile("token-swap/tests/fixtures/account_metas.json", JSON.stringify(accountMetas, null, 4), (err) => {
      if (err) {
          console.log("Error writing file:", err);
      } else {
          console.log("Successfully wrote file for account_metas.");
      }
  });

    console.log({ accountMetas });

    // Find input and output ATAs of tokenAuthority
    const tokenAuthorityAtaOut = await getOrCreateAssociatedTokenAccount(
      connection,
      USER_KEYPAIR,
      new PublicKey(BRIDGE_INPUT_MINT_ADDRESS),
      tokenAuthority,
      true
    );
    const tokenAuthorityAtaIn = await getOrCreateAssociatedTokenAccount(
      connection,
      USER_KEYPAIR,
      new PublicKey(WRAPPED_SOL_TOKEN_MINT),
      tokenAuthority,
      true
    );
    // create the swap instruction
    const swapIx = await program.methods.swap(jupiterSwapIx.data).accounts({
        state: TEST_STATE_ADDRESS,
        tokenAccountAuthority: tokenAuthority,
        inputMint: WRAPPED_SOL_TOKEN_MINT,
        tokenAtaAddressIn: tokenAuthorityAtaIn.address,
        outputMint: BRIDGE_INPUT_MINT_ADDRESS,
        tokenAtaAddressOut: tokenAuthorityAtaOut.address,
        jupiterProgram: JUPITER_PROGRAM_ID,
        pythPriceFeedAccount: SOL_USDC_PRICEFEED_ID,
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
    console.log( {addressLookupTableAddresses} );
    console.log( {addressLookupTableAccountInfos} );

    // const price_feed_info = await connection.getAccountInfo(SOL_USDC_PRICEFEED_ID);
    // console.log(price_feed_info.data);

    fs.writeFile("token-swap/tests/fixtures/accounts_for_test_validator.txt", "",  function(err) {
      if (err) {
          return console.error(err);
      }
      console.log("File created!");
    });
    console.log(USER_KEYPAIR.publicKey);
    console.log(jupiterSwapIx.data);
    for (let i = 0; i < addressLookupTableAddresses.length; i++) {
        const alt = addressLookupTableAddresses[i];
        const alt_info = addressLookupTableAccountInfos[i];
        try {
          const rentEpoch = new Number(alt_info.rentEpoch).toPrecision();
          fs.writeFile(`token-swap/tests/fixtures/${alt}.json`, JSON.stringify({"pubkey": alt, "account": {
            "lamports": alt_info.lamports,
            "data":  [alt_info.data.toString("base64"), "base64"],
            "owner": alt_info.owner.toBase58(),
            "executable": alt_info.executable,
            "rentEpoch": 361,
            "space": alt_info.data.length,
          }}, null, 2), (err) => {
            if (err) {
                console.log("Error writing file:", err);
            } else {
                console.log("Successfully wrote file for account:", alt);
            }
            
        });
        fs.appendFile("token-swap/tests/fixtures/accounts_for_test_validator.txt",
        `[[test.validator.account]]\naddress = "${alt}" \nfilename = "tests/fixtures/${alt}.json"\n`, function (err) {
          if (err) throw err;
          console.log('Saved!');
        });
          } catch (e) {
            console.log(alt);
            console.log(alt_info);
            console.log(e);
          }
    }
    for (const account_meta of accountMetas) {
        const account_meta_info = await connection.getAccountInfo(account_meta.pubkey);
        try {
          const rentEpoch = new Number(account_meta_info.rentEpoch).toPrecision();
          fs.writeFile(`token-swap/tests/fixtures/${account_meta.pubkey.toBase58()}.json`, JSON.stringify({"pubkey": account_meta.pubkey.toBase58(), "account": {
            "lamports": account_meta_info.lamports,
            "data": [account_meta_info.data.toString("base64"), "base64"],
            "owner": account_meta_info.owner.toBase58(),
            "executable": account_meta_info.executable,
            "rentEpoch": 361,
            "space": account_meta_info.data.length,
          }}, null, 2), (err) => {
            if (err) {
                console.log("Error writing file:", err);
            } else {
                console.log("Successfully wrote file for account:", account_meta.pubkey.toBase58());
            }
        });
        fs.appendFile("token-swap/tests/fixtures/accounts_for_test_validator.txt",
          `[[test.validator.account]]\naddress = "${account_meta.pubkey.toBase58()}" \nfilename = "tests/fixtures/${account_meta.pubkey.toBase58()}.json"\n`, function (err) {
          if (err) throw err;
          console.log('Saved!');
        });
          } catch (e) {
            console.log(account_meta);
            console.log(account_meta_info);
            console.log(e);
          }
    };

    await provider.simulate(swapTx, [new Wallet(USER_KEYPAIR).payer]);
  
    const txID = await provider.sendAndConfirm(swapTx, [USER_KEYPAIR]);
    console.log({ txID });
    console.log(`https://explorer.solana.com/tx/${txID}`);
    // } catch (e) {
    //  console.log({ simulationResponse: e.simulationResponse });
    // }

})().catch((error) => {
    console.error(error);
    process.exit(1);
});