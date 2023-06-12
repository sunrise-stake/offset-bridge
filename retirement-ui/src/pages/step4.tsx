import {FC, useEffect, useState} from "react";
import {useSolanaRetirement} from "@/context/solanaRetirementContext";
import {NextButton} from "@/components/nextButton";
import {useWalletSafe} from "@/hooks/useWalletSafe";
import {useConnection} from "@solana/wallet-adapter-react";
import {useSolanaTokenBalance} from "@/hooks/useSolanaTokenBalance";
import {tokenAuthority} from "@/lib/util";
import {toast} from "react-toastify";
import {BRIDGE_INPUT_MINT_ADDRESS} from "@/lib/constants";
import {useAppStore} from "@/app/providers";
import {FaCheckCircle, FaCircle} from "react-icons/fa";
import {PolyExplorerLink} from "@/components/polyExplorerLink";
import {ConnectButton} from "@rainbow-me/rainbowkit";
import {WormholeLink} from "@/components/wormholeLink";
import {BridgeSubsteps, Substep, SubstepInfo} from "@/components/bridgeSubsteps";
import {VAAResult} from "@/api/solanaRetirement";

const bridgeInputTokenMint = BRIDGE_INPUT_MINT_ADDRESS;

const substepInfos: SubstepInfo[] = [
    {
        name: 'Polygon bridge transaction',
        description: 'Send the NFT to the Wormhole bridge',
    },
    {
        name: 'Retrieve receipt from bridge',
        description: 'Retrieve VAA (Verified Action Approval) from Wormhole. This can take up to five minutes.',
    },
    {
        name: 'Redeem on Solana',
        description: 'Receive the NFT on Solana. It will be sent to a predetermined address.'
    }
]


const SubStepIcon:FC<{ complete: boolean }> = ({ complete }) => complete ? (
    <FaCheckCircle className="text-green-500"/>
) : (
    <FaCircle className="text-gray-300"/>
);

export default function Step4() {
    const wallet = useWalletSafe();
    const { connection } = useConnection();
    const bridgeInputBalance = useSolanaTokenBalance(bridgeInputTokenMint, tokenAuthority);

    const {api : solanaAPI} = useSolanaRetirement();
    const activeBridgeTransaction = useAppStore(state => state.activeRetirementCertificateBridgeTransaction)
    const updateBridgeTransaction = useAppStore(state => state.updateActiveRetirementCertificateBridgeTransaction)

    const [bridgeEnabled, setBridgeEnabled] = useState(false);
    const [redeemEnabled, setRedeemEnabled] = useState(
        activeBridgeTransaction?.vaaResult !== undefined &&
        activeBridgeTransaction?.solanaTxSignature === undefined
    );

    const setBridgePolygonTransaction = (txHash: string) => {
        updateBridgeTransaction({ polygonTxHash: txHash });
    }

    const setVAAResult = (vaaResult: VAAResult) => {
        updateBridgeTransaction({ vaaResult });
    }

    useEffect(() => {
        setBridgeEnabled(solanaAPI !== undefined && !activeBridgeTransaction && bridgeInputBalance !== undefined && Number(bridgeInputBalance) > 0);

        // TODO polygon
        // if (activeBridgeTransaction && activeBridgeTransaction.solanaTxSignature && !activeBridgeTransaction.vaaResult) {
        //     solanaAPI?.getVAAFromSolanaTransactionSignature(activeBridgeTransaction.solanaTxSignature).then(setVAAResult).catch(getVAAFailed);
        // }
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

    const substeps: Substep[] = [{
        ...substepInfos[0],
        status: !!activeBridgeTransaction?.polygonTxHash ? 'complete' : 'pending',
        details: {
            ...(activeBridgeTransaction?.polygonTxHash ? {txSig: <PolyExplorerLink address={activeBridgeTransaction.polygonTxHash} type="tx"/>} : {})
        }
    },{
        ...substepInfos[1],
        status: !!activeBridgeTransaction?.vaaResult ? 'complete' : (activeBridgeTransaction?.polygonTxHash ? 'running' : 'pending'),
        details: {
            ...(activeBridgeTransaction?.vaaResult ? {
                sequence: <WormholeLink details={activeBridgeTransaction?.vaaResult}/>,
            } : {})
        }
    },{
        ...substepInfos[2],
        status: !!activeBridgeTransaction?.polygonTxHash ? 'complete' : 'pending',
        // TODO polygon
            // :
            // (redeemVAA?.data ? 'running' : 'pending'),
        details: {
            ...(activeBridgeTransaction?.polygonTxHash ? {txHash: <PolyExplorerLink address={activeBridgeTransaction.polygonTxHash} type="tx"/>} : {})
        }
    }
    ];

    return (<div>
        <h1 className="text-2xl mb-4">Step 4 - Redeem Retirement Certificate</h1>
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
            <ConnectButton/>
        </div>
        <BridgeSubsteps substeps={substeps}/>
        <div className="flex items-center space-x-2 mt-2">
            <NextButton disabled={ false }/>
        </div>
    </div>)
}