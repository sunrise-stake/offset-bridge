import {FC, ReactNode, useState} from "react";
import {FaCheckCircle, FaChevronDown, FaChevronUp, FaCircle, FaExclamationCircle} from "react-icons/fa";

export type SubstepInfo = {
    name: string,
    description: string,
}

export type Substep = SubstepInfo & {
    status: 'pending' | 'running' | 'complete' | 'error',
    details: Record<string, string | ReactNode>
}

const SubStepIcon:FC<{ status: Substep["status"] }> = ({ status }) => {
    switch (status) {
        case 'pending': return <FaCircle className="text-gray-300"/>
        case 'running': return <span className="loading loading-spinner text-primary"/>
        case 'complete': return <FaCheckCircle className="text-green"/>
        case 'error': return <FaExclamationCircle className="text-warning"/>
    }
};

export const BridgeSubsteps:FC<{ substeps: Substep[] }> = ({ substeps}) => {
    const [expandedItem, setExpandedItem] = useState<number | null>();
    return (
        <div className="dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4">Bridge Operation</h2>
            <ul className="list-none">
                {substeps.map(({name, description, status, details}, index) => (
                    <li className="mb-2" key={index}>
                        <div className="flex items-center mb-2">
                            <SubStepIcon status={status}/>
                            <span className="ml-2 flex-grow">{name}</span>
                            <span
                                className="cursor-pointer"
                                onClick={() =>
                                    setExpandedItem(expandedItem === index ? null : index)
                                }
                            >
                               {expandedItem === index ? <FaChevronDown/> : <FaChevronUp/>}
                            </span>
                        </div>
                        {expandedItem === index && (
                            <>
                                <p className="hidden md:block ml-6 text-sm text-gray-400">{description}</p>
                                {
                                    Object.entries(details).map(([key, value]) => (
                                        <div className="flex ml-6 text-sm text-gray-400" key={key}>
                                            <span className="mr-4">{key}:</span><span>{value}</span>
                                        </div>
                                    ))
                                }
                            </>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
};