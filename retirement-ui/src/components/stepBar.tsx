import {FC} from "react";
import {FaCheckCircle, FaHourglassHalf, FaRocket} from "react-icons/fa";
import clsx from "clsx";
import {useAppStore} from "@/app/providers";

const Icon: FC<{step: number, currentStep: number}> = ({step, currentStep}) => {
    if (step < currentStep) return <FaCheckCircle className="text-green mr-2 mt-1"/>;
    if (step === currentStep) return <FaRocket className="text-white mr-2 mt-1"/>;
    return <FaHourglassHalf className="text-green mr-2 mt-1"/>;
}

const Step:FC<{step: number, text: string}> = ({step, text}) => {
    const currentStep = useAppStore(state => state.step)
    const isCurrentStep = step === currentStep;

    return (
        <li className={clsx(
            "flex text-lg md:text-xl lg:text-2xl items-center",
            { "bg-green-light text-white" : isCurrentStep},
            "hover:bg-green-pale"
        )}>
            <a onClick={() => useAppStore.setState({step})} href="#" className="flex py-4 w-full">
                <Icon step={step} currentStep={currentStep} />
                <span>{text}</span>
            </a>
        </li>
    );
}

export const steps = [ "Deposit", "Bridge", "Retire", "Redeem"];

export const StepBar:FC = () => {
    return (
        <aside className="w-64 mr-4 p-4 rounded-lg shadow-lg">
            <ul className="">
                {
                    steps.map((text, index) => (
                        <Step key={index} step={index + 1} text={text}/>
                    ))
                }
            </ul>
        </aside>
    );
}