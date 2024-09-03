import {DUMMY_PUBLIC_KEY} from "@/lib/constants";
import {useContractWrite, usePrepareContractWrite} from "wagmi";
import {useAppStore} from "@/app/providers";
import {solanaAddressToHex} from "@/lib/util";
import {HOLDING_CONTRACT_ABI} from "@/lib/abi/holdingContract";
import {PublicKey} from "@solana/web3.js";


export const useBridgeRetirementCert = () => {
    const holdingContractTarget = useAppStore(state => state.holdingContractTarget);
    const retirementNFTs = useAppStore(state => state.retirementNFTs);

    const contract = {
        address: holdingContractTarget,
        abi: HOLDING_CONTRACT_ABI
    } as const;

    const nftToRetire = retirementNFTs.length > 0 ? retirementNFTs[0] : { tokenId: 0, solanaTokenAddress: DUMMY_PUBLIC_KEY.toString() };

    const bridgePrepare = usePrepareContractWrite({
        ...contract,
        functionName: 'bridgeToAddress',
        enabled: !!holdingContractTarget && retirementNFTs.length > 0,
        args: [BigInt(nftToRetire.tokenId), solanaAddressToHex(new PublicKey(nftToRetire.solanaTokenAddress))]
    })

    return useContractWrite(bridgePrepare.config)
}