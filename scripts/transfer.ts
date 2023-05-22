// Transfer from Solana to Ethereum using Wormhole SDK 
import * as os from "os";
import {NodeHttpTransport} from "@improbable-eng/grpc-web-node-http-transport";

const { ethers } = require("ethers");
require("dotenv").config(({ path: ".env" }));
const POLYGON_PRIVATE_KEY = process.env.POLYGON_PRIVATE_KEY;
const SOLANA_PRIVATE_KEY = process.env.SOLANA_PRIVATE_KEY;
const SOLANA_HOST = process.env.SOLANA_HOST;
const POLYGON_NODE_URL = process.env.POLYGON_NODE_URL;

const { formatUnits, parseUnits } = require("@ethersproject/units");
const Wormhole = require("@certusone/wormhole-sdk");
const { getAssociatedTokenAddress } = require("@solana/spl-token");
const {
  Connection,
  Keypair,
  PublicKey,
  TokenAccountsFilter,
  sendAndConfirmTransaction,
  clusterApiUrl
} = require("@solana/web3.js");
const bs58 = require("bs58");

const { SOL_TEST_TOKEN_BRIDGE_ADDRESS, POLYGON_TEST_TOKEN_BRIDGE_ADDRESS, SOL_TEST_BRIDGE_ADDRESS, CHAIN_ID_POLYGON, CHAIN_ID_SOLANA, USDC_TEST_TOKEN, TARGET_CONTRACT, WORMHOLE_RPC_HOST } = require("../constants");


/* 
0. get test token 
    - i actually found USDC faucet here: https://usdcfaucet.com/, however not available on testnet 
    - use this interface instead: https://spl-token-faucet.com/?token-name=USDC
1. attest token if necessary 
    - I did this via the token bridge UI on devnet: https://wormhole-foundation.github.io/example-token-bridge-ui/
2. transfer - code examples from: 
    - https://github.com/wormhole-foundation/wormhole/tree/main/sdk/js
    - https://github.com/wormhole-foundation/wormhole/blob/main/sdk/js/src/token_bridge/__tests__/solana-integration.ts
*/

async function transfer() {
  // create a signer for Eth
  const provider = new ethers.providers.JsonRpcProvider(POLYGON_NODE_URL);
  const signer = new ethers.Wallet(POLYGON_PRIVATE_KEY, provider);
  // create a keypair for Solana
  const keypair = SOLANA_PRIVATE_KEY ? Keypair.fromSecretKey(bs58.decode(SOLANA_PRIVATE_KEY)) : Keypair.fromSecretKey(Buffer.from(require(os.homedir() + '/.config/solana/id.json')));
  const payerAddress = keypair.publicKey.toString();


  // find the associated token account
  const fromAddress = (
    await getAssociatedTokenAddress(
      new PublicKey(USDC_TEST_TOKEN),
      keypair.publicKey
    )
  ).toString();

  // const connection = new Connection(SOLANA_HOST, "confirmed");
  const connection = new Connection(clusterApiUrl("devnet"), "finalized");


  // Send 1 USDC
  const amount = parseUnits("1", 6).toBigInt();
  // Submit transaction - results in a Wormhole message being published
  const transaction = await Wormhole.transferFromSolana(
    connection,
    SOL_TEST_BRIDGE_ADDRESS,
    SOL_TEST_TOKEN_BRIDGE_ADDRESS,
    payerAddress,
    fromAddress,
    USDC_TEST_TOKEN,
    amount,
    //   targetAddress,
    //   CHAIN_ID_ETH,
    //   originAddress,
    //   originChain
    // );
    Wormhole.tryNativeToUint8Array(TARGET_CONTRACT, CHAIN_ID_POLYGON),
    CHAIN_ID_POLYGON
  );

  // const signed = await wallet.signTransaction(transaction);
  // const txid = await connection.sendRawTransaction(signed.serialize());
  // await connection.confirmTransaction(txid); 

  // sign, send, and confirm transaction
  transaction.partialSign(keypair);
  const txid = await connection.sendRawTransaction(
    transaction.serialize()
  );
  await connection.confirmTransaction(txid);

  console.log("Transaction confirmed:", txid);

  // Get the sequence number and emitter address required to fetch the signedVAA of our message
  const info = await connection.getTransaction(txid);
  if (!info) {
    throw new Error(
      "An error occurred while fetching the transaction info"
    );
  }
  const sequence = Wormhole.parseSequenceFromLogSolana(info);
  const emitterAddress = await Wormhole.getEmitterAddressSolana(SOL_TEST_TOKEN_BRIDGE_ADDRESS);

  console.log("Emitter address:", emitterAddress);
  console.log("Getting signed VAA from the Wormhole Network...");

  // Fetch the signedVAA from the Wormhole Network (this may require retries while you wait for confirmation)
  const { vaaBytes } = await Wormhole.getSignedVAAWithRetry(
    WORMHOLE_RPC_HOST,
    CHAIN_ID_SOLANA,
    emitterAddress,
    sequence,
      {
        transport: NodeHttpTransport(),
      }
  );

  console.log("Signed VAA:", vaaBytes);
  console.log("Redeeming on Polygon...");

  // Redeem on Ethereum (Polygon in this case)
  await Wormhole.redeemOnEth(POLYGON_TEST_TOKEN_BRIDGE_ADDRESS, signer, vaaBytes);
}

async function main() {
  try {
    await transfer();
    console.log('Transfer successful!');
  } catch (err) {
    console.error('Transfer failed:', err);
  }
}

main();