import {useContractWrite, usePrepareContractWrite} from "wagmi";
import {HOLDING_CONTRACT_ABI} from "@/lib/abi/holdingContract";
import {useAppStore} from "@/app/providers";

export const useOffset = () => {
    const holdingContractTarget = useAppStore(state => state.holdingContractTarget);
    const { config, error, isError } = usePrepareContractWrite({
        address: holdingContractTarget,
        abi: HOLDING_CONTRACT_ABI,
        functionName: 'offset',
        enabled: !!holdingContractTarget,
        args:[ "Sunrise", "Climate-Positive Staking on Solana" ],
    })
    const offset = useContractWrite(config)

    if (!offset.writeAsync) return undefined;

    return { ...offset, error, isError }
}