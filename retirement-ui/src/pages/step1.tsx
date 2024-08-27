import {NextButton} from "@/components/nextButton";
import {HoldingContractDisplay} from "@/components/holdingContractDisplay";
import {useEffect, useMemo, useState} from "react";
import {SolanaStateManager} from "@/components/solanaStateManager";
import {useSolanaRetirement} from "@/context/solanaRetirementContext";
import {useHoldingContract} from "@/hooks/holdingContract/useHoldingContract";

export default function Step1() {
    const { api } = useSolanaRetirement();
    const holdingContract = useHoldingContract();
    const [holdingContractUpdateReady, setHoldingContractUpdateReady] = useState(false);

    const ready = useMemo(() => {
        console.log("Step1: ready", api?.ready, holdingContract?.tco2, holdingContractUpdateReady);
        const solanaState = api?.state;
        const holdingContractDeployed = !!holdingContract?.tco2;
        return api?.ready && solanaState && holdingContractDeployed && holdingContractUpdateReady;
    }, [api?.state, holdingContract?.tco2, holdingContractUpdateReady])

    return (<div>
        <h1 className="text-2xl mb-4">Step 1 - Select Retirement Project</h1>
        <HoldingContractDisplay setReady={setHoldingContractUpdateReady}/>
        <SolanaStateManager/>
        <div className="flex items-center space-x-2 mt-2">
            <NextButton disabled={ !ready }/>
        </div>
    </div>)
}