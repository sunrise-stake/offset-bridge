import {LAMPORTS_PER_SOL, PublicKey} from "@solana/web3.js";
import {USDC_TOKEN_SOLANA, WRAPPED_SOL_TOKEN_MINT} from "@/lib/constants";
import {PRICES} from "@/lib/prices";

export const useUSDValue = (inputValue: number | undefined, inputMint: PublicKey | undefined):number => {
    if (!inputValue || !inputMint) return 0;

    if (inputMint === USDC_TOKEN_SOLANA) {
        return inputValue;
    }

    if (inputMint === WRAPPED_SOL_TOKEN_MINT) {
        return inputValue * PRICES.solana / 100 // USD cents to dollar
    }

    throw new Error("Invalid mint");
}