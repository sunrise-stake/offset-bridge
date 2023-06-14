import {USDC_TOKEN_DECIMALS} from "@/lib/constants";

const DEFAULT_SOLANA_USD_PRICE = 1500; // SOL price in USD cents
const DEFAULT_NCT_USD_PRICE = 162; // NCT price in USD cents

interface Prices {
    solana: number;
    nct: number;
}
const PRICES: Prices = {
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

export const solToCarbon = (sol: number): number => (sol * PRICES.solana) / PRICES.nct;
export const usdcToCarbon = (usdcMinorDenomination: bigint): number =>
    (Number(usdcMinorDenomination)/ PRICES.nct)
    /
    (10 ** (USDC_TOKEN_DECIMALS - 2));

export const carbonToUsdcCents = (carbon: number): number => carbon * PRICES.nct;