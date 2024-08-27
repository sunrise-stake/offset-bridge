import {FC, PropsWithChildren} from "react";
import {useAnchorWallet} from "@solana/wallet-adapter-react";
import {WalletMultiButton} from "@solana/wallet-adapter-react-ui";
import {useAppStore} from "@/app/providers";
import {ConnectButton} from "@rainbow-me/rainbowkit";
import {useAccount} from "wagmi";
import {SolanaWalletButton} from "@/components/SolanaWalletButton";
import {useStateNormaliser} from "@/hooks/useStateNormaliser";

const ConnectWalletsSection: FC = () => (
    <div className="flex flex-col items-center justify-center min-h-full">
        <h1 className="text-3xl text-green mb-4">Please connect Solana and Polygon wallets</h1>
        <div className="flex items-center gap-2">
            <SolanaWalletButton/>
            <ConnectButton showBalance={false} label="Select Polygon Wallet"></ConnectButton>
        </div>
    </div>
);

const stepSize = (step: number) => {
    switch (step) {
        case 1: return 25;
        case 2: return 30;
        case 3: return 40;
        default: return 50;
    }
}

export const Page: FC<PropsWithChildren> = ({children}) => {
    const { address: ethAddress } = useAccount();
    const wallet = useAnchorWallet();
    const currentStep = useAppStore(state => state.step)
    const content = wallet && ethAddress ? children : <ConnectWalletsSection/>;
    const image = `/pageBackgrounds/step${currentStep}.png`;

    useStateNormaliser();

    return (
        <section className="flex-grow p-4 rounded-lg shadow-lg">
            {/* Background Image */}
            <div
                className="absolute -z-[99] bottom-0 right-0 bg-contain bg-no-repeat bg-right-bottom opacity-25"
                style={{
                    backgroundImage: `url(${image})`,
                    width: `${stepSize(currentStep)}%`,
                    height: `${stepSize(currentStep)}%`,
                }}
            ></div>
            {content}
        </section>
    );
};