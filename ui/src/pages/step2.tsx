import {FC, useCallback, useEffect, useMemo, useState} from "react";
import {useWalletSafe} from "@/hooks/useWalletSafe";
import {useConnection} from "@solana/wallet-adapter-react";
import {useSolanaRetirement} from "@/context/solanaRetirementContext";
import {
    formatDecimal,
    toFixedWithPrecision,
    tokenAmountFromString,
    usdcTokenAmountFromCents
} from "@/lib/util";
import {NextButton} from "@/components/nextButton";
import {TokenBalance} from "@/components/tokenBalance";
import {
    BRIDGE_INPUT_MINT_ADDRESS,
    SolanaToken,
    supportedInputTokens,
    USDC_TOKEN_SOLANA,
    WRAPPED_SOL_TOKEN_MINT,
} from "@/lib/constants";
import {USDCarbonAmount} from "@/components/USDCarbonAmount";
import {carbonToLamports, carbonToUsdcCents, lamportsToCarbon, usdcToCarbon} from "@/lib/prices";
import {SimpleDropdown} from "@/components/simpleDropdown";
import {useDepositBalances} from "@/hooks/useDepositBalances";
import {useSolanaTxConfirm} from "@/hooks/useSolanaTxConfirm";
import {SlippageWarning} from "@/components/slippageWarning";
import {useUSDValue} from "@/hooks/useUSDValue";

const swapOutputTokenMint = BRIDGE_INPUT_MINT_ADDRESS;
const slippageWarningAt = 1_000 // USD

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
    const {api} = useSolanaRetirement();
    const [selectedInputToken, setSelectedInputToken] = useState<SolanaToken>(supportedInputTokens[0]);
    const depositBalances = useDepositBalances(wallet.publicKey, selectedInputToken.mint, swapOutputTokenMint);
    const [amountToDeposit, setAmountToDeposit] = useState('');
    const [swapEnabled, setSwapEnabled] = useState(false);
    const [amountInputAsSelectedToken, setAmountInputAsSelectedToken] = useState(true);
    const handleSwapTransaction = useSolanaTxConfirm( { successMessage: "Swap successful", errorMessage: "Swap failed" });
    const isSolSelected = selectedInputToken.mint === WRAPPED_SOL_TOKEN_MINT;
    const userBalance = isSolSelected ? depositBalances.userSolBalance : depositBalances.userTokenBalance;

    const inputAmountBigInt = useMemo((): bigint => {
        if (amountInputAsSelectedToken && !!amountToDeposit) return tokenAmountFromString(amountToDeposit, selectedInputToken.decimals);

        if (selectedInputToken.mint === USDC_TOKEN_SOLANA) {
            return usdcTokenAmountFromCents(carbonToUsdcCents(Number(amountToDeposit)));
        }

        if (selectedInputToken.mint === WRAPPED_SOL_TOKEN_MINT) {
            return BigInt(Math.floor(carbonToLamports(Number(amountToDeposit))));
        }

        throw new Error('Unable to convert for token ' + selectedInputToken.symbol);
    }, [amountToDeposit, amountInputAsSelectedToken, selectedInputToken]);
    const inputAmountUSDValue = useUSDValue(Number(amountToDeposit), selectedInputToken.mint);

    useEffect(() => {
        try {
            const unwrappedSolDeposited = isSolSelected && depositBalances.tokenAuthorityUnwrappedSolBalance && depositBalances.tokenAuthorityUnwrappedSolBalance > 0;
            const inputAmountValid = inputAmountBigInt > 0 && userBalance !== undefined && inputAmountBigInt <= userBalance;
            setSwapEnabled(api !== undefined && (unwrappedSolDeposited || inputAmountValid));
        } catch (e) {
            setSwapEnabled(false);
        }
    }, [amountToDeposit, api, depositBalances]);

    const handleAmountToggleChange = () => {
        setAmountInputAsSelectedToken(!amountInputAsSelectedToken);
    };

    const handleSwap = async () => {
        if (!api || !swapEnabled) return;
        let tx;
        if (isSolSelected) {
            tx = await api.wrapAndSwap(inputAmountBigInt, depositBalances.tokenAuthorityUnwrappedSolBalance);
        } else {
            tx = await api.depositAndSwap(selectedInputToken.mint, inputAmountBigInt);
        }

        return handleSwapTransaction(tx);
    };

    const inputTokens = supportedInputTokens.map((token) => ({
        ...token,
        name: token.symbol
    }));
    const CarbonAmount:FC<{ tokenAmount: bigint | undefined }> = ({ tokenAmount }) => {
        if (tokenAmount === undefined) return <span className="loading loading-spinner text-primary"/>;

        const carbonAmount = isSolSelected ? lamportsToCarbon(Number(tokenAmount)) : usdcToCarbon(tokenAmount);

        return <span>
            {formatDecimal(tokenAmount, selectedInputToken.decimals)} {selectedInputToken.symbol} ( {toFixedWithPrecision(carbonAmount, 2)} tCO₂E )
        </span>;
    }
    const placeholder = amountInputAsSelectedToken ? (isSolSelected ? "SOL" : selectedInputToken.symbol) : "tCO₂E";

    return (<div>
        <h1 className="text-2xl mb-4">Step 2 - Deposit</h1>
        <div className="mb-2 inline-flex items-center space-x-2 gap-2">Input token: <SimpleDropdown options={inputTokens} initial={inputTokens[0]} select={setSelectedInputToken} /></div>
        <div className="mb-2">My Balance: <TokenBalance balance={userBalance} decimals={selectedInputToken.decimals}/> {selectedInputToken.symbol}</div>
        <div className="mb-2">To deposit:  <CarbonAmount tokenAmount={inputAmountBigInt}/></div>
        {isSolSelected && <div className="mb-2">Unwrapped:  <TokenBalance balance={depositBalances.tokenAuthorityUnwrappedSolBalance} decimals={selectedInputToken.decimals} requiredDecimals={5}/>  {selectedInputToken.symbol}</div>}
        <div className="mb-2">Deposited:  <TokenBalance balance={depositBalances.tokenAuthorityTokenBalance} decimals={selectedInputToken.decimals} requiredDecimals={5}/>  {selectedInputToken.symbol}</div>
        <div className="mb-2">Swapped:  <USDCarbonAmount usdAmount={depositBalances.tokenAuthoritySwappedBalance}/></div>
        <div className="flex items-center space-x-2 mb-2">
            <input
                type="number"
                className="input input-bordered w-32"
                value={amountToDeposit}
                onChange={(e) => setAmountToDeposit(e.target.value)}
                placeholder={placeholder}
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
        { (inputAmountUSDValue > slippageWarningAt) && <SlippageWarning currentVal={inputAmountUSDValue} units={"USD"} recommendedMax={slippageWarningAt}/>}
        <div className="flex items-center space-x-2 mt-2">
            <NextButton disabled={ depositBalances.tokenAuthoritySwappedBalance === undefined || Number(depositBalances.tokenAuthoritySwappedBalance) === 0 }/>
        </div>
    </div>)
}