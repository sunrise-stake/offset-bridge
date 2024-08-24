import {useSolanaState} from "@/hooks/useSolanaState";
import {useHoldingContractFactory} from "@/hooks/holdingContract/useHoldingContractFactory";
import {Address} from "abitype/src/abi";

// The holding contract address is either a) the address stored in the solana state account if one is set,
// or an address derived via CREATE2 from the current logged-in user if a new solana state account is being created for this user
export const useCurrentHoldingContractAddress = ():Address | undefined => {
    const solanaState = useSolanaState();
    const holdingContractFactory = useHoldingContractFactory();

    // If a solana state account is set, use the holding contract it refers to
    if (solanaState && solanaState.holdingContract) return solanaState.holdingContract as Address;

    // derive it from the current logged-in user
    return holdingContractFactory.contractAddress;
}