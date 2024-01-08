import {AnchorWallet} from "@solana/wallet-adapter-react";
import {
    AccountInfo,
    AccountMeta,
    Connection,
    Keypair,
    MessageV0,
    PublicKey, SystemProgram,
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
    ASSOCIATED_TOKEN_PROGRAM_ID, createSyncNativeInstruction,
    createTransferInstruction,
    getAssociatedTokenAddressSync,
    TOKEN_PROGRAM_ID
} from "spl-token-latest";
import {bridgeAuthority, bridgeInputTokenAccount, tokenAuthority} from "@/lib/util";
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
        this.jupiter = await Jupiter.load({
            connection: this.solConnection,
            cluster: ENV,
            user: tokenAuthority, // PDA owned by the swap program
            wrapUnwrapSOL: false // wrapping and unwrapping will try to sign with the inputAcount which is a PDA
        });

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
        if (!this.ready || !this.jupiter) throw new Error("Not initialized");

        const routes = await this.jupiter.computeRoutes({
            inputMint,
            outputMint: BRIDGE_INPUT_MINT_ADDRESS,
            amount: JSBI.BigInt(amount.toString(10)), // 100k lamports
            slippageBps: 20,  // 1 bps = 0.01%.
        });

        console.log("Routes: " + JSON.stringify(routes));

        // Since CPIs do not support ALTs, we can only use routes with two hops or fewer before we run out of space
        // in the transaction
        const filteredRoutes = routes.routesInfos.filter((r, i) => {
            console.log(i + ": Route length: " + r.marketInfos.length);
            return r.marketInfos.length < 3;
        })
        // Routes are sorted based on outputAmount, so ideally the first route is the best.
        const bestRoute = filteredRoutes[0]
        console.log("Best route: " + JSON.stringify(bestRoute, null, 2));
        if (!bestRoute) throw new Error("No route found");
        const { execute, swapTransaction , addressLookupTableAccounts } = await this.jupiter.exchange({
            routeInfo: bestRoute
        });

        const jupiterTx = swapTransaction as VersionedTransaction;

        // create the swap instruction proxying the jupiter instruction
        const provider = new AnchorProvider(this.solConnection, this.solWallet, {});
        const program = new Program<TokenSwap>(IDL, PROGRAM_ID, provider);

        const message = jupiterTx.message as MessageV0;
        message.compiledInstructions.forEach((ix) => {
            console.log(message.staticAccountKeys[ix.programIdIndex].toString());
        });

        const jupiterIxIndex = message.compiledInstructions.findIndex(
            (ix) => message.staticAccountKeys[ix.programIdIndex].equals(JUPITER_PROGRAM_ID)
        );
        const jupiterIx = message.compiledInstructions[jupiterIxIndex];
        const messageAccountKeys = message.getAccountKeys({ addressLookupTableAccounts });

        // construct the swap account metas from the jupiter instruction
        const accountMetas = jupiterIx.accountKeyIndexes.map(jupiterIxAccountIndex => {
            const pubkey = messageAccountKeys.get(jupiterIxAccountIndex);
            if (!pubkey) throw new Error("Missing pubkey at index: " + jupiterIxAccountIndex + " in jupiter instruction");
            return ({
                pubkey,
                isSigner: false,// message.isAccountSigner(i), - this tx is permissionless through the proxy
                isWritable: message.isAccountWritable(jupiterIxAccountIndex)
            });
        });
        // the data for the jupiter instruction is passed straight through to the swap proxy
        const routeInfo = Buffer.from(jupiterIx.data);

        // create the swap instruction
        const swapIx = await program.methods.swap(routeInfo).accounts({
            state: STATE_ADDRESS,
            jupiterProgram: JUPITER_PROGRAM_ID,
        }).remainingAccounts([
            ...accountMetas
        ]).instruction()

        let seenJupiterIx = false;

        // get the rest of the instructions from the original transaction, (token account creation & closure etc)
        // preserving the order.
        const ixes: TransactionInstruction[] = message.compiledInstructions.map((ix, ixIndex) => {
            if (ix === jupiterIx) {
                seenJupiterIx = true;
                // replace with the swap program instruction
                return swapIx;
            }

            // otherwise just copy over the instruction.
            // the account indices have changed so recreate the account metas
            const keys: AccountMeta[] = ix.accountKeyIndexes.map(index => {
                const pubkey = messageAccountKeys.get(index);
                if (!pubkey) throw new Error("Missing pubkey at index: " + index + " in instruction " + ixIndex);
                return ({
                    pubkey,
                    isSigner: message.isAccountSigner(index),
                    isWritable: message.isAccountWritable(index)
                });
            });

            const programId = messageAccountKeys.get(ix.programIdIndex);

            if (!programId) throw new Error("Missing programId at index: " + ix.programIdIndex + " in instruction " + ixIndex);

            if (programId.equals(ASSOCIATED_TOKEN_PROGRAM_ID)) {
                // it is a "create associated token account" instruction,
                // we change the rent payer of these instructions to the user keypair
                // and make the owner not a signer

                keys[0] = {
                    pubkey: this.solWallet.publicKey,
                    isSigner: true,
                    isWritable: true
                }
                keys[2] = {
                    pubkey: keys[2].pubkey,
                    isSigner: false,
                    isWritable: false
                }
            } else if (programId.equals(TOKEN_PROGRAM_ID)) {
                // if we have seen the jupiter instruction, this is a close token account instruction
                // for now, drop it
                if (seenJupiterIx) {
                    return null;
                }
            }

            return new TransactionInstruction({
                keys,
                programId: programId,
                data: Buffer.from(ix.data)
            })
        }).filter((ix): ix is TransactionInstruction => ix !== null);

        if (preInstructions) {
            // add the deposit instruction to the start
            ixes.unshift(...preInstructions);
        }

        // generate a versioned transaction from the new instructions, using the same ALTs as before)
        const blockhash = await this.solConnection
            .getLatestBlockhash()
            .then((res) => res.blockhash);
        const messageV0 = new TransactionMessage({
            payerKey: this.solWallet.publicKey,
            recentBlockhash: blockhash,
            instructions: ixes,
        }).compileToV0Message(addressLookupTableAccounts);
        const transaction = new VersionedTransaction(messageV0);

        const newTxSigners = [];
        let keys = (transaction.message as MessageV0).getAccountKeys({ addressLookupTableAccounts });
        for (let i = 0; i < keys.length; i++) {
            if ((transaction.message as MessageV0).isAccountSigner(i)) {
                newTxSigners.push(keys.get(i));
            }
        }
        console.log("Signers: ", newTxSigners)

        return transaction;
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