import {AnchorWallet} from "@solana/wallet-adapter-react";
import {
    AccountInfo,
    AccountMeta,
    Connection,
    Keypair,
    PublicKey, SimulateTransactionConfig, SystemProgram,
    Transaction,
    TransactionInstruction,
    VersionedTransaction
} from "@solana/web3.js";
import {
    BRIDGE_INPUT_MINT_ADDRESS,
    CHAIN_ID_POLYGON,
    CHAIN_ID_SOLANA,
    JupiterToken,
    SOL_BRIDGE_ADDRESS,
    SOL_NFT_BRIDGE_ADDRESS,
    SOL_TOKEN_BRIDGE_ADDRESS,
    WORMHOLE_RPC_HOSTS_MAINNET,
    WRAPPED_SOL_TOKEN_MINT,
} from "@/lib/constants";
import {TokenSwap} from "./types/token_swap";
import IDL from "./idls/token_swap.json";
import {AnchorProvider, Program} from "@coral-xyz/anchor";
import {
    createAssociatedTokenAccountInstruction, createSyncNativeInstruction,
    createTransferInstruction,
    getAssociatedTokenAddress,
    getAssociatedTokenAddressSync,
} from "spl-token-latest";
import {bridgeAuthority, deriveBridgeInputTokenAccount, deriveTokenAuthority, getQuote, getSwapIx, getJupiterSwapIx, swapToBridgeInputTx, deriveStateAddress} from "@/lib/util";
import * as Wormhole from "@certusone/wormhole-sdk";
import {nft_bridge, postVaaSolanaWithRetry} from "@certusone/wormhole-sdk";
import BN from "bn.js";
import {createWormholeWrappedTransfer} from "@/lib/bridge";
import {SolanaStateAccount, VAAResult} from "@/lib/types";

type UnsubscribeCallback = () => void;

export class SolanaRetirement {
    ready: boolean = false;
    tokens: JupiterToken[] = [];
    program: Program<TokenSwap>;
    state: SolanaStateAccount | null = null;

    constructor(
        readonly solWallet: AnchorWallet,
        readonly solConnection: Connection,
        readonly stateAddress: PublicKey,
        public holdingContractTarget: string,
    ) {
        const provider = new AnchorProvider(this.solConnection, this.solWallet, {});
        this.program = new Program<TokenSwap>(IDL as TokenSwap, provider);
    }

    get tokenAuthority(): PublicKey {
        return deriveTokenAuthority(this.stateAddress)
    }

    get bridgeInputTokenAccount(): PublicKey {
        return deriveBridgeInputTokenAccount(this.stateAddress)
    }

    get hasState(): boolean {
        return this.state !== null;
    }

    async createState(holdingContract: string): Promise<Transaction> {
        if (!this.ready) throw new Error("API not initialized");
        if (this.hasState) throw new Error("State already created");

        const outputMint = new PublicKey(BRIDGE_INPUT_MINT_ADDRESS);

        return this.program.methods.initialize({
                outputMint,
                holdingContract,
                tokenChainId: "" + CHAIN_ID_POLYGON,
                updateAuthority: this.solWallet.publicKey,
            }, 0 // default seed index. Set a higher value to create subsequent state accounts for the same user
        ).accounts({
            authority: this.solWallet.publicKey,
        }).transaction()
    }

    async getState(): Promise<SolanaStateAccount | null> {
        const state = await this.program.account.state.fetchNullable(new PublicKey(this.stateAddress));
        console.log("State:", state);
        return state;
    }

    async updateState(): Promise<void> {
        this.state = await this.getState();
    }

