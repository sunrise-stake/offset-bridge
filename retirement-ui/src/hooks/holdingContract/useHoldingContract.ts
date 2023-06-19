import {useContractReads} from 'wagmi'
import { HOLDING_CONTRACT_ABI } from "@/lib/constants";
import {useEffect, useState} from "react";
import {Address} from "abitype/src/abi";
import {useOffset} from "./useOffset";
import {useHoldingContractFactory} from "@/hooks/holdingContract/useHoldingContractFactory";
import {useHoldingContractBalance} from "@/hooks/holdingContract/useHoldingContractBalance";
import {useAppStore} from "@/app/providers";
import {useToucan} from "@/hooks/useToucan";
import {tokenIDsToRetirementNFTs} from "@/lib/util";
import {useWallet} from "@solana/wallet-adapter-react";
import {useWalletSafe} from "@/hooks/useWalletSafe";

export const useHoldingContract = () => {
    const holdingContractTarget = useAppStore(state => state.holdingContractTarget);
    const setHoldingContractTarget = useAppStore(state => state.setHoldingContractTarget);

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
    const offset = useOffset(holdingContractTarget)
    const factory = useHoldingContractFactory();
    const solRecipient = useWalletSafe();
    const { fetchRetirementNFTs } = useToucan();

    useEffect(() => {
        if (!holdingContractTarget) return;
        fetchRetirementNFTs(holdingContractTarget)
            .then(tokenIDsToRetirementNFTs(solRecipient.publicKey))
            .then(setRetirementNFTs)
    }, [holdingContractTarget, offset?.isSuccess]);

    useEffect(() => {
        if (factory?.contractAddress) {
            setHoldingContractTarget(factory.contractAddress)
        }
    }, [factory?.contractAddress])

    return {
        reads,
        usdcBalance,
        offset,
        contractAddress: holdingContractTarget,
        beneficiary: reads.data? reads.data[0].result : undefined,
        beneficiaryName: reads.data? reads.data[1].result : undefined,
        solanaAccountAddress: reads.data? reads.data[2].result : undefined,
        owner: reads.data? reads.data[3].result : undefined,
        tco2: reads.data? reads.data[4].result : undefined
    }
}