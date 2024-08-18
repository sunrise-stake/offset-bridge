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
import {SolflareWalletAdapter, TorusWalletAdapter} from "@solana/wallet-adapter-wallets";
import {PhantomWalletAdapter} from "@solana/wallet-adapter-phantom";
import {ConnectionProvider, WalletProvider} from "@solana/wallet-adapter-react";
import {WalletModalProvider} from "@solana/wallet-adapter-react-ui";
import {clusterApiUrl} from "@solana/web3.js";
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import {useRouter} from "next/navigation";
import {SolanaRetirementProvider} from "@/context/solanaRetirementContext";
import {VAAResult} from "@/lib/types";
import {Address} from "abitype/src/abi";
import {StateAddress} from "@/lib/constants";

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

export type VAAResultStored = Omit<VAAResult, 'vaaBytes'> & { vaaBytes: string };

type BridgeTransactionStored = {
    solanaTxSignature?: string; // set if the tx originates from solana or has been redeemed on solana
    vaaResult?: VAAResultStored;  // set if wormhole has seen the tx (bytes in hex)
    polygonTxHash?: string // set if the tx originates from polygon or has been redeemed on polygon
}

type BridgeTransaction = Omit<BridgeTransactionStored, 'vaaResult'> & {
    vaaResult?: VAAResult;
}

export type RetirementNFT = {
    tokenId: number;
    solanaTokenAddress: string;
}

export interface AppState {
    step: number;
    solanaStateAddress: string;
    holdingContractTarget?: Address;
    activeUSDCBridgeTransaction?: BridgeTransactionStored;
    activeRetirementCertificateBridgeTransaction?: BridgeTransactionStored;
    retirementNFTs: RetirementNFT[];
}

export interface Actions {
    setStep: (newStep: number) => void;
    setSolanaStateAddress: (address: string) => void;
    setHoldingContractTarget: (newTarget: Address) => void;
    clearHoldingContractTarget: () => void;
    updateActiveUSDCBridgeTransaction: (newTx: Partial<BridgeTransaction>) => void;
    clearActiveUSDCBridgeTransaction: () => void;
    updateActiveRetirementCertificateBridgeTransaction: (newTx: Partial<BridgeTransaction>) => void;
    clearActiveRetirementCertificateBridgeTransaction: () => void;
    setRetirementNFTs: (newNFTs: RetirementNFT[]) => void;
}

const convertBridgeTransaction = (newTx: Partial<BridgeTransaction>): Partial<BridgeTransactionStored> => {
    return {
        ...newTx,
        ...(newTx?.vaaResult ? {vaaResult: { ...newTx.vaaResult, vaaBytes: Buffer.from(newTx.vaaResult.vaaBytes).toString('hex')}} : {})
    } as Partial<BridgeTransactionStored>;
}

export const useAppStore = create<AppState & Actions>()(
    devtools(
        persist(
            (set) => {
                return ({
                    step: 1,
                    setStep: (newStep: number) => set((state) => ({step: state.step + newStep})),
                    solanaStateAddress: StateAddress.Default,
                    setSolanaStateAddress: (newSolanaStateAddress: string) => set(() => ({
                        solanaStateAddress: newSolanaStateAddress
                    })),

                    holdingContractTarget: undefined,
                    setHoldingContractTarget: (newTarget: Address) => set(() => ({holdingContractTarget: newTarget})),
                    clearHoldingContractTarget: () => set(() => ({holdingContractTarget: undefined})),

                    activeUSDCBridgeTransaction: undefined,
                    updateActiveUSDCBridgeTransaction:
                        (newTx: Partial<BridgeTransaction>) => {
                            set((state) =>
                                ({activeUSDCBridgeTransaction: {...(state.activeUSDCBridgeTransaction || {}), ...convertBridgeTransaction(newTx)}}));
                        },
                    clearActiveUSDCBridgeTransaction: () => set(() => ({activeUSDCBridgeTransaction: undefined})),

                    activeRetirementCertificateBridgeTransaction: undefined,
                    updateActiveRetirementCertificateBridgeTransaction:
                        (newTx: Partial<BridgeTransaction>) =>
                            set((state) =>
                                ({activeRetirementCertificateBridgeTransaction: {...(state.activeRetirementCertificateBridgeTransaction || {}), ...convertBridgeTransaction(newTx)}})),
                    clearActiveRetirementCertificateBridgeTransaction: () => set(() => ({activeRetirementCertificateBridgeTransaction: undefined})),

                    retirementNFTs: [],
                    setRetirementNFTs: (newNFTs: RetirementNFT[]) => set(() => ({retirementNFTs: newNFTs})),
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
            new PhantomWalletAdapter(),
            new SolflareWalletAdapter(),
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