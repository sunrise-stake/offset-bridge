import {useBalance, useContractReads} from 'wagmi'
import {HOLDING_CONTRACT_ABI, HOLDING_CONTRACT_ADDRESS, USDC_TOKEN_POLYGON} from "@/lib/constants";
import {useState} from "react";
import {Address} from "abitype/src/abi";
import {useOffset} from "./useOffset";

const contract = {
    address: HOLDING_CONTRACT_ADDRESS,
    abi: HOLDING_CONTRACT_ABI
} as const;

export const useHoldingContract = () => {
    const [contractAddress, setContractAddress] = useState<Address>();
    const reads = useContractReads({
        contracts: [{
            ...contract,
            functionName: 'beneficiary'
        }, {
            ...contract,
            functionName: 'beneficiaryName'
        }, {
            ...contract,
            functionName: 'SolanaAccountAddress'
        }, {
            ...contract,
            functionName: 'owner'
        }, {
            ...contract,
            functionName: 'tco2'
        }]
    });
    const usdcBalance = useBalance({
        address: contractAddress,
        token: USDC_TOKEN_POLYGON,
        watch: true
    })
    const offset = useOffset(contractAddress)


    return {
        reads,
        usdcBalance,
        offset,
        beneficiary: reads.data? reads.data[0].result : undefined,
        beneficiaryName: reads.data? reads.data[1].result : undefined,
        solanaAccountAddress: reads.data? reads.data[2].result : undefined,
        owner: reads.data? reads.data[3].result : undefined,
        tco2: reads.data? reads.data[4].result : undefined
    }
}