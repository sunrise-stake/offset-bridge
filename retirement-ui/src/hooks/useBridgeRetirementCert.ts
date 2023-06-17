import {HOLDING_CONTRACT_ABI, HOLDING_CONTRACT_ADDRESS} from "@/lib/constants";
import {useContractWrite, usePrepareContractWrite, useWaitForTransaction} from "wagmi";

export const useBridgeRetirementCert = () => {
    const { config, error, isError } = usePrepareContractWrite({
        address: HOLDING_CONTRACT_ADDRESS,
        abi: HOLDING_CONTRACT_ABI,
        functionName: 'bridgeNFT',
        args: [1n, "0x1"] // TODO
    })
    const redeem = useContractWrite(config)
    const wait = useWaitForTransaction({hash:redeem.data?.hash})

    if (!redeem.writeAsync) return undefined;

    return { ...redeem, error, isError, wait }
}