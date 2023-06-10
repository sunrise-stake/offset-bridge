import {FC} from "react";
import {FaCheckCircle, FaHourglassHalf, FaRocket} from "react-icons/fa";
import clsx from "clsx";
import {useAppStore} from "@/app/providers";

const Icon: FC<{step: number, currentStep: number}> = ({step, currentStep}) => {
    if (step < currentStep) return <FaCheckCircle className="text-blue-600 mr-2 mt-1"/>;
    if (step === currentStep) return <FaRocket className="text-blue-600 mr-2 mt-1"/>;
    return <FaHourglassHalf className="text-blue-600 mr-2 mt-1"/>;
}

const Step:FC<{step: number, text: string}> = ({step, text}) => {
    const currentStep = useAppStore(state => state.step)
    const isCurrentStep = step === currentStep;

    return (
        <li className={clsx("flex items-center", { "bg-blue-300 text-white" : isCurrentStep})}>
            <a onClick={() => useAppStore.setState({step})} href="#" className="flex">
                <Icon step={step} currentStep={currentStep} />
                <span>{text}</span>
            </a>
        </li>
    );
}

export const steps = [ "Deposit", "Bridge", "Retire", "Redeem"];

export const StepBar:FC = () => {
    return (
        <aside className="w-64 mr-4 bg-blue-100 p-4 rounded-lg shadow-lg">
            <ul className="space-y-4">
                {
                    steps.map((text, index) => (
                        <Step key={index} step={index + 1} text={text}/>
                    ))
                }
            </ul>
        </aside>
    );
}