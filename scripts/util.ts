import fetch from 'node-fetch';
// A helper function to help us find which output pair is possible
import { BRIDGE_INPUT_MINT_ADDRESS, PROGRAM_ID, SOL_TOKEN_BRIDGE_ADDRESS, STATE_ADDRESS, TEST_STATE_KEYPAIR, JupiterToken } from "./constants";
import { getAssociatedTokenAddressSync } from "spl-token-latest";
import {
    AddressLookupTableAccount,
    PublicKey,
    Keypair,
    TransactionMessage,
    TransactionInstruction,
    Transaction,
    VersionedTransaction,
    Blockhash,
} from '@solana/web3.js';

const getPossiblePairsTokenInfo = ({
    tokens,
    routeMap,
    inputToken,
}: {
    tokens: JupiterToken[];
    routeMap: Map<string, string[]>;
    inputToken?: JupiterToken;
}) => {
    const possiblePairs = routeMap.get(inputToken.address)
    const possiblePairsTokenInfo: { [key: string]: JupiterToken | undefined } = {};
    possiblePairs.forEach((address) => {
        possiblePairsTokenInfo[address] = tokens.find((t) => {
            return t.address == address;
        });
    });

    return possiblePairsTokenInfo;
};

export const tokenAuthority = PublicKey.findProgramAddressSync([Buffer.from("input_account"), STATE_ADDRESS.toBuffer()], PROGRAM_ID)[0];
export const TEST_STATE_ADDRESS = TEST_STATE_KEYPAIR.publicKey;
export const testTokenAuthority = PublicKey.findProgramAddressSync([Buffer.from("input_account"), TEST_STATE_ADDRESS.toBuffer()], PROGRAM_ID)[0];
export const bridgeAuthority = PublicKey.findProgramAddressSync([Buffer.from("authority_signer")], new PublicKey(SOL_TOKEN_BRIDGE_ADDRESS))[0];
export const bridgeInputTokenAccount = getAssociatedTokenAddressSync(new PublicKey(BRIDGE_INPUT_MINT_ADDRESS), tokenAuthority, true);

const API_ENDPOINT = "https://quote-api.jup.ag/v6";
const JUPITER_PROGRAM_ID = "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4";
const SOL_USDC_PRICEFEED_ID = new PublicKey("H6ARHf6YXhGYeQfUzQNGk6rDNnLBQKrenN712K4AQJEG");

export const getQuote = async (
    fromMint: PublicKey,
    toMint: PublicKey,
    amount: number,
    maxAccounts: number,
) => {
    return fetch(
        `${API_ENDPOINT}/quote?outputMint=${toMint.toBase58()}&inputMint=${fromMint.toBase58()}&amount=${amount}&maxAccounts=${maxAccounts}&slippage=0.01&onlyDirectRoutes=false`
    ).then((response) => response.json());
};


export const getSwapIx = async (
    user: PublicKey,
    // outputAccount: PublicKey,
    quote: any
) => {
    const data = {
        quoteResponse: quote,
        userPublicKey: user.toBase58(),
        // destinationTokenAccount: outputAccount.toBase58(),
    };
    return fetch(`${API_ENDPOINT}/swap-instructions`, {
        method: "POST",
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    }).then((response) => response.json());
};

export const getJupiterSwapIx = (
    instruction: any
) => {
    if (instruction === null) {
        return null;
    }

    return new TransactionInstruction({
        programId: new PublicKey(instruction.programId),
        keys: instruction.accounts.map((key) => ({
            pubkey: new PublicKey(key.pubkey),
            isSigner: key.isSigner,
            isWritable: key.isWritable,
        })),
        data: Buffer.from(instruction.data, "base64"),
    });
};

export const getAdressLookupTableAccounts = (
    keys: string[],
    addressLookupTableAccountInfos: any,
): AddressLookupTableAccount[] => {

    return addressLookupTableAccountInfos.reduce((acc, accountInfo, index) => {
        const addressLookupTableAddress = keys[index];
        if (accountInfo) {
            const addressLookupTableAccount = new AddressLookupTableAccount({
                key: new PublicKey(addressLookupTableAddress),
                state: AddressLookupTableAccount.deserialize(accountInfo.data),
            });
            acc.push(addressLookupTableAccount);
        }

        return acc;
    }, new Array<AddressLookupTableAccount>());
};

export const instructionDataToTransactionInstruction = (
    instructionPayload: any
) => {
    if (instructionPayload === null) {
        return null;
    }

    return new TransactionInstruction({
        programId: new PublicKey(instructionPayload.programId),
        keys: instructionPayload.accounts.map((key) => ({
            pubkey: new PublicKey(key.pubkey),
            isSigner: key.isSigner,
            isWritable: key.isWritable,
        })),
        data: Buffer.from(instructionPayload.data, "base64"),
    });
};

export const swapToBridgeInputTx = (
    swapIx: TransactionInstruction,
    recentBlockhash: Blockhash,
    payer: Keypair,
    computeBudgetPayloads: any[],
    addressLookupTableAddresses: string[],
    addressLookupTableAccountInfos: any
) => {

    // If you want, you can add more lookup table accounts here
    const addressLookupTableAccounts = getAdressLookupTableAccounts(
        addressLookupTableAddresses, addressLookupTableAccountInfos
    );

    const instructions = [
        ...computeBudgetPayloads.map(instructionDataToTransactionInstruction),
        swapIx,
    ];

    const messageV0 = new TransactionMessage({
        payerKey: new PublicKey(payer.publicKey),
        recentBlockhash: recentBlockhash,
        instructions,
    }).compileToV0Message(addressLookupTableAccounts);

    const transaction = new VersionedTransaction(messageV0);

    return transaction
};