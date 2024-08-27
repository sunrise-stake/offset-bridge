import {useWallet} from "@solana/wallet-adapter-react";
import {WalletMultiButton} from "@solana/wallet-adapter-react-ui";

export const SolanaWalletButton = () => {
    const wallet = useWallet();

    if (wallet?.connected) return <WalletMultiButton style={{ height: "40px" }}/>

    return <WalletMultiButton style={{ height: "40px" }}>Select Solana Wallet</WalletMultiButton>
}