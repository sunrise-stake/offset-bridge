import {NextButton} from "@/components/nextButton";
import {HoldingContractDisplay} from "@/components/holdingContractDisplay";
import {useState} from "react";
import { StateSelector } from "@/components/stateSelector";

export default function Step1() {
    const [ready, setReady] = useState(false);

    return (<div>
        <h1 className="text-2xl mb-4">Step 1 - Select Account</h1>
        <StateSelector/>
        <HoldingContractDisplay setReady={setReady}/>
        <div className="flex items-center space-x-2 mt-2">
            <NextButton disabled={ !ready }/>
        </div>
    </div>)
}