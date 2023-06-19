import {PublicKey} from "@solana/web3.js";
import {
    BRIDGE_INPUT_MINT_ADDRESS, CHAIN_ID_POLYGON,
    MAX_NUM_PRECISION, POLYGON_NFT_BRIDGE_ADDRESS,
    PROGRAM_ID, RETIREMENT_ERC721,
    SOL_TOKEN_BRIDGE_ADDRESS,
    STATE_ADDRESS
} from "./constants";
import {getAssociatedTokenAddressSync} from "spl-token-latest";
import {getForeignAssetSolana} from "@certusone/wormhole-sdk/lib/cjs/nft_bridge";
import * as Wormhole from "@certusone/wormhole-sdk";
import {tryNativeToUint8Array} from "@certusone/wormhole-sdk/lib/cjs/utils/array";
import {RetirementNFT} from "@/app/providers";

export const tokenAuthority = PublicKey.findProgramAddressSync([Buffer.from("input_account"), STATE_ADDRESS.toBuffer()], PROGRAM_ID)[0];
export const bridgeAuthority = PublicKey.findProgramAddressSync([Buffer.from("authority_signer")], new PublicKey(SOL_TOKEN_BRIDGE_ADDRESS))[0];
export const bridgeInputTokenAccount = getAssociatedTokenAddressSync(new PublicKey(BRIDGE_INPUT_MINT_ADDRESS), tokenAuthority, true);

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
    return BigInt(cents) * BigInt(10 ** 4);
}

export const trimAddress = (address: string): string => address.slice(0, 4) + '...' + address.slice(-4);

export const solanaAddressToHex = (address: PublicKey) => `0x${address.toBuffer().toString("hex")}` as const;

export const deriveSolanaAddress = async (tokenId: number, recipient: PublicKey) => {
    const originAsset = Wormhole.tryNativeToUint8Array(RETIREMENT_ERC721, CHAIN_ID_POLYGON);
    const solanaAsset = (await getForeignAssetSolana(
        POLYGON_NFT_BRIDGE_ADDRESS,
        CHAIN_ID_POLYGON,
        originAsset,
        BigInt(tokenId)
    )) || "";
    const solanaMintKey = new PublicKey(solanaAsset); // NFT token

    return getAssociatedTokenAddressSync(
        solanaMintKey,
        recipient,
        true
    );
}

export const tokenIDsToRetirementNFTs = (recipient: PublicKey) => (tokenIDs: number[]): Promise<RetirementNFT[]> =>
    Promise.all(tokenIDs.map(async (tokenId) => {
        const solanaTokenAddress = await deriveSolanaAddress(tokenId, recipient);
        return {tokenId, solanaTokenAddress};
    }))