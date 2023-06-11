import {FC, PropsWithChildren} from "react";
import {useAnchorWallet} from "@solana/wallet-adapter-react";
import {WalletMultiButton} from "@solana/wallet-adapter-react-ui";

const ConnectWalletSection: FC = () => (
    <div className="flex flex-col items-center justify-center min-h-full">
        <h1 className="text-3xl text-green mb-4">Please connect your wallet</h1>
        <WalletMultiButton/>
    </div>
);

export const Page: FC<PropsWithChildren> = ({children}) => {
    const wallet = useAnchorWallet();
    const content = wallet ? children : <ConnectWalletSection/>;

    return (
        <section className="flex-grow p-4 rounded-lg shadow-lg">
            {content}
        </section>
    );
};