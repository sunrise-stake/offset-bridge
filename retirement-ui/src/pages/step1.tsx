import {FC, useEffect, useState} from "react";
import {useAnchorWallet, useConnection, useWallet} from "@solana/wallet-adapter-react";
import {USDC_TOKEN_SOLANA} from "@/lib/constants";
import {useTokenBalance} from "@/hooks/useTokenBalance";
import {useWalletSafe} from "@/hooks/useWalletSafe";
import {formatDecimal, tokenAmountFromString, tokenAuthority} from "@/lib/util";
import {tokenDecimals, tokenMint, tokenSymbol, useSolanaRetirement} from "@/context/solanaRetirementContext";
import { toast } from 'react-toastify';
import {ExplorerLink} from "@/components/explorerLink";
import {NextButton} from "@/components/nextButton";
import {TokenBalance} from "@/components/tokenBalance";

export default function Step1() {
    const wallet = useWalletSafe();
    const { connection } = useConnection();
    const {api} = useSolanaRetirement();
    const myBalance = useTokenBalance(tokenMint, wallet.publicKey);
    const depositedBalance = useTokenBalance(tokenMint, tokenAuthority);
    const [amount, setAmount] = useState('');
    const [depositEnabled, setDepositEnabled] = useState(false);

    useEffect(() => {
        try {
            const amountBigInt = tokenAmountFromString(amount, tokenDecimals);
            setDepositEnabled(api !== undefined && amountBigInt > 0 && myBalance !== undefined && amountBigInt <= myBalance);
        } catch (e) {
            setDepositEnabled(false);
        }
    }, [amount, api, myBalance]);

    const depositSuccessful = (txSig: string) => {
        toast.success(<div>
            Deposit successful!{' '}<ExplorerLink address={txSig} type="tx"/>
        </div>);
    }

    const depositFailed = (error: Error) => {
        toast.error(<div>
            Deposit failed: {error.message}
        </div>);
    }

    const handleDeposit = async () => {
        if (!api) return;
        const amountBigInt = tokenAmountFromString(amount, tokenDecimals);
        const tx = await api.deposit(tokenMint, amountBigInt);
        return wallet.sendTransaction(tx, connection).then(depositSuccessful).catch(depositFailed);
    };

    return (<div>
        <h1 className="text-2xl mb-4">Step 1 - Deposit</h1>
        <div className="mb-2">My Balance: <TokenBalance balance={myBalance} decimals={tokenDecimals}/> {tokenSymbol}</div>
        <div className="mb-2">Deposited Balance:  <TokenBalance balance={depositedBalance} decimals={tokenDecimals}/> {tokenSymbol}</div>
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
                disabled={!depositEnabled}
                onClick={handleDeposit}
            >
                Deposit
            </button>
        </div>
        <div className="flex items-center space-x-2">
            <NextButton disabled={ depositedBalance === undefined || Number(depositedBalance) === 0 }/>
        </div>
    </div>)
}