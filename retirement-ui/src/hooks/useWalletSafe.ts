import {useWallet, WalletContextState} from "@solana/wallet-adapter-react";
import {PublicKey} from "@solana/web3.js";

// Use this only inside a context where the wallet is guaranteed to be defined
// This should be true for all pages, since the layout component wraps the page component
export type SafeWallet = WalletContextState & {
    publicKey: PublicKey
};

// and checks that the wallet is connected before rendering the page
export const useWalletSafe = (): SafeWallet => {
    const wallet = useWallet();

    if (!wallet.connected || !wallet.publicKey) {
        throw new Error("Wallet is not connected")
    }

    return wallet as SafeWallet;
}