import {FC, useEffect, useState} from "react";
import {TokenBalance} from "@/components/tokenBalance";
import {useSolanaRetirement} from "@/context/solanaRetirementContext";
import {NextButton} from "@/components/nextButton";
import {useWalletSafe} from "@/hooks/useWalletSafe";
import {useConnection} from "@solana/wallet-adapter-react";
import {useSolanaTokenBalance} from "@/hooks/useSolanaTokenBalance";
import {tokenAuthority} from "@/lib/util";
import {toast} from "react-toastify";
import {SolExplorerLink} from "@/components/solExplorerLink";
import {BRIDGE_INPUT_MINT_ADDRESS, BRIDGE_INPUT_MINT_DECIMALS, BRIDGE_INPUT_TOKEN_SYMBOL} from "@/lib/constants";
import {useAppStore} from "@/app/providers";
import {FaCheckCircle, FaCircle} from "react-icons/fa";
import {PolyExplorerLink} from "@/components/polyExplorerLink";

const bridgeInputTokenSymbol = BRIDGE_INPUT_TOKEN_SYMBOL;
const bridgeInputTokenMint = BRIDGE_INPUT_MINT_ADDRESS;
const bridgeInputTokenDecimals = BRIDGE_INPUT_MINT_DECIMALS;

const SubStepIcon:FC<{ complete: boolean }> = ({ complete }) => complete ? (
    <FaCheckCircle className="text-green-500"/>
) : (
    <FaCircle className="text-gray-300"/>
);

const BridgeSubSteps:FC<{ polygonBridgeTxComplete: boolean, vaaRetrieved: boolean, redeemedOnSolana: boolean }> = ({ polygonBridgeTxComplete, vaaRetrieved, redeemedOnSolana }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4">Bridge Operation</h2>
        <ul className="list-none">
            <li className="flex items-center mb-2">
                <SubStepIcon complete={polygonBridgeTxComplete} />
                <span className="ml-2">Polygon bridge transaction</span>
            </li>
            <li className="flex items-center mb-2">
                <SubStepIcon complete={vaaRetrieved} />
                <span className="ml-2">Retrieve VAA from bridge</span>
            </li>
            <li className="flex items-center mb-2">
                <SubStepIcon complete={redeemedOnSolana} />
                <span className="ml-2">Redeem on Solana</span>
            </li>
        </ul>
    </div>
);


export default function Step5() {
    const wallet = useWalletSafe();
    const { connection } = useConnection();
    const bridgeInputBalance = useSolanaTokenBalance(bridgeInputTokenMint, tokenAuthority);

    const {api : solanaAPI} = useSolanaRetirement();
    const activeBridgeTransaction = useAppStore(state => state.activeRetirementCertificateBridgeTransaction)
    const updateBridgeTransaction = useAppStore(state => state.updateActiveRetirementCertificateBridgeTransaction)

    const [bridgeEnabled, setBridgeEnabled] = useState(false);
    const [redeemEnabled, setRedeemEnabled] = useState(
        activeBridgeTransaction?.vaaBytes !== undefined &&
        activeBridgeTransaction?.solanaTxSignature === undefined
    );

    const setBridgePolygonTransaction = (txHash: string) => {
        updateBridgeTransaction({ polygonTxHash: txHash });
    }

    const setVAABytes = (vaaBytes: Uint8Array) => {
        updateBridgeTransaction({ vaaBytes });
    }

    useEffect(() => {
        setBridgeEnabled(solanaAPI !== undefined && !activeBridgeTransaction && bridgeInputBalance !== undefined && Number(bridgeInputBalance) > 0);

        if (activeBridgeTransaction && activeBridgeTransaction.solanaTxSignature && !activeBridgeTransaction.vaaBytes) {
            solanaAPI?.getVAAFromSolanaTransactionSignature(activeBridgeTransaction.solanaTxSignature).then(setVAABytes).catch(getVAAFailed);
        }
    }, [bridgeInputBalance, solanaAPI]);

    const bridgePolygonTxSuccessful = (txHash: string) => {
        setBridgePolygonTransaction(txHash);
        toast.success(<div>
            Polygon bridge transaction successful:{' '} <PolyExplorerLink address={txHash} type="tx"/>
        </div>);

        // TODO
        // solanaAPI?.getVAAFromSolanaTransactionSignature(txSig).then(setVAABytes).catch(getVAAFailed);
    }

    const bridgePolygonTxFailed = (error: Error) => {
        toast.error(<div>
            Polygon bridge transaction failed: {error.message}
        </div>);
    }

    const getVAAFailed = (error: Error) => {
        toast.error(<div>
            Failed to retrieve information from bridge: {error.message}
        </div>);
    }

    const handleBridge = async () => {
    };

    const handleRedeem = async () => {
    };

    return (<div>
        <h1 className="text-2xl mb-4">Step 5 - Redeem Retirement Certificate</h1>
        <div className="flex items-center space-x-2 mb-2">
            <button
                className="btn btn-primary"
                disabled={!bridgeEnabled}
                onClick={handleBridge}
            >
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
            polygonBridgeTxComplete={!!activeBridgeTransaction?.polygonTxHash}
            vaaRetrieved={!!activeBridgeTransaction?.vaaBytes}
            redeemedOnSolana={!!activeBridgeTransaction?.solanaTxSignature}
        />
        <div className="flex items-center space-x-2">
            <NextButton disabled={ false }/>
        </div>
    </div>)
}