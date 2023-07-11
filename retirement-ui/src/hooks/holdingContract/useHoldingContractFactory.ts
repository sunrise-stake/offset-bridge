import {useAccount, useContractRead, useContractWrite, usePrepareContractWrite, usePublicClient} from "wagmi";
import {
    DEFAULT_BENEFICIARY,
    DEFAULT_RETIREMENT_PROJECT,
    HOLDING_CONTRACT_FACTORY_ADDRESS,
    holdingContractFactorySalt, RETIREMENT_CONTRACT
} from "@/lib/constants";
import {solanaAddressToHex} from "@/lib/util";
import {PublicKey} from "@solana/web3.js";
import {useEffect, useState} from "react";
import {Address} from "abitype/src/abi";
import {HOLDING_CONTRACT_FACTORY_ABI} from "@/lib/abi/holdingContractFactory";

const dummySolanaAddress = solanaAddressToHex(
    new PublicKey("11111111111111111111111111111111")
);

const contract = {
    address: HOLDING_CONTRACT_FACTORY_ADDRESS,
    abi: HOLDING_CONTRACT_FACTORY_ABI,
}

export const useHoldingContractFactory = (retirementProject = DEFAULT_RETIREMENT_PROJECT, beneficiary = DEFAULT_BENEFICIARY) => {
    const { address } = useAccount();
    const publicClient = usePublicClient();
    const [contractAddress, setContractAddress] = useState<Address>();

    const salt = holdingContractFactorySalt(address || '0x');
    const read = useContractRead({
        ...contract,
        functionName: 'getContractAddress',
        enabled: !!address,
        args: [ salt, HOLDING_CONTRACT_FACTORY_ADDRESS],
    });

    const { config, error, isError } = usePrepareContractWrite({
        ...contract,
        enabled: contractAddress === undefined,
        functionName: 'createContract',
        args:[ salt, retirementProject, beneficiary, dummySolanaAddress, RETIREMENT_CONTRACT ],
    })
    const deploy = useContractWrite(config)

    useEffect(() => {
            const holdingContractAddress = read.data ? read.data : undefined;
            console.log('holdingContractAddress', holdingContractAddress)
            if (!holdingContractAddress) return;
            publicClient.getBytecode({address: holdingContractAddress}).then((bytecode) => {
                if (!bytecode || bytecode === '0x') {
                    setContractAddress(undefined)
                } else {
                    setContractAddress(holdingContractAddress);
                }
            });
        }
        , [read.data, deploy.data]);

    const create = () => {
        console.log('create', {deploy, read, config});
        if (!deploy.writeAsync) return Promise.resolve();
        return deploy.writeAsync();
    }

    return { ...deploy, contractAddress, create, error, isError }
}