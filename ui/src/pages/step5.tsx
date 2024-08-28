import {FC, useEffect, useState} from "react";
import {useSolanaRetirement} from "@/context/solanaRetirementContext";
import {NextButton} from "@/components/nextButton";
import {useSolanaTokenBalance} from "@/hooks/useSolanaTokenBalance";
import {deriveTokenAuthority} from "@/lib/util";
import {toast} from "react-toastify";
import {BRIDGE_INPUT_MINT_ADDRESS} from "@/lib/constants";
import {useAppStore} from "@/app/providers";
import {PolyExplorerLink} from "@/components/polyExplorerLink";
import {WormholeLink} from "@/components/wormholeLink";
import {BridgeSubsteps, Substep, SubstepInfo} from "@/components/bridgeSubsteps";
import {useBridgeRetirementCert} from "@/hooks/useBridgeRetirementCert";
import {SolExplorerLink} from "@/components/solExplorerLink";
import * as polygonAPI from "@/api/polygonRetirement";
import {VAAResult} from "@/lib/types";
import {useHoldingContract} from "@/hooks/holdingContract/useHoldingContract";
import {waitForTransaction} from "@wagmi/core";
import {useWalletSafe} from "@/hooks/useWalletSafe";
import {useConnection} from "@solana/wallet-adapter-react";

const substepInfos: SubstepInfo[] = [
    {
        name: 'Polygon bridge transaction',
        description: 'Send the NFT to the Wormhole bridge',
    },
    {
        name: 'Retrieve receipt from bridge',
        description: 'Retrieve VAA (Verified Action Approval) from Wormhole. This can take between 15 minutes and several hours. You can return later.',
    },
    {
        name: 'Redeem on Solana',
        description: 'Receive the NFT on Solana. It will be sent to a predetermined address.'
    }
]

export default function Step5() {
    const wallet = useWalletSafe();
    const { connection } = useConnection();
    useHoldingContract();

    const {api : solanaAPI} = useSolanaRetirement();
    const bridgeRetirementCert = useBridgeRetirementCert();

    const activeBridgeTransaction = useAppStore(state => state.activeRetirementCertificateBridgeTransaction)
    const updateBridgeTransaction = useAppStore(state => state.updateActiveRetirementCertificateBridgeTransaction)
    const clearBridgeTransaction = useAppStore(state => state.clearActiveRetirementCertificateBridgeTransaction)

    const retirementNFTs = useAppStore(state => state.retirementNFTs)

    const [bridgeEnabled, setBridgeEnabled] = useState(false);
    const [redeemEnabled, setRedeemEnabled] = useState(false);

    useEffect(() => {
        setRedeemEnabled(
            activeBridgeTransaction?.vaaResult !== undefined &&
            activeBridgeTransaction?.solanaTxSignature === undefined
        );
    }, [activeBridgeTransaction?.vaaResult, activeBridgeTransaction?.solanaTxSignature]);

    const setBridgePolygonTransaction = (txHash: string) => {
        updateBridgeTransaction({ polygonTxHash: txHash });
    }

    const setVAAResult = (vaaResult: VAAResult) => {
        updateBridgeTransaction({ vaaResult });
    }

    useEffect(() => {
        setBridgeEnabled(retirementNFTs.length > 0
            && solanaAPI !== undefined
            && (
                !activeBridgeTransaction || (activeBridgeTransaction.solanaTxSignature !== undefined)
            )
        );
    }, [retirementNFTs?.length, solanaAPI, activeBridgeTransaction]);

    const bridgePolygonTxInProgress = (txHash: string) => {
        setBridgePolygonTransaction(txHash);
        toast.info(<div>
            Polygon bridge transaction in progress:{' '} <PolyExplorerLink address={txHash} type="tx"/>
        </div>);
    }

    useEffect(() => {
        if (activeBridgeTransaction && activeBridgeTransaction.polygonTxHash && !activeBridgeTransaction.vaaResult) {
            waitForTransaction({ hash: activeBridgeTransaction.polygonTxHash as `0x${string}`}).then((receipt) => {
                polygonAPI.getVAAFromPolygonTransactionSignature(receipt).then(setVAAResult).catch(getVAAFailed);
            });
        }
    }, [activeBridgeTransaction?.polygonTxHash]);

    const bridgePolygonTxFailed = (error: Error) => {
        toast.error(<div>
            Polygon bridge transaction failed: {error.message}
        </div>);
    }

    const getVAAFailed = (error: Error) => {
        console.log(error);
        toast.error(<div>
            Failed to retrieve information from bridge: {error.message}
        </div>);
    }

    const handleBridge = async () => {
        clearBridgeTransaction();
        if (!bridgeRetirementCert || !bridgeRetirementCert.writeAsync) return;
        bridgeRetirementCert.writeAsync().then(result => bridgePolygonTxInProgress(result.hash))
            .catch(bridgePolygonTxFailed);
    };

    const redeemSuccessful = (txSig: string) => {
        toast.success(<div>
            Redemption successful:{' '}<SolExplorerLink address={txSig} type="tx"/>
        </div>);
    }

    const redeemFailed = (error: Error) => {
        toast.error(<div>
            Redemption failed: {error.message}
        </div>);
    }

    const handleRedeem = async () => {
        if (!activeBridgeTransaction?.vaaResult || activeBridgeTransaction.solanaTxSignature || !solanaAPI) return;

        const [redeemTx, metaTx] = await solanaAPI.redeemVAA(Buffer.from(activeBridgeTransaction.vaaResult.vaaBytes, 'hex'));

        try {
            const redeemTxSig = await wallet.sendTransaction(redeemTx, connection, {skipPreflight: true});
            const metaTxSig = await wallet.sendTransaction(metaTx, connection, {skipPreflight: true});
            updateBridgeTransaction({ solanaTxSignature: redeemTxSig });
            redeemSuccessful(redeemTxSig);
        } catch (error) {
            redeemFailed(error as Error);
        }

    };

    const substeps: Substep[] = [{
        ...substepInfos[0],
        status: !!activeBridgeTransaction?.polygonTxHash ? (bridgeRetirementCert?.isLoading ? 'running' : 'complete') : 'pending',
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
        status: !!activeBridgeTransaction?.solanaTxSignature ? 'complete' : 'pending',
        details: {
            ...(activeBridgeTransaction?.solanaTxSignature ? {txHash: <SolExplorerLink address={activeBridgeTransaction.solanaTxSignature} type="tx"/>} : {})
        }
    }
    ];

    return (<div>
        <h1 className="text-2xl mb-4">Step 5 - Redeem Retirement Certificate</h1>
        <div className="mb-4">NFTs to bridge: {retirementNFTs.length}</div>
        {bridgeRetirementCert?.error && <div className="text-red-500 mb-4">Error: {JSON.stringify(bridgeRetirementCert.error, null, 2)}</div>}
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
        <BridgeSubsteps substeps={substeps}/>
        <div className="flex items-center space-x-2 mt-2">
            <NextButton disabled={ !activeBridgeTransaction?.solanaTxSignature }/>
        </div>
    </div>)
}