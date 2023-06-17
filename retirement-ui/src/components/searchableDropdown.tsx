import {FC, useState} from "react";

type Option = { name: string; id: string };
export const SearchableDropdown: FC<{options: Option[], loading: boolean}> = ({ options, loading }) => {
    const [search, setSearch] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    const filteredOptions = options.filter(option =>
        option.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="relative">
            <input
                type="text"
                className="border rounded p-2"
                value={search}
                onChange={e => setSearch(e.target.value)}
                onFocus={() => setIsOpen(true)}
                placeholder="Search..."
            />
            {loading && <div className="text-gray-500 mb-2">Loading...</div>}
            {!loading && isOpen && (
                <ul className="absolute z-10 mt-2 w-full border rounded shadow-md">
                    {filteredOptions.map(option => (
                        <li
                            key={option.id}
                            className="p-2 hover:bg-gray-200 cursor-pointer"
                            onClick={() => {
                                setSearch(option.name);
                                setIsOpen(false);
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
