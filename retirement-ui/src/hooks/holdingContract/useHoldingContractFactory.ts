import {useAccount, useContractRead, useContractWrite, usePrepareContractWrite, usePublicClient} from "wagmi";
import {
    DEFAULT_BENEFICIARY,
    DEFAULT_RETIREMENT_PROJECT,
    HOLDING_CONTRACT_FACTORY_ADDRESS,
    HOLDING_CONTRACT_FACTORY_SALT, RETIREMENT_CONTRACT
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
    const read = useContractRead({
        ...contract,
        functionName: 'getContractAddress',
        enabled: !!address,
        args: [ HOLDING_CONTRACT_FACTORY_SALT, HOLDING_CONTRACT_FACTORY_ADDRESS],
    });

    const { config, error, isError } = usePrepareContractWrite({
        ...contract,
        enabled: read.isFetched && read.data === undefined,
        functionName: 'createContract',
        args:[ HOLDING_CONTRACT_FACTORY_SALT, retirementProject, beneficiary, dummySolanaAddress, RETIREMENT_CONTRACT ],
    })
    const deploy = useContractWrite(config)

    useEffect(() => {
            const address = read.data ? read.data : undefined;
            if (!address) return;
            publicClient.getBytecode({address}).then((bytecode) => {
                if (!bytecode || bytecode === '0x') return;
                setContractAddress(address);
            });
        }
        , [read.data]);

    const create = () => {
        if (!deploy.writeAsync) return Promise.resolve();
        return deploy.writeAsync();
    }

    return { ...deploy, contractAddress, create, error, isError }
}