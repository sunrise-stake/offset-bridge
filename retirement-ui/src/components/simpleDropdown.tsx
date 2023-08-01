import {useState, ChangeEvent} from "react";

type SelectOption<T> = { name: string } & T;
type SimpleDropdownProps<T> = { options: SelectOption<T>[], initial?: SelectOption<T>, select: (option: SelectOption<T>) => void };

export function SimpleDropdown<T>({ options, initial, select }: SimpleDropdownProps<T>) {
     const [selected, setSelected] = useState<T | undefined>(initial);

     const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
        const selectedOption = options.find(option => option.name === e.target.value);

        if (!selectedOption) return;

        setSelected(selectedOption);
        select(selectedOption);
     }

    return (
        <div>
            <select className="select select-bordered w-full max-w-xs" onChange={handleChange}>
                <option disabled selected={!selected}>Select your input token</option>
                {options.map(option => (
                    <option selected={option === selected} key={option.name}>{option.name}</option>
                ))}
            </select>
        </div>
    );
}
