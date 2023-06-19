import {DUMMY_PUBLIC_KEY, HOLDING_CONTRACT_ABI} from "@/lib/constants";
import {useContractWrite, usePrepareContractWrite, useWaitForTransaction} from "wagmi";
import {useAppStore} from "@/app/providers";
import {deriveSolanaAddress, solanaAddressToHex} from "@/lib/util";


export const useBridgeRetirementCert = () => {
    const holdingContractTarget = useAppStore(state => state.holdingContractTarget);
    const activeBridgeTransaction = useAppStore(state => state.activeRetirementCertificateBridgeTransaction);
    const retirementNFTs = useAppStore(state => state.retirementNFTs);

    const contract = {
        address: holdingContractTarget,
        abi: HOLDING_CONTRACT_ABI
    } as const;

    const nftToRetire = retirementNFTs.length > 0 ? retirementNFTs[0] : { tokenId: 0, solanaTokenAddress: DUMMY_PUBLIC_KEY };
    const bridgePrepare = usePrepareContractWrite({
        ...contract,
        functionName: 'bridgeToAddress',
        enabled: !!holdingContractTarget && retirementNFTs.length > 0,
        args: [BigInt(nftToRetire.tokenId), solanaAddressToHex(nftToRetire.solanaTokenAddress)]
    })
    const bridge = useContractWrite(bridgePrepare.config)

    const bridgeTransactionHash = bridge.data?.hash || activeBridgeTransaction?.polygonTxHash as `0x${string}`;
    if (!bridgeTransactionHash) return undefined;

    const wait = useWaitForTransaction({hash: bridgeTransactionHash})

    if (!bridge.writeAsync) return undefined;

    return { ...bridge, wait, hash: bridgeTransactionHash }
}