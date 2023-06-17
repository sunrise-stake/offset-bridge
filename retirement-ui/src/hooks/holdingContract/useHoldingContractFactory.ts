import {useAccount, useContractRead, useContractWrite, usePrepareContractWrite} from "wagmi";
import {
    DEFAULT_BENEFICIARY,
    DEFAULT_RETIREMENT_PROJECT,
    HOLDING_CONTRACT_FACTORY_ABI,
    HOLDING_CONTRACT_FACTORY_ADDRESS,
    HOLDING_CONTRACT_FACTORY_SALT, RETIREMENT_CONTRACT
} from "@/lib/constants";
import {solanaAddressToHex} from "@/lib/util";
import {PublicKey} from "@solana/web3.js";
import {useMemo} from "react";

const dummySolanaAddress = solanaAddressToHex(
    new PublicKey("11111111111111111111111111111111")
);

const contract = {
    address: HOLDING_CONTRACT_FACTORY_ADDRESS,
    abi: HOLDING_CONTRACT_FACTORY_ABI,
}

export const useHoldingContractFactory = (retirementProject = DEFAULT_RETIREMENT_PROJECT, beneficiary = DEFAULT_BENEFICIARY) => {
    const { address } = useAccount();
    const { config, error, isError } = usePrepareContractWrite({
        ...contract,
        functionName: 'createContract',
        args:[ HOLDING_CONTRACT_FACTORY_SALT, retirementProject, beneficiary, dummySolanaAddress, RETIREMENT_CONTRACT ],
    })
    const deploy = useContractWrite(config)

    const read = useContractRead({
        ...contract,
        functionName: 'getContractAddress',
        enabled: !!address,
        args: [ HOLDING_CONTRACT_FACTORY_SALT, address || "0x0"],
    });

    const contractAddress = useMemo(() =>
        read.data? read.data : undefined
    , [read.data]);

    if (!deploy.writeAsync) return undefined;

    return { ...deploy, contractAddress, error, isError }
}