    listenToTokenBalance(mint: PublicKey, owner: PublicKey, callback: (amount: bigint) => void): UnsubscribeCallback {
        const tokenAccount = getAssociatedTokenAddressSync(mint, owner, true);

        const notify = () => {
            console.log("Getting balance for token account", tokenAccount.toBase58(), ", mint ", mint.toBase58(), " and owner ", owner.toBase58());
            this.solConnection.getTokenAccountBalance(tokenAccount).then((balance) => {
                callback(BigInt(balance.value.amount));
            }).catch((error) => {
                console.error(error);
                if (error.message.endsWith("Invalid param: could not find account")) {
                    callback(0n);
                }
            });
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
        await this.updateState();
        this.ready = true;
    }

    async makeDepositAndWrapSolIxes(lamports: bigint): Promise<TransactionInstruction[]> {
        if (!this.ready) throw new Error("Not initialized");

        const wrappedSolATA = getAssociatedTokenAddressSync(
            new PublicKey(WRAPPED_SOL_TOKEN_MINT),
            this.tokenAuthority,
            true
        );
        const ataAccountInfo = await this.solConnection.getAccountInfo(wrappedSolATA)
        if (ataAccountInfo == null) {
            const ataCreateTx = createAssociatedTokenAccountInstruction(
                this.solWallet.publicKey,
                wrappedSolATA,
                this.tokenAuthority,
                new PublicKey(WRAPPED_SOL_TOKEN_MINT)
            )
            return [
                ataCreateTx, 
                SystemProgram.transfer({
                    fromPubkey: this.solWallet.publicKey, lamports, toPubkey: wrappedSolATA
                }),
                createSyncNativeInstruction(wrappedSolATA)
            ];
        } else {
            return [
                SystemProgram.transfer({
                    fromPubkey: this.solWallet.publicKey, lamports, toPubkey: wrappedSolATA
                }),
                createSyncNativeInstruction(wrappedSolATA)
            ];
        }


    }

    async makeWrapSolIx(): Promise<TransactionInstruction[]> {
        if (!this.ready) throw new Error("Not initialized");

        const wrappedSolATA = getAssociatedTokenAddressSync(new PublicKey(WRAPPED_SOL_TOKEN_MINT), this.tokenAuthority, true);
        const ataAccountInfo = await this.solConnection.getAccountInfo(wrappedSolATA)
        if (ataAccountInfo == null) {
            const ataCreateTx = createAssociatedTokenAccountInstruction(
                this.solWallet.publicKey,
                wrappedSolATA,
                this.tokenAuthority,
                new PublicKey(WRAPPED_SOL_TOKEN_MINT)
            )
            return [
                ataCreateTx,
                createSyncNativeInstruction(wrappedSolATA)
            ];
        } else {
            return [
                createSyncNativeInstruction(wrappedSolATA)
            ];
        }
    }

    async swap(inputMint: PublicKey, amount: bigint, preInstructions?: TransactionInstruction[]):Promise<VersionedTransaction> {

        const quote = await getQuote(inputMint, BRIDGE_INPUT_MINT_ADDRESS, Number(amount), 20);

        console.log("Routes: " + JSON.stringify(quote.route));

        const jupiterIx = await getSwapIx(this.tokenAuthority,  quote);
        const {
            computeBudgetInstructions, // The necessary instructions to setup the compute budget.
            swapInstruction,
            addressLookupTableAddresses, // The lookup table addresses that you can use if you are using versioned transaction.
          } = jupiterIx;
        const jupiterSwapIx = getJupiterSwapIx(swapInstruction);

        // create the swap instruction proxying the jupiter instruction
        const accountMetas = jupiterSwapIx.keys;

        console.log({ accountMetas });

        // mark the token authority as a non-signer, because it is a PDA owned by the Offset Bridge program
        accountMetas.filter((meta) => meta.pubkey.equals(this.tokenAuthority)).forEach(
            (meta) => {
                meta.isSigner = false;
            }
        );

        // create the swap instruction
        const swapIx = await this.program.methods.swap(jupiterSwapIx.data).accounts({
            state: this.stateAddress,
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
            this.tokenAuthority,
            true
        );
        console.log(`ata: ${ata.toBase58()}`);

        const ataAccountInfo = await this.solConnection.getAccountInfo(ata)
        let preIxs: TransactionInstruction[] = [];
        preIxs.push(...preInstructions ?? []);
        if (ataAccountInfo == null) {    
            let ataCreationTx = new Transaction();
            ataCreationTx.add(
                createAssociatedTokenAccountInstruction(
                this.solWallet.publicKey,
                ata,
                this.tokenAuthority,
                BRIDGE_INPUT_MINT_ADDRESS
                )
            );
            preIxs.push(...ataCreationTx.instructions);
        }

        const swapTx = swapToBridgeInputTx(
          swapIx,
          preIxs,
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
        const to = getAssociatedTokenAddressSync(inputMint, this.tokenAuthority, true);

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
        const preInstructions = amountToDeposit > 0n ? await this.makeDepositAndWrapSolIxes(amountToDeposit) : await this.makeWrapSolIx();
        console.log("Swapping: ", amountToDeposit + amountToWrap, " lamports");
        return this.swap(WRAPPED_SOL_TOKEN_MINT, amountToDeposit + amountToWrap, preInstructions);
    }

    async bridge(amount: bigint): Promise<{ tx: Transaction, messageKey: Keypair }> {
        // Holding contract target (address on polygon that receives wrapped USDC) passed in to the program bridge function as instructions
        const { instruction, messageKey } = await createWormholeWrappedTransfer(
            this.solWallet.publicKey,
            this.bridgeInputTokenAccount,
            this.tokenAuthority,
            amount,
            Wormhole.tryNativeToUint8Array(this.holdingContractTarget, CHAIN_ID_POLYGON),
        );

        const tx = await this.program.methods.bridge(new BN(amount.toString()), instruction.data).accounts({
            state: this.stateAddress,
            bridgeAuthority,
            tokenAccount: this.bridgeInputTokenAccount,
        }).remainingAccounts(instruction.keys)
            .signers([messageKey]) // appears to get erased when calling transaction()
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
        stateAddress: PublicKey,
        holdingContractTarget: string,
    ): Promise<SolanaRetirement> {
        const instance = new SolanaRetirement(solWallet, solConnection, stateAddress, holdingContractTarget);
        await instance.init();
        return instance;
    }
}