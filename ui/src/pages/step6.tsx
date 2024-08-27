import {NextButton} from "@/components/nextButton";
import {useAppStore} from "@/app/providers";
import {useEffect, useState} from "react";
import {PublicKey} from "@solana/web3.js";
import {useSolanaRetirement} from "@/context/solanaRetirementContext";
import {useSolanaNFT} from "@/hooks/useSolanaNFT";
import {useHoldingContract} from "@/hooks/holdingContract/useHoldingContract";

export default function Step6() {
    const [activeBridgeTransaction, clearBridgeTransaction] = useAppStore(state => [
        state.activeRetirementCertificateBridgeTransaction,
        state.clearActiveRetirementCertificateBridgeTransaction
    ])
    const {api : solanaAPI} = useSolanaRetirement();
    // if the holding contract is not set up in the state, this hook will attempt to populate it
    useHoldingContract();

    // clear the bridge transaction details, so we can start again (only if the bridging is complete)
    useEffect(() => {
        if (activeBridgeTransaction?.solanaTxSignature) {
            clearBridgeTransaction();
        }
    }, [activeBridgeTransaction?.solanaTxSignature]);

    const assets = useSolanaNFT();

    return (<div>
        <h1 className="text-2xl mb-4">Step 6 - Retirement Certificate</h1>
        { assets.map(asset =>
            <div className="flex flex-col space-y-2" key={asset.address.toBase58()}>
                <a href={asset.uri} target="_blank" rel="noreferrer" className="text-blue-500 hover:text-blue-700 hover:underline cursor-pointer">
                    {asset.name}
                </a>
            </div>
        )}
        <div className="flex items-center space-x-2 mt-2">
            <NextButton disabled={ false }/>
        </div>
    </div>)
}