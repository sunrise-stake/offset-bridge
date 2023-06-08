import {FC, useEffect, useState} from "react";
import {TokenBalance} from "@/components/tokenBalance";
import {useSolanaRetirement} from "@/context/solanaRetirementContext";
import {NextButton} from "@/components/nextButton";
import {useWalletSafe} from "@/hooks/useWalletSafe";
import {useConnection} from "@solana/wallet-adapter-react";
import {useSolanaTokenBalance} from "@/hooks/useSolanaTokenBalance";
import {tokenAuthority} from "@/lib/util";
import {toast} from "react-toastify";
import {ExplorerLink} from "@/components/explorerLink";
import {BRIDGE_INPUT_MINT_ADDRESS, BRIDGE_INPUT_MINT_DECIMALS, BRIDGE_INPUT_TOKEN_SYMBOL} from "@/lib/constants";
import {useAppStore} from "@/app/providers";
import {FaCheckCircle, FaCircle} from "react-icons/fa";

const bridgeInputTokenSymbol = BRIDGE_INPUT_TOKEN_SYMBOL;
const bridgeInputTokenMint = BRIDGE_INPUT_MINT_ADDRESS;
const bridgeInputTokenDecimals = BRIDGE_INPUT_MINT_DECIMALS;

const SubStepIcon:FC<{ complete: boolean }> = ({ complete }) => complete ? (
    <FaCheckCircle className="text-green-500"/>
) : (
    <FaCircle className="text-gray-300"/>
);

const BridgeSubSteps:FC<{ solBridgeTxComplete: boolean, vaaRetrieved: boolean, redeemedOnPolygon: boolean }> = ({ solBridgeTxComplete, vaaRetrieved, redeemedOnPolygon }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4">Bridge Operation</h2>
        <ul className="list-none">
            <li className="flex items-center mb-2">
                <SubStepIcon complete={solBridgeTxComplete} />
                <span className="ml-2">Solana bridge transaction</span>
            </li>
            <li className="flex items-center mb-2">
                <SubStepIcon complete={vaaRetrieved} />
                <span className="ml-2">Retrieve VAA from bridge</span>
            </li>
            <li className="flex items-center mb-2">
                <SubStepIcon complete={redeemedOnPolygon} />
                <span className="ml-2">Redeem on Polygon</span>
            </li>
        </ul>
    </div>
);


export default function Step3() {
    const wallet = useWalletSafe();
    const { connection } = useConnection();
    const bridgeInputBalance = useSolanaTokenBalance(bridgeInputTokenMint, tokenAuthority);

    const {api : solanaAPI} = useSolanaRetirement();
    const activeBridgeTransaction = useAppStore(state => state.activeUSDCBridgeTransaction)
    const updateBridgeTransaction = useAppStore(state => state.updateActiveUSDCBridgeTransaction)

    const [bridgeEnabled, setBridgeEnabled] = useState(false);
    const [redeemEnabled, setRedeemEnabled] = useState(
        activeBridgeTransaction?.vaaBytes !== undefined &&
        activeBridgeTransaction?.polygonTxHash === undefined
    );

    const setBridgeSolanaTransaction = (txSig: string) => {
        updateBridgeTransaction({ solanaTxSignature: txSig });
    }

    const setVAABytes = (vaaBytes: Uint8Array) => {
        updateBridgeTransaction({ vaaBytes: vaaBytes });
    }

    useEffect(() => {
        setBridgeEnabled(solanaAPI !== undefined && !activeBridgeTransaction && bridgeInputBalance !== undefined && Number(bridgeInputBalance) > 0);

        if (activeBridgeTransaction && activeBridgeTransaction.solanaTxSignature && !activeBridgeTransaction.vaaBytes) {
            solanaAPI?.getVAAFromSolanaTransactionSignature(activeBridgeTransaction.solanaTxSignature).then(setVAABytes).catch(getVAAFailed);
        }
    }, [bridgeInputBalance, solanaAPI]);

    const bridgeSolanaTxSuccessful = (txSig: string) => {
        setBridgeSolanaTransaction(txSig);
        toast.success(<div>
            Solana bridge transaction successful:{' '}<ExplorerLink address={txSig} type="tx"/>
        </div>);

        solanaAPI?.getVAAFromSolanaTransactionSignature(txSig).then(setVAABytes).catch(getVAAFailed);
    }

    const bridgeSolanaTxFailed = (error: Error) => {
        toast.error(<div>
            Solana bridge transaction failed: {error.message}
        </div>);
    }

    const getVAAFailed = (error: Error) => {
        toast.error(<div>
            Failed to retrieve information from bridge: {error.message}
        </div>);
    }

    const handleBridge = async () => {
        if (!solanaAPI) return;
        const {tx, messageKey } = await solanaAPI.bridge();
        return wallet.sendTransaction(tx, connection, { signers: [messageKey]}).then(bridgeSolanaTxSuccessful).catch(bridgeSolanaTxFailed);
    };

    const handleRedeem = async () => {
        // if (!polygonAPI || !activeBridgeTransaction?.vaaBytes) return;
        // await polygonAPI.redeem(activeBridgeTransaction.vaaBytes);
    };

    return (<div>
        <h1 className="text-2xl mb-4">Step 3 - Bridge</h1>
        <div className="mb-2">Balance to bridge:  <TokenBalance balance={bridgeInputBalance} decimals={bridgeInputTokenDecimals}/> {bridgeInputTokenSymbol}</div>
        <div className="flex items-center space-x-2 mb-2">
            <button
                className="btn btn-primary"
                disabled={!bridgeEnabled}
                onClick={handleBridge}
            >
                Bridge
            </button>
            <button
                className="btn btn-primary"
                disabled={!redeemEnabled}
                onClick={handleRedeem}
            >
                Redeem
            </button>
        </div>
        <BridgeSubSteps
            solBridgeTxComplete={!!activeBridgeTransaction?.solanaTxSignature}
            vaaRetrieved={!!activeBridgeTransaction?.vaaBytes}
            redeemedOnPolygon={!!activeBridgeTransaction?.polygonTxHash}
        />
        <div className="flex items-center space-x-2">
            <NextButton disabled={ false }/>
        </div>
    </div>)
}