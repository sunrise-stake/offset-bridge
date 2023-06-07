import {AnchorWallet} from "@solana/wallet-adapter-react";
import {
    AccountMeta,
    Connection,
    MessageV0,
    PublicKey, Transaction,
    TransactionInstruction, TransactionMessage,
    VersionedTransaction
} from "@solana/web3.js";
import {
    BRIDGE_INPUT_MINT_ADDRESS,
    ENV,
    JupiterToken,
    PROGRAM_ID,
    STATE_ADDRESS,
} from "@/lib/constants";
import fetch from "node-fetch";
import {Jupiter, JUPITER_PROGRAM_ID, TOKEN_LIST_URL} from "@jup-ag/core";
import {IDL, TokenSwap} from "./types/token_swap";
import JSBI from "jsbi";
import {AnchorProvider, Program, Wallet} from "@coral-xyz/anchor";
import {ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID} from "spl-token-latest";
import {tokenAuthority} from "@/lib/util";

export class SolanaRetirement {
    ready: boolean = false;
    tokens: JupiterToken[] = [];
    jupiter: Jupiter | undefined;

    constructor(readonly wallet: AnchorWallet, readonly connection: Connection) {
    }

    async init(): Promise<void> {
        this.tokens = await (await fetch(TOKEN_LIST_URL[ENV])).json() as JupiterToken[];
        this.jupiter = await Jupiter.load({
            connection: this.connection,
            cluster: ENV,
            user: tokenAuthority, // PDA owned by the swap program
            wrapUnwrapSOL: false // wrapping and unwrapping will try to sign with the inputAcount which is a PDA
        });

        this.ready = true;
    }

    async swap(inputMint: PublicKey):Promise<VersionedTransaction> {
        if (!this.ready || !this.jupiter) throw new Error("Not initialized");

        const routes = await this.jupiter.computeRoutes({
            inputMint,
            outputMint: BRIDGE_INPUT_MINT_ADDRESS,
            amount: JSBI.BigInt(100000), // 100k lamports
            slippageBps: 10,  // 1 bps = 0.01%.
        });

        // Routes are sorted based on outputAmount, so ideally the first route is the best.
        const bestRoute = routes.routesInfos[0]
        routes.routesInfos.forEach((r, i) => {
            console.log(i + ": Route length: " + r.marketInfos.length);
        })
        const { execute, swapTransaction , addressLookupTableAccounts } = await this.jupiter.exchange({
            routeInfo: bestRoute
        });

        const jupiterTx = swapTransaction as VersionedTransaction;

        // create the swap instruction proxying the jupiter instruction
        const provider = new AnchorProvider(this.connection, this.wallet, {});
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
                    pubkey: this.wallet.publicKey,
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

        // generate a versioned transaction from the new instructions, using the same ALTs as before)
        const blockhash = await this.connection
            .getLatestBlockhash()
            .then((res) => res.blockhash);
        const messageV0 = new TransactionMessage({
            payerKey: this.wallet.publicKey,
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

    static async build(wallet: AnchorWallet, connection: Connection): Promise<SolanaRetirement> {
        const instance = new SolanaRetirement(wallet, connection);
        await instance.init();
        return instance;
    }
}