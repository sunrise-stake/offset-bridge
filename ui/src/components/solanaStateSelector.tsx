import {FC, useEffect} from "react";
import {SimpleDropdown} from "@/components/simpleDropdown";
import { useAppStore } from "@/app/providers";
import {StateAddress} from "@/lib/constants";

export const SolanaStateSelector: FC = () => {
    const [solanaStateAddress, setSolanaStateAddress] = useAppStore(state => ([
        state.solanaStateAddress, state.setSolanaStateAddress
    ]))

    const states = Object.entries(StateAddress).map(([name, value]) => ({ name, value }));

    useEffect(() => {
        // set the default state address on load
        setSolanaStateAddress(states[0].value);
    }, [])

    return <div>
        <div className="mb-2 inline-flex items-center space-x-2 gap-2">Select State: <SimpleDropdown
            options={states} initial={states[0]} select={(selected) => setSolanaStateAddress(selected.value)}/></div>
    </div>
}