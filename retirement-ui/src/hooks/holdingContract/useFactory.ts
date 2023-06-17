import {useContractWrite, usePrepareContractWrite} from "wagmi";
import {HOLDING_CONTRACT_FACTORY_ABI, HOLDING_CONTRACT_FACTORY_ADDRESS} from "@/lib/constants";

export const useFactory = () => {
    const { config, error, isError } = usePrepareContractWrite({
        address: HOLDING_CONTRACT_FACTORY_ADDRESS,
        abi: HOLDING_CONTRACT_FACTORY_ABI,
        functionName: 'offset',
        args:[ "Sunrise", "Climate-Positive Staking on Solana" ],
    })
    const offset = useContractWrite(config)

    if (!offset.writeAsync) return undefined;

    return { ...offset, error, isError }
}