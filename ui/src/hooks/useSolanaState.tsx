import {SolanaStateAccount} from "@/lib/types";
import {useSolanaRetirement} from "@/context/solanaRetirementContext";
import {useEffect, useState} from "react";
import {useAnchorWallet, useConnection, useWallet} from "@solana/wallet-adapter-react";
import {useWalletSafe} from "@/hooks/useWalletSafe";
import {toast} from "react-toastify";
import {SolExplorerLink} from "@/components/solExplorerLink";
import {useSolanaTxConfirm} from "@/hooks/useSolanaTxConfirm";
import {useAppStore} from "@/app/providers";
import {deriveStateAddress} from "@/lib/util";

// return the current solana state if one is selected, and a function to create a new one
export const useSolanaState = ():{
    solanaState: SolanaStateAccount | null,
    createSolanaState: (holdingContract: string) => Promise<void>
} => {
    const { api } = useSolanaRetirement();
    const handleTransaction = useSolanaTxConfirm(
        { successMessage: "State creation successful", errorMessage: "State creation failed" }
    );

    return {
        solanaState: api?.state ?? null,
        createSolanaState: async (holdingContract: string) => {
            if (!api) throw new Error("No SolanaRetirement API available");

            const tx = await api.createState(holdingContract)

            await handleTransaction(tx)

            await api.updateState();
        }
    };
}