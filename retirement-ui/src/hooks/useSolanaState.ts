import {SolanaStateAccount} from "@/lib/types";
import {useSolanaRetirement} from "@/context/solanaRetirementContext";
import {useEffect, useState} from "react";

// return the current solana state if one is selected
export const useSolanaState = ():SolanaStateAccount | undefined => {
    const [solanaState, setSolanaState] = useState<SolanaStateAccount>()
    const { api } = useSolanaRetirement();

    // reload the state whenever the state address changes
    useEffect(() => {
        if (api?.stateAddress) api?.getState().then(setSolanaState);
    }, [api?.stateAddress.toBase58()])

    return solanaState;
}