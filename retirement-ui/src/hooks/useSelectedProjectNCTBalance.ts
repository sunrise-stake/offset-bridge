import {useHoldingContract} from "@/hooks/holdingContract/useHoldingContract";
import {BigNumber} from "ethers";
import {ERC20_ABI} from "@/lib/abi/erc20";
import {useContractReads} from "wagmi";
import {Address} from "abitype/src/abi";

const NCT_POOL_ADDRESS = "0xD838290e877E0188a4A44700463419ED96c16107";

export const useSelectedProjectNCTBalance = (project: Address | undefined): number | undefined => {
    const { tco2 } = useHoldingContract();
    const tco2Address = project ?? tco2;
    const contract = {
        address: tco2Address as Address,
        abi: ERC20_ABI
    } as const;
    const reads = useContractReads({
        contracts: [{
            ...contract,
            functionName: 'balanceOf',
            args: [NCT_POOL_ADDRESS]
        }, {
        ...contract,
        functionName: 'decimals'
    }],
        enabled: !!tco2,
    });

    if (!reads.data) return undefined;

    const balance = BigNumber.from(reads.data[0].result)
    const decimals = BigNumber.from(reads.data[1].result);
    const balanceHuman = balance.div(BigNumber.from(10).pow(decimals)).toNumber();
    console.log("Available to retire va NCT:", balanceHuman);
    return balanceHuman;
}