'use client'

import {useAnchorWallet, useConnection} from "@solana/wallet-adapter-react";
import {SolanaRetirement} from "@/api/solanaRetirement";
import {createContext, FC, PropsWithChildren, useContext, useEffect, useState} from "react";
import {USDC_TOKEN_SOLANA} from "@/lib/constants";

// TODO generalise
export const tokenMint = USDC_TOKEN_SOLANA;
export const tokenDecimals = 6;
export const tokenSymbol = "USDC";

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
