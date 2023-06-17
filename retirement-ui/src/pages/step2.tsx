import {useCallback, useEffect, useState} from "react";
import {useWalletSafe} from "@/hooks/useWalletSafe";
import {useConnection} from "@solana/wallet-adapter-react";
import {tokenDecimals, tokenMint, tokenSymbol, useSolanaRetirement} from "@/context/solanaRetirementContext";
import {useSolanaTokenBalance} from "@/hooks/useSolanaTokenBalance";
import {tokenAmountFromString, tokenAuthority, usdcTokenAmountFromCents} from "@/lib/util";
import {toast} from "react-toastify";
import {SolExplorerLink} from "@/components/solExplorerLink";
import {NextButton} from "@/components/nextButton";
import {TokenBalance} from "@/components/tokenBalance";
import {
    BRIDGE_INPUT_MINT_ADDRESS,
    BRIDGE_INPUT_MINT_DECIMALS,
    BRIDGE_INPUT_TOKEN_SYMBOL,
} from "@/lib/constants";
import {useAppStore} from "@/app/providers";
import {HoldingContractSelector} from "@/components/holdingContractSelector";
import {USDCarbonAmount} from "@/components/USDCarbonAmount";
import {carbonToUsdcCents} from "@/lib/prices";
import {useHoldingContract} from "@/hooks/holdingContract/useHoldingContract";
import {useToucan} from "@/hooks/useToucan";
import {TCO2TokenResponse} from "toucan-sdk";
import {ToucanProjectsSelector} from "@/components/toucanProjectsSelector";

const swapInputToken = tokenMint;
const swapInputTokenDecimals = tokenDecimals;
const swapOutputTokenMint = BRIDGE_INPUT_MINT_ADDRESS;

export default function Step2() {
    const wallet = useWalletSafe();
    const { connection } = useConnection();
    const {api} = useSolanaRetirement();
    const myBalance = useSolanaTokenBalance(tokenMint, wallet.publicKey);
    const swappedBalance = useSolanaTokenBalance(swapOutputTokenMint, tokenAuthority);
    const [amount, setAmount] = useState('');
    const [swapEnabled, setSwapEnabled] = useState(false);
    const [amountInputAsUSDC, setAmountInputAsUSDC] = useState(true);
    const { tco2, solanaAccountAddress, owner, reads: {error, isLoading} } = useHoldingContract();
    const { getProjectById, allProjects, loading: toucanLoading, error : toucanError } = useToucan();
    const holdingContractTarget = useAppStore(state => state.holdingContractTarget);
    const setHoldingContractTarget = useAppStore(state => state.setHoldingContractTarget);

    const [retirementDetails, setRetirementDetails] = useState<TCO2TokenResponse>();

    const getInputAmountAsUSD = useCallback((): bigint => {
        if (amountInputAsUSDC && !!amount) return tokenAmountFromString(amount, tokenDecimals);

        return usdcTokenAmountFromCents(carbonToUsdcCents(Number(amount)));
    }, [amount, amountInputAsUSDC]);

    useEffect(() => {
        try {
            const amountBigInt = getInputAmountAsUSD();
            setSwapEnabled(api !== undefined && amountBigInt > 0 && myBalance !== undefined && amountBigInt <= myBalance);
        } catch (e) {
            setSwapEnabled(false);
        }
    }, [amount, api, myBalance]);

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

    const handleAmountToggleChange = () => {
        setAmountInputAsUSDC(!amountInputAsUSDC);
    };

    const handleSwap = async () => {
        if (!api || !swapEnabled) return;
        const amountBigInt = getInputAmountAsUSD();
        const tx = await api.depositAndSwap(swapInputToken, amountBigInt);
        return wallet.sendTransaction(tx, connection).then(swapSuccessful).catch(swapFailed);
    };

    return (<div>
        <h1 className="text-2xl mb-4">Step 2 - Deposit</h1>
        <div className="mb-2">My Balance: <TokenBalance balance={myBalance} decimals={swapInputTokenDecimals}/> {tokenSymbol}</div>
        <div className="mb-2">Deposited:  <USDCarbonAmount usdAmount={swappedBalance}/></div>
        <div className="mb-2">To deposit:  <USDCarbonAmount usdAmount={getInputAmountAsUSD()}/></div>
        <div className="flex items-center space-x-2 mb-2">
            <input
                type="number"
                className="input input-bordered w-32"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={ amountInputAsUSDC ? "$" : "tCO₂E"}
            />
            <button
                className="btn btn-primary w-32"
                disabled={!swapEnabled}
                onClick={handleSwap}
            >
                Deposit
            </button>
        </div>
        <div>
            <div className="flex items-center space-x-2">
                <span className="text-gray-600">USD</span>

                <div className="form-toggle">
                    <input type="checkbox" className="toggle" checked={!amountInputAsUSDC} onChange={handleAmountToggleChange} />
                    <label htmlFor="toggle"></label>
                </div>

                <span className="text-gray-600">Carbon</span>
            </div>
        </div>
        <div className="flex items-center space-x-2 mt-2">
            <NextButton disabled={ swappedBalance === undefined || Number(swappedBalance) === 0 }/>
        </div>
    </div>)
}