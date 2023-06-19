import {USDC_TOKEN_POLYGON} from "@/lib/constants";
import {useBalance} from "wagmi";
import {Address} from "abitype/src/abi";

export const useHoldingContractBalance = (holdingContractAddress: Address | undefined): { balance: bigint | undefined, loading: boolean, error: Error | null }  => {
    const { data, isError, isLoading, error } = useBalance({
        address: holdingContractAddress,
        token: USDC_TOKEN_POLYGON,
        watch: true,
        enabled: !!holdingContractAddress
    })

    return {
        balance: data?.value,
        loading: isLoading,
        error
    }
}