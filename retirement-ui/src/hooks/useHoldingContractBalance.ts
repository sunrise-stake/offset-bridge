import {useState} from "react";
import {PublicKey} from "@solana/web3.js";
import {HOLDING_CONTRACT_ADDRESS, USDC_TOKEN_POLYGON} from "@/lib/constants";
import {useBalance} from "wagmi";

export const useHoldingContractBalance = (): { balance: bigint | undefined, loading: boolean, error: Error | null }  => {
    const { data, isError, isLoading, error } = useBalance({
        address: HOLDING_CONTRACT_ADDRESS,
        token: USDC_TOKEN_POLYGON,
        watch: true
    })

    return {
        balance: data?.value,
        loading: isLoading,
        error
    }
}