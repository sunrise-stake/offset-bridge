'use client'

import {useAnchorWallet, useConnection} from "@solana/wallet-adapter-react";
import {SolanaRetirement} from "@/api/solanaRetirement";
import {createContext, FC, PropsWithChildren, useContext, useEffect, useState} from "react";
import {useAppStore} from "@/app/providers";

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

    useEffect(() => {
        if (wallet && holdingContractTarget) {
            console.log("creating SolanaRetirement api");
            console.log("target: ", holdingContractTarget);
            SolanaRetirement.build(wallet, connection, holdingContractTarget).then(setAPI);
        }
    }, [wallet?.publicKey?.toBase58(), holdingContractTarget]);

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
