import {NextButton} from "@/components/nextButton";
import {HoldingContractDisplay} from "@/components/holdingContractDisplay";
import {useEffect, useState} from "react";
import { SolanaStateSelector } from "@/components/solanaStateSelector";
import {SolanaStateManager} from "@/components/solanaStateManager";
import {useSolanaRetirement} from "@/context/solanaRetirementContext";

export default function Step1() {
    const [ready, setReady] = useState(false);
    const { api } = useSolanaRetirement();

    useEffect(() => {
        // step 1 is ready as soon as there is a populated solana state
        // To get to that state, we need:
        // 1. the user to have selected either their own or existing solana state (admin mode)
        // 2. the user to have selected a holding contract for their state
        // 3. the state and holding contract combination to have been registered on solana if not already
        setReady(!!api?.ready);
    }, [api?.ready]);

    return (<div>
        <h1 className="text-2xl mb-4">Step 1 - Select Account</h1>
        <SolanaStateManager/>
        <HoldingContractDisplay setReady={() => {
            // TODO remove once no longer needed
        }}/>
        <div className="flex items-center space-x-2 mt-2">
            <NextButton disabled={ !ready }/>
        </div>
    </div>)
}