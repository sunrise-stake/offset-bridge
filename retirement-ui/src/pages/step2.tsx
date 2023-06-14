import {useEffect, useState} from "react";
import {TokenBalance} from "@/components/tokenBalance";
import {useSolanaRetirement} from "@/context/solanaRetirementContext";
import {NextButton} from "@/components/nextButton";
import {useWalletSafe} from "@/hooks/useWalletSafe";
import {useConnection} from "@solana/wallet-adapter-react";
import {useSolanaTokenBalance} from "@/hooks/useSolanaTokenBalance";
import {tokenAuthority} from "@/lib/util";
import {toast} from "react-toastify";
import {SolExplorerLink} from "@/components/solExplorerLink";
import {
    BRIDGE_INPUT_MINT_ADDRESS,
    BRIDGE_INPUT_MINT_DECIMALS,
} from "@/lib/constants";
import {useAppStore} from "@/app/providers";
import {useRedeemVAA} from "@/hooks/useRedeemVAA";
import {useAccount} from "wagmi";
import {ConnectButton} from "@rainbow-me/rainbowkit";
import {VAAResult} from "@/api/solanaRetirement";
import {PolyExplorerLink} from "@/components/polyExplorerLink";
import {WormholeLink} from "@/components/wormholeLink";
import {BridgeSubsteps, Substep, SubstepInfo} from "@/components/bridgeSubsteps";

const bridgeInputTokenMint = BRIDGE_INPUT_MINT_ADDRESS;
const bridgeInputTokenDecimals = BRIDGE_INPUT_MINT_DECIMALS;

const substepInfos: SubstepInfo[] = [
    {
        name: 'Solana bridge transaction',
        description: 'Send USDC to the Wormhole bridge',
    },
    {
        name: 'Retrieve receipt from bridge',
        description: 'Retrieve VAA (Verified Action Approval) from Wormhole. This can take up to five minutes.',
    },
    {
        name: 'Redeem on Polygon',
        description: 'Receive the USDC on Polygon. It will be deposited into a holding contract.'
    }
]

export default function Step2() {
    const wallet = useWalletSafe();
    const { connection } = useConnection();
    const { address } = useAccount();
    const bridgeInputBalance = useSolanaTokenBalance(bridgeInputTokenMint, tokenAuthority);
    const {api : solanaAPI} = useSolanaRetirement();
    const activeBridgeTransaction = useAppStore(state => state.activeUSDCBridgeTransaction)
    const updateBridgeTransaction = useAppStore(state => state.updateActiveUSDCBridgeTransaction)
    const redeemVAA = useRedeemVAA(activeBridgeTransaction?.vaaResult?.vaaBytes);

    const [bridgeEnabled, setBridgeEnabled] = useState(false);
    const [redeemEnabled, setRedeemEnabled] = useState(false);

    useEffect(() => {
        setRedeemEnabled(
            activeBridgeTransaction?.vaaResult !== undefined &&
            activeBridgeTransaction?.polygonTxHash === undefined &&
            address !== undefined
        );
    }, [activeBridgeTransaction]);

    const setBridgeSolanaTransaction = (txSig: string) => {
        updateBridgeTransaction({ solanaTxSignature: txSig });
    }

    const setBridgePolygonTransaction = (txHash: string) => {
        updateBridgeTransaction({ polygonTxHash: txHash });
    }

    const setVAAResult = (vaaResult: VAAResult) => {
        updateBridgeTransaction({ vaaResult });
    }

    useEffect(() => {
        setBridgeEnabled(solanaAPI !== undefined && !activeBridgeTransaction && bridgeInputBalance !== undefined && Number(bridgeInputBalance) > 0);

        if (activeBridgeTransaction && activeBridgeTransaction.solanaTxSignature && !activeBridgeTransaction.vaaResult) {
            solanaAPI?.getVAAFromSolanaTransactionSignature(activeBridgeTransaction.solanaTxSignature).then(setVAAResult).catch(getVAAFailed);
        }
    }, [bridgeInputBalance, solanaAPI]);

    const bridgeSolanaTxSuccessful = (txSig: string) => {
        setBridgeSolanaTransaction(txSig);
        toast.success(<div>
            Solana bridge transaction successful:{' '}<SolExplorerLink address={txSig} type="tx"/>
        </div>);

        setTimeout(() => {
            solanaAPI?.getVAAFromSolanaTransactionSignature(txSig).then(setVAAResult).catch(getVAAFailed);
        }, 5000);
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

    // handle polygon bridge success
    useEffect(() => {
        if (redeemVAA?.isSuccess) {
            toast.success(<div>
                Polygon bridge transaction successful:{' '}<PolyExplorerLink address={redeemVAA.data?.hash || ''} type="tx"/>
            </div>);
        }
    }, [redeemVAA?.isSuccess]);

    const bridgePolygonTxFailed = (error: Error) => {
        toast.error(<div>
            Polygon bridge transaction failed: {error.message}
        </div>);
    }

    const handleBridge = async () => {
        if (!solanaAPI || !bridgeInputBalance) return;
        const {tx, messageKey } = await solanaAPI.bridge(bridgeInputBalance);
        return wallet.sendTransaction(tx, connection, { signers: [messageKey]}).then(bridgeSolanaTxSuccessful).catch(bridgeSolanaTxFailed);
    };

    const handleRedeem = async () => {
        if (!redeemVAA || !redeemVAA.writeAsync || !activeBridgeTransaction?.vaaResult) return;
        redeemVAA.writeAsync().then(result => setBridgePolygonTransaction(result.hash))
            .catch(bridgePolygonTxFailed);
    };

    const substeps: Substep[] = [{
        ...substepInfos[0],
        status: !!activeBridgeTransaction?.solanaTxSignature ? 'complete' : 'pending',
        details: {
            ...(activeBridgeTransaction?.solanaTxSignature ? {txSig: <SolExplorerLink address={activeBridgeTransaction.solanaTxSignature} type="tx"/>} : {})
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
        status: !!activeBridgeTransaction?.polygonTxHash ? (redeemVAA?.isLoading ? 'running' : 'complete') : 'pending',
        details: {
            ...(activeBridgeTransaction?.polygonTxHash ? {txHash: <PolyExplorerLink address={activeBridgeTransaction.polygonTxHash} type="tx"/>} : {})
        }
    }
    ];

    return (<div>
        <h1 className="text-2xl mb-4">Step 2 - Bridge</h1>
        <div className="mb-2">Balance to bridge:  $<TokenBalance balance={bridgeInputBalance} decimals={bridgeInputTokenDecimals}/></div>
        <div className="flex items-center space-x-2 mb-2">
            <button
                className="btn btn-primary w-32"
                disabled={!bridgeEnabled}
                onClick={handleBridge}
            >
                Bridge
            </button>
            <button
                className="btn btn-primary w-32"
                disabled={!redeemEnabled}
                onClick={handleRedeem}
            >
                Redeem
            </button>
            <ConnectButton/>
        </div>
        <BridgeSubsteps substeps={substeps}/>
        <div className="flex items-center mt-2 space-x-2">
            <NextButton disabled={ !activeBridgeTransaction?.polygonTxHash }/>
        </div>
    </div>)
}