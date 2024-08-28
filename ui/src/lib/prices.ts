import {LAMPORTS_PER_SOL} from '@solana/web3.js'
import {USDC_TOKEN_DECIMALS} from "@/lib/constants";

const DEFAULT_SOLANA_USD_PRICE = 15400; // SOL price in USD cents
const DEFAULT_NCT_USD_PRICE = 68; // NCT price in USD cents

interface Prices {
    solana: number;
    nct: number;
}
export const PRICES: Prices = {
    solana: DEFAULT_SOLANA_USD_PRICE,
    nct: DEFAULT_NCT_USD_PRICE,
};

fetch("https://api.sunrisestake.com/prices")
    .then(async (res) => res.json())
    .then(({ solana, "toucan-protocol-nature-carbon-tonne": nct }) => {
        console.log("Prices", { solana, nct });
        PRICES.solana = Number(solana.usd) * 100;
        PRICES.nct = Number(nct.usd) * 100;
    })
    .catch(console.error);

export const solToCarbon = (sol: number): number => lamportsToCarbon(sol * LAMPORTS_PER_SOL);

export const lamportsToCarbon = (lamports: number): number => (lamports * PRICES.solana /  LAMPORTS_PER_SOL) / PRICES.nct;
export const usdcToCarbon = (usdcMinorDenomination: bigint): number =>
    (Number(usdcMinorDenomination)/ PRICES.nct)
    /
    (10 ** (USDC_TOKEN_DECIMALS - 2));

export const carbonToUsdcCents = (carbon: number): number => carbon * PRICES.nct;
export const carbonToLamports = (carbon: number): number => carbonToUsdcCents(carbon) * LAMPORTS_PER_SOL / PRICES.solana