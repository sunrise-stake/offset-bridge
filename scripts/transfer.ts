
require("dotenv").config({ path: ".env" });
const POLYGON_PRIVATE_KEY = process.env.ETH_PRIVATE_KEY;
const SOLANA_PRIVATE_KEY = process.env.SOLANA_PRIVATE_KEY;
const SOLANA_HOST = process.env.SOLANA_HOST;
const POLYGON_NODE_URL = process.env.ETH_NODE_URL;

const { formatUnits, parseUnits } = require("@ethersproject/units");
const { Wormhole } = require("@certusone/wormhole-sdk");
const {
  Connection,
  Keypair,
  PublicKey,
  TokenAccountsFilter,
} = require("@solana/web3.js");
const { ethers } = require("ethers");

const { SOL_TEST_TOKEN_BRIDGE_ADDRESS, POLYGON_TEST_TOKEN_BRIDGE_ADDRESS, SOL_TEST_BRIDGE_ADDRESS, CHAIN_ID_POLYGON, USDC_TEST_TOKEN, TARGET_CONTRACT, WORMHOLE_RPC_HOST } = require("../constants");


/* 1. attest token 
    - I did this via the token bridge UI on devnet: https://wormhole-foundation.github.io/example-token-bridge-ui/

*/

async function transfer() {
  // create a signer for Eth
  const provider = new ethers.providers.JsonRpcProvider(POLYGON_NODE_URL);
  const signer = new ethers.Wallet(POLYGON_PRIVATE_KEY, provider);
  // create a keypair for Solana
  const keypair = Keypair.fromSecretKey(SOLANA_PRIVATE_KEY);
  const payerAddress = keypair.publicKey.toString();


  // find the associated token account
  const fromAddress = (
    await Wormhole.getAssociatedTokenAddress(
      new PublicKey(USDC_TEST_TOKEN),
      keypair.publicKey
    )
  ).toString();

  const connection = new Connection(SOLANA_HOST, "confirmed");

  const amount = parseUnits("1", 9).toBigInt();
  // Submit transaction - results in a Wormhole message being published
  const transaction = await Wormhole.transferFromSolana(
    connection,
    SOL_BRIDGE_ADDRESS,
    SOL_TOKEN_BRIDGE_ADDRESS,
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

  // Get the sequence number and emitter address required to fetch the signedVAA of our message
  const info = await connection.getTransaction(txid);
  if (!info) {
    throw new Error(
      "An error occurred while fetching the transaction info"
    );
  }
  const sequence = Wormhole.parseSequenceFromLogSolana(info);
  const emitterAddress = await Wormhole.getEmitterAddressSolana(SOL_TOKEN_BRIDGE_ADDRESS);
  // Fetch the signedVAA from the Wormhole Network (this may require retries while you wait for confirmation)
  const { signedVAA } = await Wormhole.getSignedVAAWithRetry(
    WORMHOLE_RPC_HOST,
    CHAIN_ID_SOLANA,
    emitterAddress,
    sequence
  );
  // Redeem on Ethereum
  await Wormhole.redeemOnEth(POLYGON_TEST_TOKEN_BRIDGE_ADDRESS, signer, signedVAA);
}

transfer();