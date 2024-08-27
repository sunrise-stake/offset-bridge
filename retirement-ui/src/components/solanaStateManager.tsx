import {FC, useState} from "react";
import {SimpleDropdown} from "@/components/simpleDropdown";
import { useAppStore } from "@/app/providers";
import {StateAddress} from "@/lib/constants";
import {useSolanaState} from "@/hooks/useSolanaState";
import {SolanaStateSelector} from "@/components/solanaStateSelector";
import {toast} from "react-toastify";
import {SolExplorerLink} from "@/components/solExplorerLink";
import {useCurrentHoldingContractAddress} from "@/hooks/holdingContract/useCurrentHoldingContractAddress";
import {useWalletSafe} from "@/hooks/useWalletSafe";
import {useWallet} from "@solana/wallet-adapter-react";
import {deriveStateAddress} from "@/lib/util";

export const SolanaStateManager: FC = () => {
    const [solanaStateAddress, setSolanaStateAddress] = useAppStore(state => ([
        state.solanaStateAddress, state.setSolanaStateAddress
    ]))
    const { solanaState, createSolanaState } = useSolanaState();
    const holdingContractAddress = useCurrentHoldingContractAddress();
    const [adminMode, setAdminMode] = useState(false);
    const wallet = useWallet();

    const stateExists = !!solanaState;
    console.log("SolanaStateManager: solanaState", solanaState);

    const changeAdminMode = (newAdminMode: boolean) => {
        setAdminMode(newAdminMode);
        if (!newAdminMode) {
            setSolanaStateAddress(wallet?.publicKey ? deriveStateAddress(wallet.publicKey).toBase58() : undefined);
        }
    };

    // return a component with the following:
    // a checkbox labelled "Admin Mode", with a tooltip that states "Admin mode lets you use a Sunrise Stake account to retire funds from the Sunrise Stake platform"
    // if checked, show the state selector component
    // if unchecked, a button labelled "Create State" that calls createSolanaState with the holdingContract
    return <div className="flex items-center justify-between mx-4">
        <div className="tooltip"
             data-tip="Admin mode lets you use a Sunrise Stake account to retire funds from the Sunrise Stake platform">
            <div className="form-toggle flex items-center space-x-2">
                <input type="checkbox" className="toggle" onChange={(e) => changeAdminMode(e.target.checked)}/>
                <label htmlFor="toggle" className="text-xs">Admin Mode</label>
            </div>
        </div>
        {adminMode ?
            <SolanaStateSelector/> : (
                holdingContractAddress ?
                    <div className="tooltip"
                         data-tip={ stateExists ? "Solana state already created" : "Register the project to retire to on the Solana side"}>
                        <button
                            className="btn btn-primary w-32"
                            disabled={stateExists || !holdingContractAddress}
                            onClick={() => createSolanaState(holdingContractAddress)}>Create State
                        </button>
                    </div>
                        :
                        <div>Waiting for holding contract...</div>
                        )}
                    </div>
        }