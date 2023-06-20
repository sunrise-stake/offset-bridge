import {useContractWrite, usePrepareContractWrite} from "wagmi";
import {Address} from "abitype/src/abi";
import {HOLDING_CONTRACT_ABI} from "@/lib/abi/holdingContract";

export const useOffset = (contractAddress: Address | undefined) => {
    const { config, error, isError } = usePrepareContractWrite({
        address: contractAddress,
        abi: HOLDING_CONTRACT_ABI,
        functionName: 'offset',
        enabled: !!contractAddress,
        args:[ "Sunrise", "Climate-Positive Staking on Solana" ],
    })
    const offset = useContractWrite(config)

    if (!offset.writeAsync) return undefined;

    return { ...offset, error, isError }
}