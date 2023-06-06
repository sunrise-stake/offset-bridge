// Transfer from Solana to Polygon using Wormhole SDK
import { PublicKey, Connection, Keypair, TransactionInstruction } from "@solana/web3.js";
import * as Wormhole from "@certusone/wormhole-sdk";
import { parseUnits } from "@ethersproject/units";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { ethers } from "ethers";
import {
  CHAIN_ID_POLYGON,
  CHAIN_ID_SOLANA,
  POLYGON_TEST_TOKEN_BRIDGE_ADDRESS, POLYGON_TOKEN_BRIDGE_ADDRESS,
  PROGRAM_ID,
  SOL_BRIDGE_ADDRESS,
  SOL_TOKEN_BRIDGE_ADDRESS,
  SOLANA_RPC_ENDPOINT,
  STATE_ADDRESS,
  HOLDING_CONTRACT_ADDRESS,
  USDC_TOKEN_POLYGON,
  USER_KEYPAIR,
  WORMHOLE_RPC_HOSTS_MAINNET
} from "./constants";
import { bridgeAuthority, bridgeInputTokenAccount, tokenAuthority } from "./util";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { IDL, TokenSwap } from "./types/token_swap";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import BN from "bn.js";
import {
  createTransferNativeInstruction,
  createTransferWrappedInstruction
} from "@certusone/wormhole-sdk/lib/cjs/solana/tokenBridge";
import { NodeHttpTransport } from "@improbable-eng/grpc-web-node-http-transport";

require("dotenv").config(({ path: ".env" }));

const POLYGON_PRIVATE_KEY = process.env.POLYGON_PRIVATE_KEY;
const POLYGON_NODE_URL = process.env.POLYGON_NODE_URL;

type TransferTransactionInformation = {
  instruction: TransactionInstruction;
  message: Keypair;
}
export const createWormholeNativeTransfer = async (
  payerAddress: PublicKey,
  fromAddress: PublicKey,
  mintAddress: PublicKey,
  amount: bigint,
  targetAddress: Uint8Array,
): Promise<TransferTransactionInformation> => {
  const nonce = Wormhole.createNonce().readUInt32LE(0);
  const message = Keypair.generate();
  const tokenBridgeTransferIx = createTransferNativeInstruction(
    SOL_TOKEN_BRIDGE_ADDRESS,
    SOL_BRIDGE_ADDRESS,
    payerAddress,
    message.publicKey,
    fromAddress,
    mintAddress,
    nonce,
    amount,
    0n,
    targetAddress,
    CHAIN_ID_POLYGON
  );

  return { instruction: tokenBridgeTransferIx, message }
}

export const createWormholeWrappedTransfer = async (
  payerAddress: PublicKey,
  fromAddress: PublicKey,
  tokenAuthority: PublicKey,
  amount: bigint,
  targetAddress: Uint8Array,
): Promise<TransferTransactionInformation> => {
  const nonce = Wormhole.createNonce().readUInt32LE(0);
  const message = Keypair.generate();
  const tokenBridgeTransferIx = createTransferWrappedInstruction(
    SOL_TOKEN_BRIDGE_ADDRESS,
    SOL_BRIDGE_ADDRESS,
    payerAddress,
    message.publicKey,
    fromAddress,
    tokenAuthority,
    CHAIN_ID_POLYGON, // The origin chain of the wrapped token is polygon
    // USDC_TOKEN_POLYGON,
    Wormhole.tryNativeToUint8Array(USDC_TOKEN_POLYGON, CHAIN_ID_POLYGON), // The origin address of the wrapped token is the USDC token address on polygon
    nonce,
    amount,
    0n,
    targetAddress,
    CHAIN_ID_POLYGON
  );

  // the token authority is a PDA. the instruction be "signed2 by the program when sent to wormhole via CPI.
  // so we don't want an explicit signer here
  tokenBridgeTransferIx.keys.find((key) => key.pubkey.equals(tokenAuthority))!.isSigner = false;

  console.log("payer: ", payerAddress.toBase58())
  console.log("tokenAuthority: ", tokenAuthority.toBase58())
  console.log("message: ", message.publicKey.toBase58())

  return { instruction: tokenBridgeTransferIx, message }
}

