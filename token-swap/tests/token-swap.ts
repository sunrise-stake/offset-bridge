import fs from "fs";
import { AnchorProvider, Program, Wallet } from "@coral-xyz/anchor";
import BN from "bn.js";
import { AccountMeta, AddressLookupTableProgram, Connection, LAMPORTS_PER_SOL, SystemProgram, Transaction, PublicKey, TransactionInstruction, TransactionMessage, VersionedTransaction } from "@solana/web3.js";
import { TokenSwap, IDL } from "../../scripts/types/token_swap";
import { getOrCreateAssociatedTokenAccount, createSyncNativeInstruction, getAccount } from "@solana/spl-token";
import { USER_KEYPAIR, TEST_STATE_KEYPAIR } from "../../scripts/constants";
import { instructionDataToTransactionInstruction, getSwapIx, getJupiterSwapIx, swapToBridgeInputTx } from "../../scripts/util";
import { AccountMetaFromJSON } from "@jup-ag/api";


import * as chai from "chai";
import chaiAsPromised from "chai-as-promised";
chai.use(chaiAsPromised);
const { expect } = chai;


export const PROGRAM_ID = new PublicKey(
  "sutsaKhPL3nMSPtvRY3e9MbpmqQbEJip6vYqT9AQcgN"
);
export const SOL_USDC_PRICEFEED_ID = new PublicKey("H6ARHf6YXhGYeQfUzQNGk6rDNnLBQKrenN712K4AQJEG");
export const ETH_USDC_PRICEFEED_ID = new PublicKey("JBu1AL4obBcCMqKBBxhpWCNUt136ijcuMZLFvTP7iWdB");
export const JUPITER_PROGRAM_ID = "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4";
export const OUTPUT_MINT = new PublicKey("E2VmbootbVCBkMNNxKQgCLMS1X3NoGMaYAsufaAsf7M");
export const INBETWEEN_MINT = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
export const WRAPPED_SOL_TOKEN_MINT = new PublicKey("So11111111111111111111111111111111111111112");


