import {NextButton} from "@/components/nextButton";
import {useAppStore} from "@/app/providers";
import {useEffect, useState} from "react";
import {PublicKey} from "@solana/web3.js";
import {useSolanaRetirement} from "@/context/solanaRetirementContext";
import {useSolanaNFT} from "@/hooks/useSolanaNFT";

export default function Step6() {
    const activeBridgeTransaction = useAppStore(state => state.activeRetirementCertificateBridgeTransaction)
    const {api : solanaAPI} = useSolanaRetirement();

    const [mintAddress, setMintAddress] = useState<PublicKey>();
    const asset = useSolanaNFT(mintAddress);

    useEffect(() => {
        if (!!solanaAPI && !!activeBridgeTransaction?.solanaTxSignature) {
            const txSig = activeBridgeTransaction.solanaTxSignature;
            solanaAPI.getMintAddressFromTransaction(txSig).then(setMintAddress)
        }
    }, [solanaAPI, activeBridgeTransaction?.solanaTxSignature]);

    return (<div>
        <h1 className="text-2xl mb-4">Step 6 - Retirement Certificate</h1>
        { mintAddress?.toBase58() }
        {asset && <div className="flex flex-col space-y-2">
            <a href={asset.uri} target="_blank" rel="noreferrer" className="text-blue-500 hover:text-blue-700 hover:underline cursor-pointer">
                {asset.name}
            </a>
        </div>}
        <div className="flex items-center space-x-2 mt-2">
            <NextButton disabled={ false }/>
        </div>
    </div>)
}