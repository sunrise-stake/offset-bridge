import {FC} from "react";
import {FaCheckCircle, FaHourglassHalf, FaRocket} from "react-icons/fa";
import clsx from "clsx";
import {useAppStore} from "@/app/providers";

const Step:FC<{step: number, text: string}> = ({step, text}) => {
    const isCurrentStep = useAppStore(state => state.step === step)
    return (
        <li className={clsx("flex items-center", { "bg-blue-300 text-white" : isCurrentStep})}>
            <a onClick={() => useAppStore.setState({step})} href="#" className="flex">
                { isCurrentStep ? <FaRocket className="text-blue-600 mr-2 mt-1"/> : <FaCheckCircle className="text-blue-600 mr-2 mt-1"/>}
                <span>{text}</span>
            </a>
        </li>
    );
}

const steps = [ "Step 1", "Step 2", "Step 3"];

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