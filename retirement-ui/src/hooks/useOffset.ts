import {HOLDING_CONTRACT_ABI, HOLDING_CONTRACT_ADDRESS} from "@/lib/constants";
import {useContractWrite, usePrepareContractWrite} from "wagmi";

export const useOffset = () => {
    const { config, error, isError } = usePrepareContractWrite({
        address: HOLDING_CONTRACT_ADDRESS,
        abi: HOLDING_CONTRACT_ABI,
        functionName: 'offset',
        args:[ "Sunrise", "Climate-Positive Staking on Solana" ],
    })
    const redeem = useContractWrite(config)

    if (!redeem.writeAsync) return undefined;

    return { ...redeem, error, isError }
}