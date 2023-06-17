import {useContractReads} from 'wagmi'
import { HOLDING_CONTRACT_ABI } from "@/lib/constants";
import {useEffect, useState} from "react";
import {Address} from "abitype/src/abi";
import {useOffset} from "./useOffset";
import {useHoldingContractFactory} from "@/hooks/holdingContract/useHoldingContractFactory";
import {useHoldingContractBalance} from "@/hooks/holdingContract/useHoldingContractBalance";

export const useHoldingContract = () => {
    const [contractAddress, setContractAddress] = useState<Address>();

    const contract = {
        address: contractAddress,
        abi: HOLDING_CONTRACT_ABI
    } as const;

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
        }],
        enabled: !!contractAddress
    });
    const usdcBalance = useHoldingContractBalance(contractAddress);
    const offset = useOffset(contractAddress)
    const factory = useHoldingContractFactory()

    useEffect(() => {
        if (factory?.contractAddress) {
            setContractAddress(factory.contractAddress)
        }
    }, [factory?.contractAddress])

    return {
        reads,
        usdcBalance,
        offset,
        contractAddress,
        beneficiary: reads.data? reads.data[0].result : undefined,
        beneficiaryName: reads.data? reads.data[1].result : undefined,
        solanaAccountAddress: reads.data? reads.data[2].result : undefined,
        owner: reads.data? reads.data[3].result : undefined,
        tco2: reads.data? reads.data[4].result : undefined
    }
}