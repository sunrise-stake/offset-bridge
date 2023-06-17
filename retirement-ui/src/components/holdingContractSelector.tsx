import {ChangeEvent, FC} from "react";
import {HOLDING_CONTRACTS} from "@/lib/constants";

export const HoldingContractSelector: FC<{ selected: string, setSelected: (selected: string) => void }> = ({selected, setSelected}) => {
    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        setSelected(event.target.value);
    };

    return (
        <div className="space-y-4 space-x-8 mb-6 flex items-center">
            <span className="">Select Target:</span>
            <div className="space-y-4">
                {HOLDING_CONTRACTS.map((target, index) => (
                    <label key={index} className="flex items-center space-x-3">
                        <input
                            type="radio"
                            name="target"
                            value={target.address}
                            onChange={handleChange}
                            checked={selected === target.address}
                            className="form-radio text-indigo-600"
                        />
                        <div>
                            <div className="font-medium">{target.name}</div>
                            <div className="text-sm text-gray-500">{target.description}</div>
                        </div>
                    </label>
                ))}
                <span className="text-sm text-gray-500">Custom targets coming soon...</span>
            </div>
        </div>
    );
}