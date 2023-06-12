import {FC, useEffect, useState} from "react";
import {useWalletSafe} from "@/hooks/useWalletSafe";
import {useConnection} from "@solana/wallet-adapter-react";
import {tokenDecimals, tokenMint, tokenSymbol, useSolanaRetirement} from "@/context/solanaRetirementContext";
import {useSolanaTokenBalance} from "@/hooks/useSolanaTokenBalance";
import {tokenAmountFromString, tokenAuthority} from "@/lib/util";
import {toast} from "react-toastify";
import {SolExplorerLink} from "@/components/solExplorerLink";
import {NextButton} from "@/components/nextButton";
import {TokenBalance} from "@/components/tokenBalance";
import {BRIDGE_INPUT_MINT_ADDRESS, BRIDGE_INPUT_MINT_DECIMALS, BRIDGE_INPUT_TOKEN_SYMBOL} from "@/lib/constants";
import {PolyExplorerLink} from "@/components/polyExplorerLink";
import {useHoldingContractBalance} from "@/hooks/useHoldingContractBalance";
import {useRedeemVAA} from "@/hooks/useRedeemVAA";
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

    const retireSuccessful = (txHash: string) => {
        clearBridgeTransaction();
        toast.success(<div>
            Retirement successful:{' '}<PolyExplorerLink address={txHash} type="tx"/>
        </div>);
    }

    const retireFailed = (error: Error) => {
        toast.error(<div>
            Retirement failed: {error.message}
        </div>);
    }

    const handleRetire = async () => {
        if (!offset || !offset.writeAsync || !retireEnabled) return;
        offset.writeAsync().then(result => retireSuccessful(result.hash))
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