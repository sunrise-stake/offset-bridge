import {PublicKey} from "@solana/web3.js";
import {BRIDGE_INPUT_MINT_ADDRESS, PROGRAM_ID, SOL_TOKEN_BRIDGE_ADDRESS, STATE_ADDRESS} from "./constants";
import {getAssociatedTokenAddressSync} from "spl-token-latest";

export const tokenAuthority = PublicKey.findProgramAddressSync([Buffer.from("input_account"), STATE_ADDRESS.toBuffer()], PROGRAM_ID)[0];
export const bridgeAuthority = PublicKey.findProgramAddressSync([Buffer.from("authority_signer")], new PublicKey(SOL_TOKEN_BRIDGE_ADDRESS))[0];
export const bridgeInputTokenAccount = getAssociatedTokenAddressSync(new PublicKey(BRIDGE_INPUT_MINT_ADDRESS), tokenAuthority, true);

export const formatDecimal = (value: bigint, decimals: number): string => {
    const valueStringWithLeadingZeros = value.toString().padStart(decimals + 1, "0");
    const beforeDecimal = valueStringWithLeadingZeros.slice(0, -decimals);
    const afterDecimal = valueStringWithLeadingZeros.slice(-decimals);
    const afterDecimalTrimmed = afterDecimal.replace(/0+$/, "");
    return `${beforeDecimal}.${afterDecimalTrimmed}`;
}

export const tokenAmountFromString = (valueString: string, decimals: number): bigint => {
    if (!valueString.match(/^\d+(\.\d+)?$/)) throw new Error("Invalid number");

    const [beforeDecimal, afterDecimal] = valueString.split(".");
    const afterDecimalPadded = (afterDecimal || "").padEnd(decimals, "0");

    return BigInt(beforeDecimal + afterDecimalPadded);
}