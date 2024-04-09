import {AnchorWallet} from "@solana/wallet-adapter-react";
import {
    AccountInfo,
    AccountMeta,
    Connection,
    Keypair,
    MessageV0,
    PublicKey, SimulateTransactionConfig, SystemProgram,
    Transaction,
    TransactionInstruction,
    TransactionMessage,
    VersionedTransaction
} from "@solana/web3.js";
import {
    BRIDGE_INPUT_MINT_ADDRESS,
    CHAIN_ID_POLYGON,
    CHAIN_ID_SOLANA,
    ENV,
    JupiterToken,
    PROGRAM_ID,
    SOL_BRIDGE_ADDRESS,
    SOL_NFT_BRIDGE_ADDRESS,
    SOL_TOKEN_BRIDGE_ADDRESS,
    STATE_ADDRESS,
    WORMHOLE_RPC_HOSTS_MAINNET,
    WRAPPED_SOL_TOKEN_MINT,
} from "@/lib/constants";
import {Jupiter, JUPITER_PROGRAM_ID, TOKEN_LIST_URL} from "@jup-ag/core";
import {IDL, TokenSwap} from "./types/token_swap";
import JSBI from "jsbi";
import {AnchorProvider, Program} from "@coral-xyz/anchor";
import {
    ASSOCIATED_TOKEN_PROGRAM_ID, createAssociatedTokenAccountInstruction, createSyncNativeInstruction,
    createTransferInstruction,
    getAssociatedTokenAddress,
    getAssociatedTokenAddressSync,
    getOrCreateAssociatedTokenAccount,
    TOKEN_PROGRAM_ID
} from "spl-token-latest";
import {bridgeAuthority, bridgeInputTokenAccount, tokenAuthority, getQuote, getSwapIx, getJupiterSwapIx, swapToBridgeInputTx} from "@/lib/util";
import * as Wormhole from "@certusone/wormhole-sdk";
import {nft_bridge, postVaaSolanaWithRetry} from "@certusone/wormhole-sdk";
import BN from "bn.js";
import {createWormholeWrappedTransfer} from "@/lib/bridge";
import {VAAResult} from "@/lib/types";

type UnsubscribeCallback = () => void;

export class SolanaRetirement {
    ready: boolean = false;
    tokens: JupiterToken[] = [];
    jupiter: Jupiter | undefined;

    constructor(
        readonly solWallet: AnchorWallet,
        readonly solConnection: Connection,
        public holdingContractTarget: string,
    ) {
    }

    async simulate(tx: VersionedTransaction, config?: SimulateTransactionConfig): Promise<void> {
        await this.solConnection.simulateTransaction(tx, config).then(console.log).catch(console.error);
    }

    listenToTokenBalance(mint: PublicKey, owner: PublicKey, callback: (amount: bigint) => void): UnsubscribeCallback {
        const tokenAccount = getAssociatedTokenAddressSync(mint, owner, true);

        const notify = () => {
            this.solConnection.getTokenAccountBalance(tokenAccount).then((balance) => {
                callback(BigInt(balance.value.amount));
            }).catch(console.error);
        }

        notify();
        const subscriptionId = this.solConnection.onAccountChange(tokenAccount, notify);

        return () => {
            this.solConnection.removeAccountChangeListener(subscriptionId);
        }
    }

    listenToSolBalance(owner: PublicKey, callback: (amount: bigint) => void): UnsubscribeCallback {
        this.solConnection.getBalance(owner).then(balance => callback(BigInt(balance)));
        const notify = (accountInfo: AccountInfo<Buffer>) => {
            callback(BigInt(accountInfo.lamports));
        }
        const subscriptionId = this.solConnection.onAccountChange(owner, notify);

        return () => {
            this.solConnection.removeAccountChangeListener(subscriptionId);
        }
    }

    async init(): Promise<void> {
        this.tokens = await (await fetch(TOKEN_LIST_URL[ENV])).json() as JupiterToken[];

        this.ready = true;
    }

