import {useSolanaRetirement} from "@/context/solanaRetirementContext";
import {useEffect, useState} from "react";
import {PublicKey} from "@solana/web3.js";

export const useSolanaTokenBalance = (mint: PublicKey, owner: PublicKey): bigint | undefined => {
    const { api} = useSolanaRetirement();
    const [balance, setBalance] = useState<bigint>();

    useEffect(() => {
        if (!api) return;

        const unsubscribe = api.listenToBalance(mint, owner, setBalance);
        return () => {
            unsubscribe();
        }
    }, [api, mint.toBase58(), owner.toBase58()]);

    return balance;
}