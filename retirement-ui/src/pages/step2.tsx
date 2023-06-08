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

const swapInputToken = tokenMint;
const swapInputTokenSymbol = tokenSymbol;
const swapInputTokenDecimals = tokenDecimals;
const swapOutputTokenSymbol = BRIDGE_INPUT_TOKEN_SYMBOL;
const swapOutputTokenMint = BRIDGE_INPUT_MINT_ADDRESS;
const swapOutputTokenDecimals = BRIDGE_INPUT_MINT_DECIMALS;

export default function Step2() {
    const wallet = useWalletSafe();
    const { connection } = useConnection();
    const {api} = useSolanaRetirement();
    const depositedBalance = useSolanaTokenBalance(tokenMint, tokenAuthority);
    const swappedBalance = useSolanaTokenBalance(swapOutputTokenMint, tokenAuthority);

    const [swapEnabled, setSwapEnabled] = useState(false);

    useEffect(() => {
        setSwapEnabled(api !== undefined && depositedBalance !== undefined && Number(depositedBalance) > 0);
    }, [depositedBalance, api]);

    const swapSuccessful = (txSig: string) => {
        toast.success(<div>
            Swap successful:{' '}<SolExplorerLink address={txSig} type="tx"/>
        </div>);
    }

    const swapFailed = (error: Error) => {
        toast.error(<div>
            Swap failed: {error.message}
        </div>);
    }

    const handleSwap = async () => {
        if (!api) return;
        const tx = await api.swap(swapInputToken);
        return wallet.sendTransaction(tx, connection).then(swapSuccessful).catch(swapFailed);
    };

    return (<div>
        <h1 className="text-2xl mb-4">Step 2 - Swap</h1>
        <div className="mb-2">Deposited Balance:  <TokenBalance balance={depositedBalance} decimals={swapInputTokenDecimals}/> {swapInputTokenSymbol}</div>
        <div className="mb-2">Swapped Balance:  <TokenBalance balance={swappedBalance} decimals={swapOutputTokenDecimals}/> {swapOutputTokenSymbol}</div>
        <div className="flex items-center space-x-2 mb-2">
            <button
                className="btn btn-primary"
                disabled={!swapEnabled}
                onClick={handleSwap}
            >
                Swap
            </button>
        </div>
        <div className="flex items-center space-x-2">
            <NextButton disabled={ swappedBalance === undefined || Number(swappedBalance) === 0 }/>
        </div>
    </div>)
}