    makeDepositAndWrapSolIxes(lamports: bigint): TransactionInstruction[] {
        if (!this.ready) throw new Error("Not initialized");

        const wrappedSolATA = getAssociatedTokenAddressSync(new PublicKey(WRAPPED_SOL_TOKEN_MINT), tokenAuthority, true);

        return [
            SystemProgram.transfer({
                fromPubkey: this.solWallet.publicKey, lamports, toPubkey: wrappedSolATA
            }),
            createSyncNativeInstruction(wrappedSolATA)
        ];
    }

    makeWrapSolIx(): TransactionInstruction[] {
        if (!this.ready) throw new Error("Not initialized");

        const wrappedSolATA = getAssociatedTokenAddressSync(new PublicKey(WRAPPED_SOL_TOKEN_MINT), tokenAuthority, true);

        return [
            createSyncNativeInstruction(wrappedSolATA)
        ];
    }

    async swap(inputMint: PublicKey, amount: bigint, preInstructions?: TransactionInstruction[]):Promise<VersionedTransaction> {

        const quote = await getQuote(inputMint, BRIDGE_INPUT_MINT_ADDRESS, 100000, 20);

        console.log("Routes: " + JSON.stringify(quote.route));

        const jupiterIx = await getSwapIx(tokenAuthority,  quote); 
        const {
            computeBudgetInstructions, // The necessary instructions to setup the compute budget.
            swapInstruction,
            addressLookupTableAddresses, // The lookup table addresses that you can use if you are using versioned transaction.
          } = jupiterIx;
        const jupiterSwapIx = getJupiterSwapIx(swapInstruction);

        // create the swap instruction proxying the jupiter instruction
        const provider = new AnchorProvider(this.solConnection, this.solWallet, {});
        const program = new Program<TokenSwap>(IDL, PROGRAM_ID, provider);

        const accountMetas = jupiterSwapIx.keys;

        console.log({ accountMetas });

        // create the swap instruction
        const swapIx = await program.methods.swap(jupiterSwapIx.data).accounts({
            state: STATE_ADDRESS,
            jupiterProgram: JUPITER_PROGRAM_ID,
        }).remainingAccounts([
            ...accountMetas
        ]).instruction()

        // generate a versioned transaction from the new instructions, using the same ALTs as before)
        const blockhash = await this.solConnection
            .getLatestBlockhash()
            .then((res) => res.blockhash);

        const addressLookupTableAccountInfos = await this.solConnection.getMultipleAccountsInfo(
          addressLookupTableAddresses.map((key: AccountMeta) => new PublicKey(key))
        );

        let ata = await getAssociatedTokenAddress(
            BRIDGE_INPUT_MINT_ADDRESS,
            tokenAuthority,
            true
        );
        console.log(`ata: ${ata.toBase58()}`);
        
        let ataCreationTx = new Transaction();
        ataCreationTx.add(
            createAssociatedTokenAccountInstruction(
            this.solWallet.publicKey,
            ata,
            tokenAuthority,
            BRIDGE_INPUT_MINT_ADDRESS
            )
        );

        const swapTx = swapToBridgeInputTx(
          swapIx,
          ataCreationTx.instructions,
          blockhash,
          this.solWallet.publicKey,
          computeBudgetInstructions,
          addressLookupTableAddresses,
          addressLookupTableAccountInfos
        );
        return swapTx;
    }

    private makeDepositIx(inputMint: PublicKey, amount: bigint) : TransactionInstruction {
        const from = getAssociatedTokenAddressSync(inputMint, this.solWallet.publicKey);
        const to = getAssociatedTokenAddressSync(inputMint, tokenAuthority, true);

        return createTransferInstruction(
            from,
            to,
            this.solWallet.publicKey,
            amount
        );
    }

    async deposit(inputMint: PublicKey, amount: bigint) : Promise<Transaction> {
        return new Transaction().add(this.makeDepositIx(inputMint, amount));
    }

    async depositAndSwap(inputMint: PublicKey, amount: bigint) : Promise<VersionedTransaction> {
        console.log("Swapping: ", amount, "of", inputMint.toBase58());
        return this.swap(inputMint, amount, [this.makeDepositIx(inputMint, amount)]);
    }

