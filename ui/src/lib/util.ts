import {
    AccountMeta,
    AddressLookupTableAccount,
    Blockhash,
    PublicKey,
    PublicKeyInitData,
    TransactionInstruction,
    TransactionMessage,
    VersionedTransaction
} from "@solana/web3.js";
import {
    BRIDGE_INPUT_MINT_ADDRESS,
    CHAIN_ID_POLYGON,
    MAX_NUM_PRECISION,
    PROGRAM_ID,
    RETIREMENT_ERC721,
    SOL_NFT_BRIDGE_ADDRESS,
    SOL_TOKEN_BRIDGE_ADDRESS,
} from "./constants";
import {getAssociatedTokenAddressSync} from "spl-token-latest";
import * as Wormhole from "@certusone/wormhole-sdk";
import {nft_bridge} from "@certusone/wormhole-sdk";
import {RetirementNFT} from "@/app/providers";

// To allow a wallet to have multiple states, add an index to the seed.
// The default seed index is 0
const SEED_INDEX = Buffer.from([0]);

export const deriveStateAddress = (owner: PublicKey) => PublicKey.findProgramAddressSync([Buffer.from("state_address"), owner.toBuffer(), SEED_INDEX], PROGRAM_ID)[0];
export const deriveTokenAuthority = (stateAddress: PublicKey) => PublicKey.findProgramAddressSync([Buffer.from("token_authority"), stateAddress.toBuffer()], PROGRAM_ID)[0];
export const bridgeAuthority = PublicKey.findProgramAddressSync([Buffer.from("authority_signer")], new PublicKey(SOL_TOKEN_BRIDGE_ADDRESS))[0];
export const deriveBridgeInputTokenAccount = (stateAddress: PublicKey) =>
    getAssociatedTokenAddressSync(new PublicKey(BRIDGE_INPUT_MINT_ADDRESS), deriveTokenAuthority(stateAddress), true);

export const formatDecimal = (value: bigint, decimals: number, requiredDecimals: number = 2): string => {
    const valueStringWithLeadingZeros = value.toString().padStart(decimals + 1, "0");
    const beforeDecimal = valueStringWithLeadingZeros.slice(0, -decimals);
    const afterDecimal = valueStringWithLeadingZeros.slice(-decimals);
    const afterDecimalTrimmed = afterDecimal.replace(/0+$/, "");
    if (afterDecimalTrimmed.length === 0) return beforeDecimal;
    return `${beforeDecimal}.${afterDecimalTrimmed.slice(0, requiredDecimals)}`;
}

export const toFixedWithPrecision = (
    n: number,
    precision = MAX_NUM_PRECISION
): string => String(Number(n.toFixed(precision)));

export const tokenAmountFromString = (valueString: string, decimals: number): bigint => {
    if (!valueString.match(/^\d+(\.\d+)?$/)) throw new Error("Invalid number");

    const [beforeDecimal, afterDecimal] = valueString.split(".");
    const afterDecimalPadded = (afterDecimal || "").padEnd(decimals, "0");

    return BigInt(beforeDecimal + afterDecimalPadded);
}

export const usdcTokenAmountFromCents = (cents: number): bigint => {
    return BigInt(Math.round(cents)) * BigInt(10 ** 4);
}

export const trimAddress = (address: string): string => address.slice(0, 4) + '...' + address.slice(-4);

export const solanaAddressToHex = (address: PublicKey) => `0x${address.toBuffer().toString("hex")}` as const;

export const deriveSolanaNFTTokenAccountAddress = async (tokenId: number, recipient: PublicKey): Promise<string> => {
    const originAsset = Wormhole.tryNativeToUint8Array(RETIREMENT_ERC721, CHAIN_ID_POLYGON);
    const solanaAsset = (await nft_bridge.getForeignAssetSolana(
        SOL_NFT_BRIDGE_ADDRESS,
        CHAIN_ID_POLYGON,
        originAsset,
        BigInt(tokenId)
    )) || "";
    const solanaMintKey = new PublicKey(solanaAsset); // NFT token

    return getAssociatedTokenAddressSync(
        solanaMintKey,
        recipient,
        true
    ).toBase58();
}

export const tokenIDsToRetirementNFTs = (recipient: PublicKey) => (tokenIDs: number[]): Promise<RetirementNFT[]> =>
    Promise.all(tokenIDs.map(async (tokenId) => {
        const solanaTokenAddress = await deriveSolanaNFTTokenAccountAddress(tokenId, recipient);
        return {tokenId, solanaTokenAddress};
    }))

const API_ENDPOINT = "https://quote-api.jup.ag/v6";

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
    quote: any
) => {
    const data = {
        quoteResponse: quote,
        userPublicKey: user.toBase58(),
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
    /* if (instruction === null) {
        return null;
    } */

    return new TransactionInstruction({
        programId: new PublicKey(instruction.programId),
        keys: instruction.accounts.map((key: AccountMeta) => ({
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

    return addressLookupTableAccountInfos.reduce((acc: AddressLookupTableAccount[], accountInfo: { data: Uint8Array; }, index: number) => {
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
    instructionPayload: { programId: PublicKeyInitData; accounts: AccountMeta[]; data: WithImplicitCoercion<string> | { [Symbol.toPrimitive](hint: "string"): string; }; }
) => {
    /* if (instructionPayload === null) {
        return null;
    }*/

    return new TransactionInstruction({
        programId: new PublicKey(instructionPayload.programId),
        keys: instructionPayload.accounts.map((key: AccountMeta) => ({
            pubkey: new PublicKey(key.pubkey),
            isSigner: key.isSigner,
            isWritable: key.isWritable,
        })),
        data: Buffer.from(instructionPayload.data, "base64"),
    });
};

export const swapToBridgeInputTx = (
    swapIx: TransactionInstruction,
    preIxs: TransactionInstruction[],
    recentBlockhash: Blockhash,
    payerKey: PublicKey,
    computeBudgetPayloads: { programId: PublicKeyInitData; accounts: AccountMeta[]; data: WithImplicitCoercion<string> | { [Symbol.toPrimitive](hint: "string"): string; }; }[],
    addressLookupTableAddresses: string[],
    addressLookupTableAccountInfos: any
) => {

    // If you want, you can add more lookup table accounts here
    const addressLookupTableAccounts = getAdressLookupTableAccounts(
        addressLookupTableAddresses, addressLookupTableAccountInfos
    );

    const instructions = [];
    instructions.push(...computeBudgetPayloads.map(instructionDataToTransactionInstruction));
    preIxs.forEach((ix) => {
        instructions.push(ix);
    })
    instructions.push(swapIx);

    const messageV0 = new TransactionMessage({
        payerKey: payerKey,
        recentBlockhash: recentBlockhash,
        instructions,
    }).compileToV0Message(addressLookupTableAccounts);

    return new VersionedTransaction(messageV0)
};
