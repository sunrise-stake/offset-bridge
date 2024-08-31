import {useSolanaRetirement} from "@/context/solanaRetirementContext";
import {useEffect, useState} from "react";
import {PublicKey} from "@solana/web3.js";

const RENT_EXEMPT_MINIMUM = 2039280n;

export const useSolanaSolBalance = (owner: PublicKey | undefined): bigint | undefined => {
    const { api } = useSolanaRetirement();
    const [balance, setBalance] = useState<bigint>();

    useEffect(() => {
        if (!api || !owner) return;

        const unsubscribe = api.listenToSolBalance(owner, (balance: bigint) => {
            setBalance(balance - RENT_EXEMPT_MINIMUM)
        });
        return () => {
            unsubscribe();
        }
    }, [api, owner?.toBase58()]);

    return balance;
}