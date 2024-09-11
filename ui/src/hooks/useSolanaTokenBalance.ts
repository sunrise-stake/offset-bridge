import {useSolanaRetirement} from "@/context/solanaRetirementContext";
import {useEffect, useState} from "react";
import {PublicKey} from "@solana/web3.js";

export const useSolanaTokenBalance = (mint: PublicKey, owner: PublicKey | undefined ): bigint | undefined => {
    const { api } = useSolanaRetirement();
    const [balance, setBalance] = useState<bigint>();

    useEffect(() => {
        if (!api || !owner) return;

        const unsubscribe = api.listenToTokenBalance(mint, owner, setBalance);
        return () => {
            unsubscribe();
        }
    }, [api, mint.toBase58(), owner?.toBase58()]);

    return balance;
}