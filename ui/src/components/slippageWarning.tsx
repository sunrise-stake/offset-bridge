import {FC} from "react";
import {toFixedWithPrecision} from "@/lib/util";

export const SlippageWarning:FC<{ currentVal: number, units: string, recommendedMax: number }>
    = ({ currentVal, units, recommendedMax }) => {
    return <div className="text-red-500 text-xs">
        <p>Warning: Purchasing large amounts of offsets at once may result in high
        <a href="https://www.investopedia.com/terms/s/slippage.asp" target="_blank">slippage</a></p>
        <p>The current value of {toFixedWithPrecision(currentVal, 2)} {units} exceeds the recommended maximum of {recommendedMax} {units}.</p>
    </div>
}