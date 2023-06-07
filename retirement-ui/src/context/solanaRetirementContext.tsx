'use client'

import {useAnchorWallet, useConnection} from "@solana/wallet-adapter-react";
import {SolanaRetirement} from "@/api/solanaRetirement";
import {createContext, FC, PropsWithChildren, useContext, useEffect, useState} from "react";

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

    useEffect(() => {
        if (wallet) {
            console.log("creating SolanaRetirement api");
            SolanaRetirement.build(wallet, connection).then(setAPI);
        }
    }, [wallet?.publicKey?.toBase58()]);

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
