import { Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { AnchorProvider, Program, Wallet } from "@coral-xyz/anchor";
import { Connection, PublicKey, TransactionInstruction } from "@solana/web3.js";
import { TokenSwap } from "../../scripts/types/token_swap";
import IDL from "../../scripts/idls/token_swap.json";
import { USER_KEYPAIR, CHAIN_ID_POLYGON, SOL_TOKEN_BRIDGE_ADDRESS, BRIDGE_INPUT_MINT_ADDRESS, SOL_BRIDGE_ADDRESS, USDC_TOKEN_POLYGON } from "../../scripts/constants";
import { HOLDING_CONTRACT_FACTORY_ADDRESS, holdingContractFactorySalt } from "../../retirement-ui/src/lib/constants";
import { HOLDING_CONTRACT_FACTORY_ABI  } from "../../retirement-ui/src/lib/abi/holdingContractFactory";
// import { bridgeAuthority, bridgeInputTokenAccount } from "../../scripts/util";
import { Account, getAssociatedTokenAddressSync, getOrCreateAssociatedTokenAccount, TOKEN_PROGRAM_ID } from "@solana/spl-token";

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
import { createTransferWrappedInstruction } from "@certusone/wormhole-sdk/lib/cjs/solana/tokenBridge";
import { BN } from "bn.js";
import { createPublicClient, http } from "viem";
import { polygon } from "viem/chains";
import { Address } from "viem";
import { expect } from "chai";
import * as chai from "chai";

const publicClient = createPublicClient({ 
  chain: polygon,
  transport: http()
});

type TransferTransactionInformation = {
  instruction: TransactionInstruction;
  message: Keypair;
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

  const program = new Program<TokenSwap>(IDL as TokenSwap, provider);
  const tokenAuthority = PublicKey.findProgramAddressSync([Buffer.from("token_authority"), stateAddress.toBuffer()], PROGRAM_ID)[0];
  console.log("program set");
  // const bridgeInputTokenAccount = getAssociatedTokenAddressSync(new PublicKey(BRIDGE_INPUT_MINT_ADDRESS), tokenAuthority, true);
  const bridgeAuthority = PublicKey.findProgramAddressSync([Buffer.from("authority_signer")], new PublicKey(SOL_TOKEN_BRIDGE_ADDRESS))[0];

  context("Create and test bridge", () => {
    let holdingContractAddress: Address | undefined = undefined;
    let wormholeTargetAddress: Uint8Array;

    beforeEach(async () => {
      const salt = holdingContractFactorySalt(USER_KEYPAIR.publicKey.toString());

      const holdingContractFactoryGetContractRead = await publicClient.readContract({
        address: HOLDING_CONTRACT_FACTORY_ADDRESS,
        abi: HOLDING_CONTRACT_FACTORY_ABI,
        functionName: "getContractAddress",
        args: [ salt, HOLDING_CONTRACT_FACTORY_ADDRESS ]
      });

      holdingContractAddress = holdingContractFactoryGetContractRead  ? holdingContractFactoryGetContractRead : undefined;
      if (!holdingContractAddress) return;
      wormholeTargetAddress = Wormhole.tryNativeToUint8Array(holdingContractAddress , CHAIN_ID_POLYGON);

    });

      

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
      console.log(holdingContractAddress);
      if (!holdingContractAddress) return;

      const tx = await program.methods.initialize({
          outputMint: OUTPUT_MINT,
          holdingContract: holdingContractAddress.toString(),
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
      const bridgeInputTokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        USER_KEYPAIR,
        new PublicKey(BRIDGE_INPUT_MINT_ADDRESS),
        tokenAuthority,
        true
      );
      const { instruction, message } = await createWormholeWrappedTransfer(
        USER_KEYPAIR.publicKey,
        bridgeInputTokenAccount.address,
        tokenAuthority,
        amount,
        wormholeTargetAddress,
      );
      const tx = await program.methods.bridge(new BN(amount.toString()), instruction.data).accounts({
          state: stateAddress,
          bridgeAuthority,
          tokenAccount: bridgeInputTokenAccount.address,
      }).remainingAccounts(instruction.keys)
        .signers([message])
        .transaction();

        try {
          await provider.sendAndConfirm(tx, [message]);
        } catch (e) {
          console.log(e.getLogs());
          console.log(e);
        }
      });

      it("Target in bridge data not matching state holding contract", async () => {
        const amount = BigInt(1);
        const bridgeInputTokenAccount = await getOrCreateAssociatedTokenAccount(
          connection,
          USER_KEYPAIR,
          new PublicKey(BRIDGE_INPUT_MINT_ADDRESS),
          tokenAuthority,
          true
        );

        const salt = holdingContractFactorySalt(Keypair.generate().publicKey.toString());

        const holdingContractFactoryGetContractRead = await publicClient.readContract({
          address: HOLDING_CONTRACT_FACTORY_ADDRESS,
          abi: HOLDING_CONTRACT_FACTORY_ABI,
          functionName: "getContractAddress",
          args: [ salt, HOLDING_CONTRACT_FACTORY_ADDRESS ]
        });

        const wrongHoldingContractAddress = holdingContractFactoryGetContractRead  ? holdingContractFactoryGetContractRead : undefined;
        if (!wrongHoldingContractAddress) return;
        const wrongWormholeTargetAddress = Wormhole.tryNativeToUint8Array(wrongHoldingContractAddress , CHAIN_ID_POLYGON);

    
        const { instruction, message } = await createWormholeWrappedTransfer(
          USER_KEYPAIR.publicKey,
          bridgeInputTokenAccount.address,
          tokenAuthority,
          amount,
          wrongWormholeTargetAddress,
        );
        const tx = await program.methods.bridge(new BN(amount.toString()), instruction.data).accounts({
            state: stateAddress,
            bridgeAuthority,
            tokenAccount: bridgeInputTokenAccount.address,
        }).remainingAccounts(instruction.keys)
          .signers([message])
          .transaction();
        
        try {
          await provider.sendAndConfirm(tx, [message]);
        } catch (e) {
            const anchorErrLog = e.logs.filter((elog) => elog.includes("AnchorError"));
            expect(anchorErrLog).to.have.lengthOf(1);
            chai.assert.include(anchorErrLog[0], "IncorrectDestinationAccount");
        }
          
      });
    });
});