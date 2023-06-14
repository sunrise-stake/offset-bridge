import {FC, useEffect, useState} from "react";
import {toast} from "react-toastify";
import {NextButton} from "@/components/nextButton";
import {PolyExplorerLink} from "@/components/polyExplorerLink";
import {useHoldingContractBalance} from "@/hooks/useHoldingContractBalance";
import {useOffset} from "@/hooks/useOffset";
import {ConnectButton} from "@rainbow-me/rainbowkit";
import {useAppStore} from "@/app/providers";
import {USDCarbonAmount} from "@/components/USDCarbonAmount";

export default function Step3() {
    const holdingContractBalance = useHoldingContractBalance();
    const [retireEnabled, setRetireEnabled] = useState(true);
    const offset = useOffset();
    const clearBridgeTransaction = useAppStore(state => state.clearActiveUSDCBridgeTransaction)

    useEffect(() => {
        setRetireEnabled(!!holdingContractBalance?.balance && (holdingContractBalance.balance > 0));
    }, [holdingContractBalance?.balance]);

    const retireInProgress = (txHash: string) => {
        toast.info(<div>
            Retirement in progress:{' '}<PolyExplorerLink address={txHash} type="tx"/>
        </div>);
    }

    // handle retire success
    useEffect(() => {
        if (offset?.isSuccess) {
            clearBridgeTransaction();
            toast.info(<div>
                Retirement successful:{' '}<PolyExplorerLink address={offset.data?.hash || ''} type="tx"/>
            </div>);
        }
    }, [offset?.isSuccess]);

    const retireFailed = (error: Error) => {
        toast.error(<div>
            Retirement failed: {error.message}
        </div>);
    }

    const handleRetire = async () => {
        if (!offset || !offset.writeAsync || !retireEnabled) return;
        offset.writeAsync().then(result => retireInProgress(result.hash))
            .catch(retireFailed);
    };

    return (<div>
        <h1 className="text-2xl mb-4">Step 3 - Retire</h1>
        <div className="mb-2">Ready to retire:  <USDCarbonAmount usdAmount={holdingContractBalance.balance}/></div>
        <ConnectButton/>
        <div className="flex items-center space-x-2 mt-2">
            <button
                className="btn btn-primary w-32"
                disabled={!retireEnabled}
                onClick={handleRetire}
            >
                Retire
            </button>
        </div>
        <div className="flex items-center space-x-2 mt-2">
            <NextButton disabled={ false }/>
        </div>
    </div>)
}