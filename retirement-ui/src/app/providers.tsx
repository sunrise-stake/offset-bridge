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
import { devtools, persist, StateStorage } from 'zustand/middleware'
import {useRouter} from "next/navigation";
import {SolanaRetirementProvider} from "@/context/solanaRetirementContext";

const { chains, publicClient, webSocketPublicClient } = configureChains(
    [polygon],
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

type BridgeTransactionStored = {
    solanaTxSignature?: string; // set if the tx originates from solana or has been redeemed on solana
    vaaBytes?: string;  // set if wormhole has seen the tx (bytes in hex)
    polygonTxHash?: string // set if the tx originates from polygon or has been redeemed on polygon
}

type BridgeTransaction = Omit<BridgeTransactionStored, 'vaaBytes'> & {
    vaaBytes?: Uint8Array
}

export interface AppState {
    step: number;
    activeUSDCBridgeTransaction?: BridgeTransactionStored;
    activeRetirementCertificateBridgeTransaction?: BridgeTransactionStored;
}

export interface Actions {
    setStep: (newStep: number) => void;
    updateActiveUSDCBridgeTransaction: (newTx: Partial<BridgeTransaction>) => void;
    updateActiveRetirementCertificateBridgeTransaction: (newTx: Partial<BridgeTransaction>) => void;
}

const convertBridgeTransaction = (newTx: Partial<BridgeTransaction>): Partial<BridgeTransactionStored> => {
    return {
        ...newTx,
        ...(newTx?.vaaBytes ? {vaaBytes: Buffer.from(newTx.vaaBytes).toString('hex')} : {})
    } as Partial<BridgeTransactionStored>;
}

export const useAppStore = create<AppState & Actions>()(
    devtools(
        persist(
            (set) => {
                return ({
                    step: 1,
                    setStep: (newStep: number) => set((state) => ({step: state.step + newStep})),

                    activeUSDCBridgeTransaction: undefined,
                    updateActiveUSDCBridgeTransaction:
                        (newTx: Partial<BridgeTransaction>) => {
                            set((state) =>
                                ({activeUSDCBridgeTransaction: {...(state.activeUSDCBridgeTransaction || {}), ...convertBridgeTransaction(newTx)}}));
                        },

                    activeRetirementCertificateBridgeTransaction: undefined,
                    updateActiveRetirementCertificateBridgeTransaction:
                        (newTx: Partial<BridgeTransaction>) =>
                            set((state) =>
                                ({activeRetirementCertificateBridgeTransaction: {...(state.activeRetirementCertificateBridgeTransaction || {}), ...convertBridgeTransaction(newTx)}})),
                });
            },
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
    }, [currentStep]);


    return (
        <ConnectionProvider endpoint={solanaEndpoint}>
            <WalletProvider wallets={solanaWallets} autoConnect>
                <WalletModalProvider>
                    <WagmiConfig config={wagmiConfig}>
                        <RainbowKitProvider chains={chains} appInfo={appInfo} showRecentTransactions={true}>
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