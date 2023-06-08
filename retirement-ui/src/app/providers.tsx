'use client';

import * as React from 'react';
import {
    RainbowKitProvider,
    getDefaultWallets,
    connectorsForWallets,
} from '@rainbow-me/rainbowkit';
import {
    argentWallet,
    trustWallet,
    ledgerWallet,
} from '@rainbow-me/rainbowkit/wallets';
import { configureChains, createConfig, WagmiConfig } from 'wagmi';
import { mainnet, polygon, optimism, arbitrum, goerli } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
import {useEffect, useMemo} from "react";
import {BackpackWalletAdapter, SolflareWalletAdapter, TorusWalletAdapter} from "@solana/wallet-adapter-wallets";
import {PhantomWalletAdapter} from "@solana/wallet-adapter-phantom";
import {GlowWalletAdapter} from "@solana/wallet-adapter-glow";
import {ConnectionProvider, WalletProvider} from "@solana/wallet-adapter-react";
import {WalletModalProvider} from "@solana/wallet-adapter-react-ui";
import {clusterApiUrl} from "@solana/web3.js";
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import {useRouter} from "next/navigation";
import {SolanaRetirementProvider} from "@/context/solanaRetirementContext";

const { chains, publicClient, webSocketPublicClient } = configureChains(
    [
        // mainnet,
        polygon,
        // optimism,
        // arbitrum,
        // ...(process.env.NEXT_PUBLIC_ENABLE_TESTNETS === 'true' ? [goerli] : []),
    ],
    [publicProvider()]
);

const projectId = '853dd4ad9d8103e13640172781151978'; // Wallet Connect key

const { wallets } = getDefaultWallets({
    appName: 'Solana Carbon Retirement',
    projectId,
    chains,
});

const appInfo = {
    appName: 'Rainbowkit Demo',
};

const connectors = connectorsForWallets([
    ...wallets,
    {
        groupName: 'Other',
        wallets: [
            argentWallet({ projectId, chains }),
            trustWallet({ projectId, chains }),
            ledgerWallet({ projectId, chains }),
        ],
    },
]);

const wagmiConfig = createConfig({
    autoConnect: true,
    connectors,
    publicClient,
    webSocketPublicClient,
});

export interface AppState {
    // TODO temp
    step: number;
    activeUSDCBridgeTransaction?: {
        solanaTxSignature?: string; // must be set
        vaaBytes?: Uint8Array;  // set if wormhole has seen the tx
        polygonTxHash?: string // set if the tx has been redeemed
    };
    activeRetirementCertificateBridgeTransaction?: {
        solanaTxSignature?: string; // must be set
        vaaBytes?: Uint8Array;  // set if wormhole has seen the tx
        polygonTxHash?: string // set if the tx has been redeemed
    };
}

export interface Actions {
    setStep: (newStep: number) => void;
    updateActiveUSDCBridgeTransaction: (newTx: Partial<AppState['activeUSDCBridgeTransaction']>) => void;
    updateActiveRetirementCertificateBridgeTransaction: (newTx: Partial<AppState['activeRetirementCertificateBridgeTransaction']>) => void;
}

export const useAppStore = create<AppState & Actions>()(
    devtools(
        persist(
            (set) => ({
                step: 1,
                setStep: (newStep:number) => set((state) => ({ step: state.step + newStep })),

                activeUSDCBridgeTransaction: undefined,
                updateActiveUSDCBridgeTransaction:
                    (newTx: Partial<AppState['activeUSDCBridgeTransaction']>) =>
                        set((state) =>
                        ({ activeUSDCBridgeTransaction: { ...(state.activeUSDCBridgeTransaction || {}), ...newTx } })),

                activeRetirementCertificateBridgeTransaction: undefined,
                updateActiveRetirementCertificateBridgeTransaction:
                    (newTx: Partial<AppState['activeRetirementCertificateBridgeTransaction']>) =>
                        set((state) =>
                            ({ activeRetirementCertificateBridgeTransaction: { ...(state.activeRetirementCertificateBridgeTransaction || {}), ...newTx } })),
            }),
            {
                name: 'solana-carbon-retirement-storage',
            }
        )
    )
)

export function Providers({ children }: { children: React.ReactNode }) {
    const [mounted, setMounted] = React.useState(false);
    React.useEffect(() => setMounted(true), []);

    const solanaEndpoint = process.env.NEXT_PUBLIC_SOLANA_RPC_HOST || clusterApiUrl("mainnet-beta");
    const solanaWallets = useMemo(
        () => [
            new BackpackWalletAdapter(),
            new PhantomWalletAdapter(),
            new SolflareWalletAdapter(),
            new GlowWalletAdapter(),
            new TorusWalletAdapter(),
        ],
        []
    );

    const router = useRouter();
    const currentStep = useAppStore((state) => state.step);

    useEffect(() => {
        router.push('/step' + currentStep);
    }, [router, currentStep]);


    return (
        <ConnectionProvider endpoint={solanaEndpoint}>
            <WalletProvider wallets={solanaWallets} autoConnect>
                <WalletModalProvider>
                    <WagmiConfig config={wagmiConfig}>
                        <RainbowKitProvider chains={chains} appInfo={appInfo}>
                            <SolanaRetirementProvider>
                                {mounted && children}
                            </SolanaRetirementProvider>
                        </RainbowKitProvider>
                    </WagmiConfig>
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
}