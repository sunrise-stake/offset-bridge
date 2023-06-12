import {FC, PropsWithChildren} from "react";
import {useAnchorWallet} from "@solana/wallet-adapter-react";
import {WalletMultiButton} from "@solana/wallet-adapter-react-ui";
import {useAppStore} from "@/app/providers";

const ConnectWalletSection: FC = () => (
    <div className="flex flex-col items-center justify-center min-h-full">
        <h1 className="text-3xl text-green mb-4">Please connect your wallet</h1>
        <WalletMultiButton/>
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
    const wallet = useAnchorWallet();
    const currentStep = useAppStore(state => state.step)
    const content = wallet ? children : <ConnectWalletSection/>;
    const image = `/pageBackgrounds/step${currentStep}.png`;

    return (
        <section className="flex-grow p-4 rounded-lg shadow-lg relative">
            {/* Background Image */}
            <div
                className="absolute bottom-0 right-0 bg-contain bg-no-repeat bg-right-bottom opacity-25"
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