import {NextButton} from "@/components/nextButton";
import {useHoldingContractFactory} from "@/hooks/holdingContract/useHoldingContractFactory";
import {HoldingContractDisplay} from "@/components/holdingContractDisplay";

export default function Step1() {
    const factory = useHoldingContractFactory();


    return (<div>
        <h1 className="text-2xl mb-4">Step 1 - Create Account</h1>

        <HoldingContractDisplay />
        <div className="flex items-center space-x-2 mt-2">
            <NextButton disabled={ !factory || factory.contractAddress === undefined }/>
        </div>
    </div>)
}