import {FC, useCallback, useEffect, useMemo, useState} from "react";
import {useWalletSafe} from "@/hooks/useWalletSafe";
import {useConnection} from "@solana/wallet-adapter-react";
import {useSolanaRetirement} from "@/context/solanaRetirementContext";
import {useSolanaTokenBalance} from "@/hooks/useSolanaTokenBalance";
import {
    formatDecimal,
    toFixedWithPrecision,
    tokenAmountFromString,
    tokenAuthority,
    usdcTokenAmountFromCents
} from "@/lib/util";
import {toast} from "react-toastify";
import {SolExplorerLink} from "@/components/solExplorerLink";
import {NextButton} from "@/components/nextButton";
import {TokenBalance} from "@/components/tokenBalance";
import {
    BRIDGE_INPUT_MINT_ADDRESS,
    SolanaToken,
    supportedInputTokens,
    USDC_TOKEN_DECIMALS,
    USDC_TOKEN_SOLANA,
    WRAPPED_SOL_TOKEN_MINT,
} from "@/lib/constants";
import {USDCarbonAmount} from "@/components/USDCarbonAmount";
import {carbonToLamports, carbonToUsdcCents, lamportsToCarbon, solToCarbon, usdcToCarbon} from "@/lib/prices";
import {SimpleDropdown} from "@/components/simpleDropdown";
import {useSolanaSolBalance} from "@/hooks/useSolanaSolBalance";
import {useDepositBalances} from "@/hooks/useDepositBalances";

const swapOutputTokenMint = BRIDGE_INPUT_MINT_ADDRESS;

/**
 * The following accounts are of interest during this step:
 *
 * 1. The user's SPL balance (if depositing SPL)
 * 2. The user's SOL balance (if depositing SOL)
 * 3. The SPL balance of the token ATA belonging to the token authority (if depositing SPL)
 * 4. The SOL balance of the wrapped SOL ATA belonging to the token authority (if depositing SOL)
 * 5. The Wrapped SOL balance of the token ATA belonging to the token authority (if depositing SOL)
 *
 * If 4 is non-zero, a wrap instruction should be executed to convert the SOL to wrapped SOL before the swap takes place.
 */

