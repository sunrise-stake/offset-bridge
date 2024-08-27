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
    const [adminMode] = useAppStore(state => ([ state.adminMode ]))
    const { solanaState, createSolanaState } = useSolanaState();
    const holdingContractAddress = useCurrentHoldingContractAddress();

    const stateExists = !!solanaState;
    console.log("SolanaStateManager: solanaState", solanaState);

    // return a component with the following:
    // a checkbox labelled "Admin Mode"
    // if checked, show the state selector component
    // if unchecked, a button labelled "Create State" that calls createSolanaState with the holdingContract
    return <div className="flex items-center justify-between">
        {adminMode ?
            <SolanaStateSelector/> : (
                holdingContractAddress ?
                    <div className="tooltip"
                         data-tip={ stateExists ? "Solana side already created" : "Register the project to retire to on the Solana side"}>
                        <button
                            className="btn btn-primary w-32"
                            disabled={stateExists || !holdingContractAddress}
                            onClick={() => createSolanaState(holdingContractAddress)}>Setup Solana Side
                        </button>
                    </div>
                        :
                        <div>Waiting for holding contract...</div>
                        )}
                    </div>
        }