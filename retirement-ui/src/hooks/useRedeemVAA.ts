import {POLYGON_TOKEN_BRIDGE_ADDRESS} from "@/lib/constants";
import {useContractWrite, usePrepareContractWrite} from "wagmi";
import {WORMHOLE_BRIDGE_ABI} from "@/lib/abi/wormholeBridge";

export const useRedeemVAA = (vaaBytes: string | undefined ) => {
    const { config, error, isError } = usePrepareContractWrite({
        address: POLYGON_TOKEN_BRIDGE_ADDRESS,
        abi: WORMHOLE_BRIDGE_ABI,
        functionName: 'completeTransfer',
        enabled: !!vaaBytes,
        args:[ vaaBytes ? `0x${vaaBytes}` : '0x' ]
    })
    const redeem = useContractWrite(config)

    if (!redeem.writeAsync) return undefined;

    return { ...redeem, error, isError }
}