import React, {useCallback} from "react";
import {TransactionReceipt} from "viem";
import {toast} from "react-toastify";
import {PolyExplorerLink} from "@/components/polyExplorerLink";
import {waitForTransaction, WriteContractResult} from "@wagmi/core";

export const usePolygonWriteTransaction = (
    fn: () => Promise<WriteContractResult | undefined>,
    operationName: string = 'Operation',
    deps: any[],
    setReady: (ready: boolean) => void
) => useCallback(async () => {
    const operationSuccessful = (receipt: TransactionReceipt) => {
        setReady(true);
        toast.success(<div>
            {operationName} successful:{' '}<PolyExplorerLink address={receipt.transactionHash} type="tx"/>
        </div>);
    }

    const operationInProgress = (writeContractResult: WriteContractResult | undefined) => {
        if (!writeContractResult) return;
        setReady(false);

        toast.info(<div>
            {operationName} in progress:{' '}<PolyExplorerLink address={writeContractResult.hash} type="tx"/>
        </div>);

        waitForTransaction({ hash :writeContractResult.hash })
            .then(operationSuccessful)
            .catch(operationFailed);
    }

    const operationFailed = (error: Error) => {
        toast.error(<div>
            {operationName} failed: {error.message}
        </div>);
    }

    fn().then(operationInProgress).catch(operationFailed);
}, deps);