import {FC, useEffect, useState} from "react";
import {useSolanaRetirement} from "@/context/solanaRetirementContext";
import {NextButton} from "@/components/nextButton";
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
import {useBridgeRetirementCert} from "@/hooks/useBridgeRetirementCert";
import {SolExplorerLink} from "@/components/solExplorerLink";
import * as polygonAPI from "@/api/polygonRetirement";
import {VAAResult} from "@/lib/types";

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

export default function Step4() {
    const bridgeInputBalance = useSolanaTokenBalance(bridgeInputTokenMint, tokenAuthority);

    const {api : solanaAPI} = useSolanaRetirement();
    const bridgeRetirementCert = useBridgeRetirementCert();

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

    const bridgePolygonTxInProgress = (txHash: string) => {
        setBridgePolygonTransaction(txHash);
        toast.info(<div>
            Polygon bridge transaction in progress:{' '} <PolyExplorerLink address={txHash} type="tx"/>
        </div>);
    }

    // handle polygon bridge success
    useEffect(() => {
        if (bridgeRetirementCert?.isSuccess && bridgeRetirementCert?.wait?.data) {
            toast.success(<div>
                Polygon bridge transaction successful:{' '}<PolyExplorerLink address={bridgeRetirementCert.data?.hash || ''} type="tx"/>
            </div>);

            polygonAPI.getVAAFromPolygonTransactionSignature(bridgeRetirementCert.wait.data).then(setVAAResult).catch(getVAAFailed);
        }
    }, [bridgeRetirementCert?.isSuccess, bridgeRetirementCert?.wait?.data]);

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
        if (!bridgeRetirementCert || !bridgeRetirementCert.writeAsync) return;
        bridgeRetirementCert.writeAsync().then(result => bridgePolygonTxInProgress(result.hash))
            .catch(bridgePolygonTxFailed);
    };

    const handleRedeem = async () => {
    };

    const substeps: Substep[] = [{
        ...substepInfos[0],
        status: !!activeBridgeTransaction?.polygonTxHash ? (bridgeRetirementCert?.isLoading ? 'running' : 'complete') : 'pending',
        details: {
            ...(activeBridgeTransaction?.polygonTxHash ? {txSig: <PolyExplorerLink address={activeBridgeTransaction.polygonTxHash} type="tx"/>} : {})
        }
    },{
        ...substepInfos[1],
        status: !!activeBridgeTransaction?.vaaResult ? 'complete' : (activeBridgeTransaction?.solanaTxSignature ? 'running' : 'pending'),
        details: {
            ...(activeBridgeTransaction?.vaaResult ? {
                sequence: <WormholeLink details={activeBridgeTransaction?.vaaResult}/>,
            } : {})
        }
    },{
        ...substepInfos[2],
        status: !!activeBridgeTransaction?.solanaTxSignature ? 'complete' : 'pending',
        details: {
            ...(activeBridgeTransaction?.solanaTxSignature ? {txHash: <SolExplorerLink address={activeBridgeTransaction.solanaTxSignature} type="tx"/>} : {})
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