// export const createTransferInstruction = async (
//     connection,
//     SOL_BRIDGE_ADDRESS,
//     SOL_TOKEN_BRIDGE_ADDRESS,
//     payerAddress,
//     fromAddress,
//     mintAddress,
//     amount,
//     targetAddress,
//     CHAIN_ID_ETH,
//     originAddress,
//     originChain
// ) => {
//   const tx = await transferFromSolana(
//       connection,
//       SOL_BRIDGE_ADDRESS,
//       SOL_TOKEN_BRIDGE_ADDRESS,
//       payerAddress,
//       fromAddress,
//       mintAddress,
//       amount,
//       targetAddress,
//       CHAIN_ID_ETH,
//       originAddress,
//       originChain
//   );
//   return tx.instructions[1];
// }

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

async function bridge() {
  const ethProvider = new ethers.providers.JsonRpcProvider(POLYGON_NODE_URL);
  const ethSigner = new ethers.Wallet(POLYGON_PRIVATE_KEY, ethProvider);

  const solanaConnection = new Connection(SOLANA_RPC_ENDPOINT, "finalized");
  const solanaProvider = new AnchorProvider(solanaConnection, new NodeWallet(USER_KEYPAIR), {});
  const solanaProgram = new Program<TokenSwap>(IDL, PROGRAM_ID, solanaProvider);

  const fromAddress = bridgeInputTokenAccount

  console.log("fromAddress (USDCpo): ", fromAddress.toBase58());

  // Send 0.001 USDC
  const amount = parseUnits("1", 3).toBigInt();

  const { instruction, message } = await createWormholeWrappedTransfer(
    USER_KEYPAIR.publicKey,
    fromAddress,
    tokenAuthority,
    amount,
    Wormhole.tryNativeToUint8Array(HOLDING_CONTRACT_ADDRESS, CHAIN_ID_POLYGON),
  );

  instruction.keys.forEach((key) => {
    console.log(key.pubkey.toString(), key.isSigner, key.isWritable);
  });
  console.log(instruction.keys.length);
  console.log(instruction.data.toString("hex"));

  const txSig = await solanaProgram.methods.bridge(new BN(amount.toString()), instruction.data).accounts({
    state: STATE_ADDRESS,
    bridgeAuthority,
    tokenAccountAuthority: tokenAuthority,
    tokenAccount: bridgeInputTokenAccount,
    tokenProgram: TOKEN_PROGRAM_ID,
    wormholeProgram: SOL_TOKEN_BRIDGE_ADDRESS,
  }).remainingAccounts(instruction.keys)
    .signers([message])
    .rpc();

  const latestBlockhash = await solanaConnection.getLatestBlockhash();
  await solanaConnection.confirmTransaction({ signature: txSig, ...latestBlockhash });

  console.log("Transaction confirmed:", txSig);

  // Get the sequence number and emitter address required to fetch the signedVAA of our message
  const info = await solanaConnection.getTransaction(txSig);
  if (!info) {
    throw new Error(
      "An error occurred while fetching the transaction info"
    );
  }
  const sequence = Wormhole.parseSequenceFromLogSolana(info);
  const emitterAddress = await Wormhole.getEmitterAddressSolana(SOL_TOKEN_BRIDGE_ADDRESS);

  console.log("Sequence:", sequence);
  console.log("Emitter address:", emitterAddress);
  console.log("Getting signed VAA from the Wormhole Network...");

  // Fetch the signedVAA from the Wormhole Network (this may require retries while you wait for confirmation)
  const { vaaBytes } = await Wormhole.getSignedVAAWithRetry(
    WORMHOLE_RPC_HOSTS_MAINNET,
    CHAIN_ID_SOLANA,
    emitterAddress,
    sequence,
    {
      transport: NodeHttpTransport(),
    }
  );

  console.log("Signed VAA:", Buffer.from(vaaBytes).toString("base64"));
  console.log("Redeeming on Polygon...");

  // Redeem on Ethereum (Polygon in this case)
  await Wormhole.redeemOnEth(POLYGON_TOKEN_BRIDGE_ADDRESS, ethSigner, vaaBytes);
}

async function main() {
  try {
    await bridge();
    console.log('Bridge successful!');
  } catch (err) {
    console.error('Bridge failed:', err);
  }
}

main();