import {FC, useEffect, useState} from "react";
import {useAppStore} from "@/app/providers";
import {steps} from "@/components/stepBar";

export const NextButton: FC<{disabled?: boolean}> = ({ disabled = false}) => {
    const currentStep = useAppStore(state => state.step)
    const isLastStep = currentStep === steps.length;
    const [disabledNext, setDisabledNext] = useState(false);

    useEffect(() => {
        setDisabledNext(disabled || isLastStep)
    }, [disabled, isLastStep]);

    const nextStep = () => {
        if (currentStep < steps.length) {
            useAppStore.setState({step: currentStep + 1})
        }
    }

    return <button
        className="btn btn-primary w-32"
        disabled={disabledNext}
        onClick={nextStep}
    >
        Next
    </button>
}