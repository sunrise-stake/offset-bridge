import {FC} from "react";
import {formatDecimal} from "@/lib/util";

export const TokenBalance: FC<{balance: bigint | undefined, decimals: number, requiredDecimals?: number}> = ({balance, decimals, requiredDecimals}) => {
    if (balance === undefined) return <span className="loading loading-spinner text-primary"/>;
    return <span>{formatDecimal(balance, decimals, requiredDecimals)}</span>;
}