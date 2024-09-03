import {FC, useEffect, useState} from "react";
import {toast} from "react-toastify";
import {NextButton} from "@/components/nextButton";
import {PolyExplorerLink} from "@/components/polyExplorerLink";
import {useAppStore} from "@/app/providers";
import {USDCarbonAmount} from "@/components/USDCarbonAmount";
import {useHoldingContract} from "@/hooks/holdingContract/useHoldingContract";
import {waitForTransaction} from "@wagmi/core";

export default function Step4() {
    const [retireEnabled, setRetireEnabled] = useState(true);
    const { usdcBalance, offset } = useHoldingContract();
    const clearBridgeTransaction = useAppStore(state => state.clearActiveUSDCBridgeTransaction)

    useEffect(() => {
        setRetireEnabled(!!usdcBalance?.balance && (usdcBalance.balance > 0));
    }, [usdcBalance?.balance]);

    const retireInProgress = (txHash: string) => {
        toast.info(<div>
            Retirement in progress:{' '}<PolyExplorerLink address={txHash} type="tx"/>
        </div>);
    }

    // handle retire success
    useEffect(() => {
        if (offset?.isSuccess && offset?.data?.hash) {
            waitForTransaction({ hash: offset.data.hash }).then(() => {
                clearBridgeTransaction();
                toast.success(<div>
                    Retirement successful:{' '}<PolyExplorerLink address={offset.data?.hash || ''} type="tx"/>
                </div>);
            });
        }
    }, [offset?.isSuccess, offset?.data?.hash]);

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
        <h1 className="text-2xl mb-4">Step 4 - Retire</h1>
        <div className="mb-2">Ready to retire:  <USDCarbonAmount usdAmount={usdcBalance.balance}/></div>
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