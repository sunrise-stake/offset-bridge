import {FC} from "react";
import {formatDecimal, toFixedWithPrecision} from "@/lib/util";
import {USDC_TOKEN_DECIMALS} from "@/lib/constants";
import {usdcToCarbon} from "@/lib/prices";

export const USDCarbonAmount: FC<{usdAmount: bigint | undefined}> = ({usdAmount}) => {
    if (usdAmount === undefined) return <span className="loading loading-spinner text-primary"/>;
    return <span>{formatDecimal(usdAmount, USDC_TOKEN_DECIMALS)} USDC ( {toFixedWithPrecision(usdcToCarbon(usdAmount), 2)} tCO₂E )</span>;
}