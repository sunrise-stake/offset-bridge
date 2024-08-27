'use client'

import {useAnchorWallet, useConnection} from "@solana/wallet-adapter-react";
import {SolanaRetirement} from "@/api/solanaRetirement";
import {createContext, FC, PropsWithChildren, useContext, useEffect, useState} from "react";
import {useAppStore} from "@/app/providers";
import { PublicKey } from "@solana/web3.js";

interface SolanaRetirementContextProps {
    api: SolanaRetirement | undefined;
}
const defaultValue: SolanaRetirementContextProps = {
    api: undefined,
};
const SolanaRetirementContext = createContext<SolanaRetirementContextProps>(defaultValue);

export const SolanaRetirementProvider: FC<PropsWithChildren> = ({children}) => {
    const wallet = useAnchorWallet();
    const { connection } = useConnection();
    const [api, setAPI] = useState<SolanaRetirement | undefined>();
    const holdingContractTarget = useAppStore(state => state.holdingContractTarget);
    const solanaStateAddress = useAppStore(state => state.solanaStateAddress);

    useEffect(() => {
        console.log("SolanaRetirementProvider useEffect");
        if (wallet && holdingContractTarget && solanaStateAddress) {
            console.log("SolanaRetirementProvider useEffect: creating SolanaRetirement api");
            console.log("SolanaRetirementProvider useEffect: State Address:", solanaStateAddress)
            console.log("SolanaRetirementProvider useEffect: Target:", holdingContractTarget);
            SolanaRetirement.build(
                wallet,
                connection,
                new PublicKey(solanaStateAddress),
                holdingContractTarget
            ).then(setAPI);
        }
    }, [wallet?.publicKey?.toBase58(), holdingContractTarget, solanaStateAddress]);

    return (
        <SolanaRetirementContext.Provider
            value={{
                api
            }}
        >
            {children}
        </SolanaRetirementContext.Provider>
    );
};

export const useSolanaRetirement = (): SolanaRetirementContextProps => useContext(SolanaRetirementContext);
