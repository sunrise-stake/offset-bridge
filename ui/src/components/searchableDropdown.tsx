import {RefObject, useRef, useState, FocusEvent} from "react";
import {FaTimesCircle} from "react-icons/fa";

type SelectOption<T> = { name: string; address: string } & T;
type SearchableDropdownProps<T> = { options: SelectOption<T>[], loading: boolean, select: (option: SelectOption<T>) => void };

export function SearchableDropdown<T>({ options, loading, select }: SearchableDropdownProps<T>) {
    const [search, setSearch] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const containerRef: RefObject<HTMLDivElement> = useRef(null);

    const handleBlur = (e: FocusEvent<HTMLDivElement, Element>) => {
        // Check if the blur event is triggered by clicking on the dropdown itself.
        // If not, then close the dropdown.
        if (!containerRef.current?.contains(e.relatedTarget)) {
            setIsOpen(false);
        }
    };

    const filteredOptions = options.filter(option =>
        option.name.toLowerCase().includes(search.toLowerCase())
    );

    const clearInput = () => {
        setSearch('');
    };

    return (
        <div
            ref={containerRef}  onBlur={handleBlur}>
            <div className="relative inline-block">
                <input
                    type="text"
                    className="border rounded p-2 pr-8 w-96"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    onFocus={() => setIsOpen(true)}
                    placeholder="Search..."
                />
                {search && (
                    <FaTimesCircle
                        className="absolute right-2 top-3 text-gray-400 cursor-pointer"
                        onClick={clearInput}
                    />
                )}
            </div>
            {loading && <div className="text-gray-500 mb-2">Loading...</div>}
            {!loading && isOpen && (
                <ul className="absolute z-10 mt-2 w-full h-64 bg-white border rounded shadow-md overflow-auto">
                    {filteredOptions.map(option => (
                        <li
                            key={option.address}
                            className="p-2 hover:bg-gray-200 cursor-pointer"
                            onMouseDown={() => {
                                setSearch(option.name);
                                setIsOpen(false);
                                select(option);
                            }}
                        >
                            {option.name}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};