    async wrapAndSwap(amountToDeposit: bigint, amountToWrap: bigint = 0n) : Promise<VersionedTransaction> {
        const preInstructions = amountToDeposit > 0n ? this.makeDepositAndWrapSolIxes(amountToDeposit) : this.makeWrapSolIx();
        console.log("Swapping: ", amountToDeposit + amountToWrap, " lamports");
        return this.swap(WRAPPED_SOL_TOKEN_MINT, amountToDeposit + amountToWrap, preInstructions);
    }

    async bridge(amount: bigint): Promise<{ tx: Transaction, messageKey: Keypair }> {
        const provider = new AnchorProvider(this.solConnection, this.solWallet, {});
        const program = new Program<TokenSwap>(IDL, PROGRAM_ID, provider);

        const { instruction, messageKey } = await createWormholeWrappedTransfer(
            this.solWallet.publicKey,
            bridgeInputTokenAccount,
            tokenAuthority,
            amount,
            Wormhole.tryNativeToUint8Array(this.holdingContractTarget, CHAIN_ID_POLYGON),
        );

        const tx = await program.methods.bridge(new BN(amount.toString()), instruction.data).accounts({
            state: STATE_ADDRESS,
            bridgeAuthority,
            tokenAccountAuthority: tokenAuthority,
            tokenAccount: bridgeInputTokenAccount,
            tokenProgram: TOKEN_PROGRAM_ID,
            wormholeProgram: SOL_TOKEN_BRIDGE_ADDRESS,
        }).remainingAccounts(instruction.keys)
            .signers([messageKey]) // appears to get erased when calling transaction()  - TODO remove?
            .transaction();

        return { tx, messageKey };
    }

    async getVAAFromSolanaTransactionSignature(txSignature: string): Promise<VAAResult> {
        const info = await this.solConnection.getTransaction(txSignature);
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
            // use on Node only
            // {
            //     transport: NodeHttpTransport(),
            // }
        );

        return {vaaBytes, sequence, emitterAddress, emitterChain: CHAIN_ID_SOLANA};
    }

    async redeemVAA(vaaBytes: Uint8Array): Promise<Transaction[]> {
        await postVaaSolanaWithRetry(
            this.solConnection,
            this.solWallet.signTransaction.bind(this.solWallet),
            SOL_BRIDGE_ADDRESS,
            this.solWallet.publicKey,
            Buffer.from(vaaBytes)
        );

        const redeemTx = await nft_bridge.redeemOnSolana(
            this.solConnection,
            SOL_BRIDGE_ADDRESS,
            SOL_NFT_BRIDGE_ADDRESS,
            this.solWallet.publicKey,
            Buffer.from(vaaBytes)
        )

        const meta = await nft_bridge.createMetaOnSolana(
            this.solConnection,
            SOL_BRIDGE_ADDRESS,
            SOL_NFT_BRIDGE_ADDRESS,
            this.solWallet.publicKey,
            Buffer.from(vaaBytes)
        );

        return [redeemTx, meta]
    }

    async getMintAddressFromTransaction(txSig: string): Promise<PublicKey> {
        const response = await this.solConnection.getTransaction(txSig);
        if (!response) {
            throw new Error(
                "An error occurred while fetching the transaction info"
            );
        }

        // the last instruction in the tx is wormhole bridge tx
        // the mint account is the one with index #1 in that instruction
        const mintToIx = response.transaction.message.instructions[response.transaction.message.instructions.length - 1];
        const mintAccountIndex = mintToIx.accounts[1];

        console.log("Mint account index:", mintAccountIndex);
        console.log("Total accounts for ix:", mintToIx.accounts.length);
        console.log("Ix program ID:", response.transaction.message.accountKeys[mintToIx.programIdIndex].toBase58());

        return response.transaction.message.accountKeys[mintAccountIndex];
    }

    static async build(
        solWallet: AnchorWallet,
        solConnection: Connection,
        holdingContractTarget: string,
    ): Promise<SolanaRetirement> {
        const instance = new SolanaRetirement(solWallet, solConnection, holdingContractTarget);
        await instance.init();
        return instance;
    }
}