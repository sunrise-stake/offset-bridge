import {DUMMY_PUBLIC_KEY} from "@/lib/constants";
import {useContractWrite, usePrepareContractWrite, useWaitForTransaction} from "wagmi";
import {useAppStore} from "@/app/providers";
import {deriveSolanaAddress, solanaAddressToHex} from "@/lib/util";
import {HOLDING_CONTRACT_ABI} from "@/lib/abi/holdingContract";
import {PublicKey} from "@solana/web3.js";


export const useBridgeRetirementCert = () => {
    const holdingContractTarget = useAppStore(state => state.holdingContractTarget);
    const activeBridgeTransaction = useAppStore(state => state.activeRetirementCertificateBridgeTransaction);
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
    const bridge = useContractWrite(bridgePrepare.config)

    const bridgeTransactionHash = bridge.data?.hash || activeBridgeTransaction?.polygonTxHash as `0x${string}`;

    const wait = useWaitForTransaction({hash: bridgeTransactionHash})

    if (!bridge.writeAsync) return undefined;

    return { ...bridge, wait, hash: bridgeTransactionHash }
}