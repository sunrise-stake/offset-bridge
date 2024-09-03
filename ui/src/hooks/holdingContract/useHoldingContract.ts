import {useContractReads} from 'wagmi'
import {useCallback, useEffect} from "react";
import {Address} from "abitype/src/abi";
import {useOffset} from "./useOffset";
import {useHoldingContractFactory} from "@/hooks/holdingContract/useHoldingContractFactory";
import {useHoldingContractBalance} from "@/hooks/holdingContract/useHoldingContractBalance";
import {useAppStore} from "@/app/providers";
import {useToucan} from "@/hooks/useToucan";
import {tokenIDsToRetirementNFTs} from "@/lib/util";
import {useWalletSafe} from "@/hooks/useWalletSafe";
import {prepareWriteContract, writeContract} from "@wagmi/core";
import {HOLDING_CONTRACT_ABI} from "@/lib/abi/holdingContract";
import {useCurrentHoldingContractAddress} from "@/hooks/holdingContract/useCurrentHoldingContractAddress";

export const useHoldingContract = () => {
    const holdingContract = useCurrentHoldingContractAddress();
    const holdingContractTarget = useAppStore(state => state.holdingContractTarget);
    const setHoldingContractTarget = useAppStore(state => state.setHoldingContractTarget);
    const clearHoldingContractTarget = useAppStore(state => state.clearHoldingContractTarget);

    const setRetirementNFTs = useAppStore(state => state.setRetirementNFTs);

    const contract = {
        address: holdingContractTarget,
        enabled: !!holdingContractTarget,
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
        enabled: !!holdingContractTarget
    });
    const usdcBalance = useHoldingContractBalance(holdingContractTarget);
    const offset = useOffset()
    const factory = useHoldingContractFactory();
    const solRecipient = useWalletSafe();
    const { fetchRetirementNFTs } = useToucan();

    // Address to send retirement NFT specified here
    useEffect(() => {
        if (!holdingContractTarget) return;
        fetchRetirementNFTs(holdingContractTarget)
            .then(tokenIDsToRetirementNFTs(solRecipient.publicKey))
            .then(setRetirementNFTs)
    }, [holdingContractTarget, offset?.isSuccess]);

    // The contractAddress parameter set to be the address of holding contract in the factory lines 48-57 of useHoldingContractFactory.ts
    useEffect(() => {
        if (holdingContract) {
            setHoldingContractTarget(holdingContract)
        } else if (!holdingContract && !factory.isError) {
            clearHoldingContractTarget()
        }
    // The "contractAddress" in this hook is basically the address of the user's holding contract
    }, [factory?.contractAddress])

    const updateTCO2 = useCallback(async (tco2: Address) => {
        if (!holdingContractTarget) return;
        const config = await prepareWriteContract({
            address: holdingContractTarget,
            abi: HOLDING_CONTRACT_ABI,
            functionName: 'setTCO2',
            args: [ tco2 ],
        })
        return writeContract(config.request)
    }, [holdingContractTarget]);

    console.log("Holding Contract:", reads.data);

    return {
        reads,
        usdcBalance,
        offset,
        updateTCO2,
        contractAddress: holdingContractTarget,
        beneficiary: reads.data? reads.data[0].result : undefined,
        beneficiaryName: reads.data? reads.data[1].result : undefined,
        solanaAccountAddress: reads.data? reads.data[2].result : undefined,
        owner: reads.data? reads.data[3].result : undefined,
        tco2: reads.data? reads.data[4].result : undefined
    }
}