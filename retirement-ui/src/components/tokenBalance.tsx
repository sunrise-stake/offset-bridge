import {FC} from "react";
import {formatDecimal} from "@/lib/util";

export const TokenBalance: FC<{balance: bigint | undefined, decimals: number}> = ({balance, decimals}) => {
    if (balance === undefined) return <span className="loading loading-spinner text-primary"/>;
    return <span>{formatDecimal(balance, decimals)}</span>;
}