export default function Step2() {
    const wallet = useWalletSafe();
    const { connection } = useConnection();
    const {api} = useSolanaRetirement();
    const [selectedInputToken, setSelectedInputToken] = useState<SolanaToken>(supportedInputTokens[0]);
    const depositBalances = useDepositBalances(wallet.publicKey, selectedInputToken.mint, swapOutputTokenMint);
    const [amountToDeposit, setAmountToDeposit] = useState('');
    const [swapEnabled, setSwapEnabled] = useState(false);
    const [amountInputAsSelectedToken, setAmountInputAsSelectedToken] = useState(true);

    const isSolSelected = selectedInputToken.mint === WRAPPED_SOL_TOKEN_MINT;
    const userBalance = isSolSelected ? depositBalances.userSolBalance : depositBalances.userTokenBalance;

    const getInputAmountAsSelectedToken = useCallback((): bigint => {
        if (amountInputAsSelectedToken && !!amountToDeposit) return tokenAmountFromString(amountToDeposit, selectedInputToken.decimals);

        // TODO generalise to other tokens as needed
        if (selectedInputToken.mint === USDC_TOKEN_SOLANA) {
            return usdcTokenAmountFromCents(carbonToUsdcCents(Number(amountToDeposit)));
        }

        if (selectedInputToken.mint === WRAPPED_SOL_TOKEN_MINT) {
            return BigInt(Math.floor(carbonToLamports(Number(amountToDeposit))));
        }

        throw new Error('Unable to convert for token ' + selectedInputToken.symbol);
    }, [amountToDeposit, amountInputAsSelectedToken, selectedInputToken]);

    useEffect(() => {
        try {
            const inputAmountBigInt = getInputAmountAsSelectedToken();
            const unwrappedSolDeposited = isSolSelected && depositBalances.tokenAuthorityUnwrappedSolBalance && depositBalances.tokenAuthorityUnwrappedSolBalance > 0;
            const inputAmountValid = inputAmountBigInt > 0 && userBalance !== undefined && inputAmountBigInt <= userBalance;
            setSwapEnabled(api !== undefined && (unwrappedSolDeposited || inputAmountValid));
        } catch (e) {
            setSwapEnabled(false);
        }
    }, [amountToDeposit, api, depositBalances]);

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
        setAmountInputAsSelectedToken(!amountInputAsSelectedToken);
    };

    const handleSwap = async () => {
        if (!api || !swapEnabled) return;
        const amountBigInt = getInputAmountAsSelectedToken();

        let tx;
        if (isSolSelected) {
            tx = await api.wrapAndSwap(amountBigInt, depositBalances.tokenAuthorityUnwrappedSolBalance);
        } else {
            tx = await api.depositAndSwap(selectedInputToken.mint, amountBigInt);
        }
        await api.simulate(tx);
        return wallet.sendTransaction(tx, connection).then(swapSuccessful).catch(swapFailed);
    };

    const inputTokens = supportedInputTokens.map((token) => ({
        ...token,
        name: token.symbol
    }));
    const CarbonAmount:FC<{ tokenAmount: bigint | undefined }> = ({ tokenAmount }) => {
        console.log('tokenAmount', tokenAmount)
        if (tokenAmount === undefined) return <span className="loading loading-spinner text-primary"/>;

        const carbonAmount = isSolSelected ? lamportsToCarbon(Number(tokenAmount)) : usdcToCarbon(tokenAmount);
        console.log('carbonAmount', carbonAmount)

        return <span>
            {formatDecimal(tokenAmount, selectedInputToken.decimals)} {selectedInputToken.symbol} ( {toFixedWithPrecision(carbonAmount, 2)} tCO₂E )
        </span>;
    }

    return (<div>
        <h1 className="text-2xl mb-4">Step 2 - Deposit</h1>
        <div className="mb-2 inline-flex items-center space-x-2 gap-2">Input token: <SimpleDropdown options={inputTokens} initial={inputTokens[0]} select={setSelectedInputToken} /></div>
        <div className="mb-2">My Balance: <TokenBalance balance={userBalance} decimals={selectedInputToken.decimals}/> {selectedInputToken.symbol}</div>
        <div className="mb-2">To deposit:  <CarbonAmount tokenAmount={getInputAmountAsSelectedToken()}/></div>
        {isSolSelected && <div className="mb-2">Unwrapped:  <TokenBalance balance={depositBalances.tokenAuthorityUnwrappedSolBalance} decimals={selectedInputToken.decimals} requiredDecimals={5}/>  {selectedInputToken.symbol}</div>}
        <div className="mb-2">Deposited:  <TokenBalance balance={depositBalances.tokenAuthorityTokenBalance} decimals={selectedInputToken.decimals} requiredDecimals={5}/>  {selectedInputToken.symbol}</div>
        <div className="mb-2">Swapped:  <USDCarbonAmount usdAmount={depositBalances.tokenAuthoritySwappedBalance}/></div>
        <div className="flex items-center space-x-2 mb-2">
            <input
                type="number"
                className="input input-bordered w-32"
                value={amountToDeposit}
                onChange={(e) => setAmountToDeposit(e.target.value)}
                placeholder={ amountInputAsSelectedToken ? "$" : "tCO₂E"}
            />
            <button
                className="btn btn-primary w-32"
                disabled={!swapEnabled}
                onClick={handleSwap}
            >
                Deposit & Swap
            </button>
        </div>
        <div>
            <div className="flex items-center space-x-2">
                <span className="text-gray-600">{selectedInputToken.symbol}</span>

                <div className="form-toggle">
                    <input type="checkbox" className="toggle" checked={!amountInputAsSelectedToken} onChange={handleAmountToggleChange} />
                    <label htmlFor="toggle"></label>
                </div>

                <span className="text-gray-600">Carbon</span>
            </div>
        </div>
        <div className="flex items-center space-x-2 mt-2">
            <NextButton disabled={ depositBalances.tokenAuthoritySwappedBalance === undefined || Number(depositBalances.tokenAuthoritySwappedBalance) === 0 }/>
        </div>
    </div>)
}