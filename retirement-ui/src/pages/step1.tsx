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

export default function Step1() {
    const wallet = useWalletSafe();
    const { connection } = useConnection();
    const {api} = useSolanaRetirement();
    const myBalance = useSolanaTokenBalance(tokenMint, wallet.publicKey);
    const depositedBalance = useSolanaTokenBalance(tokenMint, tokenAuthority);
    const swappedBalance = useSolanaTokenBalance(swapOutputTokenMint, tokenAuthority);
    const [amount, setAmount] = useState('');
    const [swapEnabled, setSwapEnabled] = useState(false);

    useEffect(() => {
        try {
            const amountBigInt = tokenAmountFromString(amount, tokenDecimals);
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

    const handleSwap = async () => {
        if (!api || !swapEnabled) return;
        const amountBigInt = tokenAmountFromString(amount, tokenDecimals);
        const tx = await api.depositAndSwap(swapInputToken, amountBigInt);
        return wallet.sendTransaction(tx, connection).then(swapSuccessful).catch(swapFailed);
    };

    return (<div>
        <h1 className="text-2xl mb-4">Step 1 - Deposit</h1>
        <div className="mb-2">My Balance: <TokenBalance balance={myBalance} decimals={tokenDecimals}/> {tokenSymbol}</div>
        <div className="mb-2">Deposited Balance:  <TokenBalance balance={depositedBalance} decimals={swapInputTokenDecimals}/> {swapInputTokenSymbol}</div>
        <div className="mb-2">Swapped Balance:  <TokenBalance balance={swappedBalance} decimals={swapOutputTokenDecimals}/> {swapOutputTokenSymbol}</div>
        <div className="flex items-center space-x-2 mb-2">
            <input
                type="number"
                className="input input-bordered w-32"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Amount"
            />
            <button
                className="btn btn-primary"
                disabled={!swapEnabled}
                onClick={handleSwap}
            >
                Deposit
            </button>
        </div>
        <div className="flex items-center space-x-2">
            <NextButton disabled={ swappedBalance === undefined || Number(swappedBalance) === 0 }/>
        </div>
    </div>)
}