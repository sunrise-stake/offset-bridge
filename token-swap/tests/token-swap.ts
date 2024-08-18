import { Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { AnchorProvider, Program, Wallet } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import { TokenSwap, IDL } from "../../scripts/types/token_swap";
import { USER_KEYPAIR, CHAIN_ID_POLYGON, SOL_TOKEN_BRIDGE_ADDRESS } from "../../scripts/constants";
import { HOLDING_CONTRACT_FACTORY_ADDRESS, holdingContractFactorySalt } from "../../retirement-ui/src/lib/constants";
import { HOLDING_CONTRACT_FACTORY_ABI  } from "../../retirement-ui/src/lib/abi/holdingContractFactory";
import { bridgeAuthority, bridgeInputTokenAccount } from "../../scripts/util";
import * as Wormhole from "@certusone/wormhole-sdk";

export const PROGRAM_ID = new PublicKey(
  "suobUdMc9nSaQ1TjRkQA4K6CR9CmDiU9QViN7kVw74T"
);
export const SOL_USDC_PRICEFEED_ID = new PublicKey("H6ARHf6YXhGYeQfUzQNGk6rDNnLBQKrenN712K4AQJEG");
export const ETH_USDC_PRICEFEED_ID = new PublicKey("JBu1AL4obBcCMqKBBxhpWCNUt136ijcuMZLFvTP7iWdB");
export const JUPITER_PROGRAM_ID = "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4";
export const OUTPUT_MINT = new PublicKey("E2VmbootbVCBkMNNxKQgCLMS1X3NoGMaYAsufaAsf7M");
export const INBETWEEN_MINT = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
export const WRAPPED_SOL_TOKEN_MINT = new PublicKey("So11111111111111111111111111111111111111112");
export const HOLDING_CONTRACT_ADDRESS = "";
import { createWormholeWrappedTransfer } from "../../scripts/bridge";
import { BN } from "bn.js";
import { TOKEN_PROGRAM_ID } from "spl-token-latest";
import { createPublicClient, http } from "viem";
import { polygon } from "viem/chains";
 
const publicClient = createPublicClient({ 
  chain: polygon,
  transport: http()
});

describe("token-swap", () => {
  // Configure the client to use the local cluster.
  console.log("test start");
  // const userKeypair = Keypair.generate();
  const stateKeypair = Keypair.generate();
  const stateAddress = stateKeypair.publicKey;
  const wallet = new Wallet(USER_KEYPAIR);
  const connection = new Connection("http://localhost:8890");
  const provider = new AnchorProvider(connection, wallet, {});
  console.log("provider set");

  const program = new Program<TokenSwap>(IDL, PROGRAM_ID, provider);
  const tokenAuthority = PublicKey.findProgramAddressSync([Buffer.from("token_authority"), stateAddress.toBuffer()], PROGRAM_ID)[0];
  console.log("program set");

  it("Is initialized!", async () => {
    // Add your test here.
    const tx1 = await connection.requestAirdrop(
      USER_KEYPAIR.publicKey,
      LAMPORTS_PER_SOL
    );
    const blockhash1 = await connection.getLatestBlockhash();
    await connection.confirmTransaction({ signature: tx1, ...blockhash1 });
    const tx2 = await connection.requestAirdrop(
      stateAddress,
      LAMPORTS_PER_SOL
    );
    const blockhash2 = await connection.getLatestBlockhash();
    await connection.confirmTransaction({ signature: tx2, ...blockhash2 });
    console.log("airdrop done")

    const tx = await program.methods.initialize({
        outputMint: OUTPUT_MINT,
        holdingContract: HOLDING_CONTRACT_ADDRESS,
        tokenChainId: CHAIN_ID_POLYGON.toString(),
        updateAuthority: USER_KEYPAIR.publicKey
    }).accounts({ state: stateAddress, authority: USER_KEYPAIR.publicKey })
    .signers([stateKeypair ])
    .rpc()
    .catch((e) => {
      console.log(e.logs);
      throw e;
    });
    console.log("Your transaction signature", tx);
  });

  it("Target in bridge data match state holding contract", async () => {
    const amount = BigInt(1);
    const salt = holdingContractFactorySalt(USER_KEYPAIR.publicKey.toString());

    const holdingContractFactoryGetContractRead = await publicClient.readContract({
      address: HOLDING_CONTRACT_FACTORY_ADDRESS,
      abi: HOLDING_CONTRACT_FACTORY_ABI,
      functionName: "getContractAddress",
      args: [ salt, HOLDING_CONTRACT_FACTORY_ADDRESS ]
    });

    const holdingContractAddress = holdingContractFactoryGetContractRead  ? holdingContractFactoryGetContractRead : undefined;
    if (!holdingContractAddress) return;

    const { instruction, message } = await createWormholeWrappedTransfer(
      USER_KEYPAIR.publicKey,
      bridgeInputTokenAccount,
      tokenAuthority,
      amount,
      Wormhole.tryNativeToUint8Array("" , CHAIN_ID_POLYGON),
    );
    const tx = await program.methods.bridge(new BN(amount.toString()), instruction.data).accounts({
        state: stateAddress,
        bridgeAuthority,
        tokenAccountAuthority: tokenAuthority,
        tokenAccount: bridgeInputTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
        wormholeProgram: SOL_TOKEN_BRIDGE_ADDRESS,
    }).remainingAccounts(instruction.keys)
      .signers([message]) // appears to get erased when calling transaction()  - TODO remove?
      .transaction();
    });
  
  });