describe("token-swap", () => {
  // Configure the client to use the local cluster.
  console.log("test start");
  // const userKeypair = Keypair.generate();
  const stateKeypair = TEST_STATE_KEYPAIR; //Keypair.generate();
  const stateAddress = stateKeypair.publicKey;
  const wallet = new Wallet(USER_KEYPAIR);
  const connection = new Connection("http://localhost:8890");
  const provider = new AnchorProvider(connection, wallet, {});
  console.log("provider set");

  const program = new Program<TokenSwap>(IDL, PROGRAM_ID, provider);
  const tokenAuthority = PublicKey.findProgramAddressSync([Buffer.from("input_account"), stateAddress.toBuffer()], PROGRAM_ID)[0];
  console.log("program set");

  it("Is initialized!", async () => {
    // Initialise offset-bridge program
    console.log("first test");
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

    const tx = await program.methods.initialize(
      WRAPPED_SOL_TOKEN_MINT,
      OUTPUT_MINT,
      new BN(1),
      SOL_USDC_PRICEFEED_ID,
      new BN(31536000),
      USER_KEYPAIR.publicKey,
    ).accounts({ state: stateAddress, tokenAccountAuthority: tokenAuthority })
      .signers([stateKeypair])
      .rpc()
      .catch((e) => {
        console.log(e.logs);
        throw e;
      });
    console.log("Your transaction signature", tx);
  });

  it("Can wrap", async () => {
      // Wrap SOL into ATA of token authority
      const tx = await connection.requestAirdrop(
        tokenAuthority,
        LAMPORTS_PER_SOL
      );
      const blockhash = await connection.getLatestBlockhash();     
      await connection.confirmTransaction({ signature: tx, ...blockhash });
      const tokenAuthorityAta0 = await getOrCreateAssociatedTokenAccount(
        connection,
        USER_KEYPAIR,
        WRAPPED_SOL_TOKEN_MINT,
        tokenAuthority,
        true
      );
      const txWrap = new Transaction().add(
        SystemProgram.transfer({
            fromPubkey: USER_KEYPAIR.publicKey, lamports: 2000000, toPubkey: tokenAuthorityAta0.address
        }),
        createSyncNativeInstruction(tokenAuthorityAta0.address)
    );

    await provider.sendAndConfirm(txWrap, [USER_KEYPAIR]);
  });
  context("Is swapped", () => {
    let swapIx: TransactionInstruction;
    let jupiterIx: any;
    let jupiterSwapIxForPDA: any;
    let accountMetas: AccountMeta[] = [];
    let lookupTableAddress: PublicKey;
    let addressLookupTableAccountInfos: any;
    let tokenAuthorityAta: any;
    let tokenAuthorityAta2: any;
    let tokenAuthorityAta0: any;
    let quote: any;

    it("Can derive swap instruction!", async () => {
      let rawQuote = fs.readFileSync("token-swap/tests/fixtures/jupiter_quote.json", "utf8");
      quote = JSON.parse(rawQuote);
      jupiterIx = await getSwapIx(tokenAuthority, quote);
      const {
        computeBudgetInstructions, // The necessary instructions to setup the compute budget.
        swapInstruction,
        addressLookupTableAddresses, // The lookup table addresses that you can use if you are using versioned transaction.
      } = jupiterIx;

      const jupiterSwapIx = getJupiterSwapIx(swapInstruction);

      let rawAccountMetas = fs.readFileSync("token-swap/tests/fixtures/account_metas.json", "utf8");
      let jsonAccountMetas = JSON.parse(rawAccountMetas);
      for (const account_meta of jsonAccountMetas) {
        account_meta.pubkey = new PublicKey(account_meta.pubkey);
      };

      tokenAuthorityAta0 = await getOrCreateAssociatedTokenAccount(
        connection,
        USER_KEYPAIR,
        WRAPPED_SOL_TOKEN_MINT,
        tokenAuthority,
        true
      );

      tokenAuthorityAta = await getOrCreateAssociatedTokenAccount(
        connection,
        USER_KEYPAIR,
        OUTPUT_MINT,
        tokenAuthority,
        true
      );
      /*
      tokenAuthorityAta2 = await getOrCreateAssociatedTokenAccount(
        connection,
        USER_KEYPAIR,
        INBETWEEN_MINT,
        tokenAuthority,
        true
      );*/
      //const accountMetas: AccountMeta[] = [];
      for (const account_meta of jsonAccountMetas) {
        const accountMetaPubkey = new PublicKey(account_meta.pubkey);
        if (accountMetaPubkey.equals(tokenAuthority)) {
           accountMetas.push({
            pubkey: new PublicKey(tokenAuthority),
            isSigner: false,
            isWritable: false,
          });
        } else {
          accountMetas.push(AccountMetaFromJSON(account_meta));
        }
      };
      let rawJupiterSwapIxData = fs.readFileSync("token-swap/tests/fixtures/jupiter_swap_ix_data.json", "utf8");
      let jupiterSwapIxData = JSON.parse(rawJupiterSwapIxData);
      // console.log({ jupiterSwapIxData });
      jupiterSwapIxForPDA = new TransactionInstruction({
        accountMetas,
        programId: new PublicKey(JUPITER_PROGRAM_ID),
        data: Buffer.from(jupiterSwapIxData)//jupiterSwapIx.data)
        });

      swapIx = await program.methods.swap(jupiterSwapIxForPDA.data).accounts({
      //swapIx = await program.methods.swap(jupiterSwapIx.data).accounts({
        state: stateAddress,
        tokenAccountAuthority: tokenAuthority,
        inputMint: WRAPPED_SOL_TOKEN_MINT,
        tokenAtaAddressIn: tokenAuthorityAta0.address,
        outputMint: OUTPUT_MINT,
        tokenAtaAddressOut: tokenAuthorityAta.address,
        jupiterProgram: JUPITER_PROGRAM_ID,
        pythPriceFeedAccount: SOL_USDC_PRICEFEED_ID,
      }).remainingAccounts([
        ...accountMetas
      ]).instruction()
        .catch((e) => {
          console.log(e.logs);
          throw e;
        });
    });


    it("Can swap!", async () => {
      const {
        computeBudgetInstructions, // The necessary instructions to setup the compute budget.
        swapInstruction,
        addressLookupTableAddressesJup, // The lookup table addresses that you can use if you are using versioned transaction.
      } = jupiterIx;

      let computeIx = computeBudgetInstructions.map(instructionDataToTransactionInstruction);
      const slot0 = await connection.getSlot();
      const sleep = async (ms = 0): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));
      await sleep(20000);

      const lookupTable =
        AddressLookupTableProgram.createLookupTable({
          authority: USER_KEYPAIR.publicKey,
          payer: USER_KEYPAIR.publicKey,
          recentSlot: slot0,
        });
      const lookupTableInst = lookupTable[0];
      lookupTableAddress = lookupTable[1];

      const blockhash = await connection.getLatestBlockhash();

      const messageV0 = new TransactionMessage({
        payerKey: USER_KEYPAIR.publicKey,
        recentBlockhash: blockhash.blockhash,
        instructions: [lookupTableInst],
      }).compileToV0Message();

      const txALT = new VersionedTransaction(messageV0);
      txALT.sign([USER_KEYPAIR]);
      const txALTID = await connection.sendTransaction(txALT, { maxRetries: 5 });
      const confirmation = await connection.confirmTransaction({
        signature: txALTID,
        blockhash: blockhash.blockhash,
        lastValidBlockHeight: blockhash.lastValidBlockHeight
      });

      // cannot add all addresses in one go due to limit in transaction size
      for (let i = 0; i < swapIx.keys.length / 6; i++) {

          const extendSwapInstruction = AddressLookupTableProgram.extendLookupTable({
            payer: USER_KEYPAIR.publicKey,
            authority: USER_KEYPAIR.publicKey,
            lookupTable: lookupTableAddress,
            addresses:  swapIx.keys.slice(i*6, (i+1)*6).map((key) => new PublicKey(key.pubkey)),
          });      
          const blockhash0 = await connection.getLatestBlockhash();

          const messageV0ExtendALT = new TransactionMessage({
            payerKey: USER_KEYPAIR.publicKey,
            recentBlockhash: blockhash0.blockhash,
            instructions: [extendSwapInstruction],
          }).compileToV0Message();
          const txExALT = new VersionedTransaction(messageV0ExtendALT);
          txExALT.sign([USER_KEYPAIR]);
          const txExALTID = await connection.sendTransaction(txExALT, { maxRetries: 5 });
          const confirmationEx = await connection.confirmTransaction({
            signature: txExALTID,
            blockhash: blockhash0.blockhash,
            lastValidBlockHeight: blockhash0.lastValidBlockHeight
          });
        };

      addressLookupTableAccountInfos = await connection.getMultipleAccountsInfo(
        [lookupTableAddress.toBase58()].map((key) => new PublicKey(key))
      );

      const lookupTableAccount = (
        await connection.getAddressLookupTable(lookupTableAddress)
      ).value;

      for (let i = 0; i < lookupTableAccount.state.addresses.length; i++) {
        const address = lookupTableAccount.state.addresses[i];
        const account_info = await connection.getAccountInfo(address);
      };

      // console.log(swapIx.keys.filter(k => k.isSigner));

      await sleep(20000); // wait for ALT to become active
      const blockhash1 = await connection.getLatestBlockhash();
      const ataAccountInfo0 = await getAccount(connection, tokenAuthorityAta.address);
      const ata0AccountInfo0 = await getAccount(connection, tokenAuthorityAta0.address);

      const swapTx = swapToBridgeInputTx(
        swapIx,
        blockhash1.blockhash,
        USER_KEYPAIR,
        computeBudgetInstructions,
        [lookupTableAddress.toBase58()],
        addressLookupTableAccountInfos
      );

      const txID = await provider.sendAndConfirm(swapTx, [USER_KEYPAIR]); //, stateKeypair]);
      const ataAccountInfo = await getAccount(connection, tokenAuthorityAta.address);
      const ata0AccountInfo = await getAccount(connection, tokenAuthorityAta0.address);
      expect(Number(ata0AccountInfo0.amount) - Number(ata0AccountInfo.amount)).to.equal(Number(quote["inAmount"]));
      expect(Number(ataAccountInfo.amount) - Number(ataAccountInfo0.amount)).to.greaterThanOrEqual(Number(quote["otherAmountThreshold"]));
      
    });


    it("Fail when exhange rate deviate from price feed.", async () => {
      const tx = await program.methods.update(
        WRAPPED_SOL_TOKEN_MINT,
        OUTPUT_MINT,
        new BN(1),
        ETH_USDC_PRICEFEED_ID,
        new BN(31536000),
      ).accounts({ state: stateAddress })
        .signers([USER_KEYPAIR])
        .rpc()
        .catch((e) => {
          console.log(e.logs);
          throw e;
        });
      console.log("Your transaction signature", tx);

      swapIx = await program.methods.swap(jupiterSwapIxForPDA.data).accounts({
          state: stateAddress,
          tokenAccountAuthority: tokenAuthority,
          inputMint: WRAPPED_SOL_TOKEN_MINT,
          tokenAtaAddressIn: tokenAuthorityAta0.address,
          outputMint: OUTPUT_MINT,
          tokenAtaAddressOut: tokenAuthorityAta.address,
          jupiterProgram: JUPITER_PROGRAM_ID,
          pythPriceFeedAccount: ETH_USDC_PRICEFEED_ID,
        }).remainingAccounts([
          ...accountMetas
        ]).instruction()
          .catch((e) => {
            console.log(e.logs);
            throw e;
          });
      const blockhash = await connection.getLatestBlockhash();
      const {
        computeBudgetInstructions, // The necessary instructions to setup the compute budget.
        swapInstruction,
        addressLookupTableAddressesJup, // The lookup table addresses that you can use if you are using versioned transaction.
      } = jupiterIx;
      const ataAccountInfo = await getAccount(connection, tokenAuthorityAta.address);
      const ata0AccountInfo = await getAccount(connection, tokenAuthorityAta0.address);
      console.log(ataAccountInfo.amount);
      console.log(ata0AccountInfo.amount);
      const swapTx = swapToBridgeInputTx(
            swapIx,
            blockhash.blockhash,
            USER_KEYPAIR,
            computeBudgetInstructions,
            [lookupTableAddress.toBase58()],
            addressLookupTableAccountInfos
          );
      
  
      try {    
            const txID = await provider.sendAndConfirm(swapTx, [USER_KEYPAIR]); //, stateKeypair]);
      } catch (e) {
            const anchorErrLog = e.logs.filter((elog) => elog.includes("AnchorError"));
            expect(anchorErrLog).to.have.lengthOf(1);
            chai.assert.include(anchorErrLog[0], "UndesirableSwapRate");
            /*
            const err: anchor.AnchorError = e;
            chai.assert.isTrue(err instanceof anchor.AnchorError);
            console.log({err});
            console.log(err.e);
            console.log((e as anchor.AnchorError).error);
            return (e as anchor.AnchorError).error.errorCode.code == "UndesirableSwapRate"*/
      }
      // const shouldFail = provider.sendAndConfirm(swapTx, [USER_KEYPAIR]);
    });
  });
});