import {NextButton} from "@/components/nextButton";
import {HoldingContractDisplay} from "@/components/holdingContractDisplay";
import {useState} from "react";

export default function Step1() {
    const [ready, setReady] = useState(false);

    return (<div>
        <h1 className="text-2xl mb-4">Step 1 - Create Account</h1>

        <HoldingContractDisplay setReady={setReady}/>
        <div className="flex items-center space-x-2 mt-2">
            <NextButton disabled={ ready }/>
        </div>
    </div>)
}