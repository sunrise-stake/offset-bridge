import {FC, PropsWithChildren} from "react";
import {useAnchorWallet} from "@solana/wallet-adapter-react";
import {WalletMultiButton} from "@solana/wallet-adapter-react-ui";

const ConnectWalletSection: FC = () =>
    (
        // <div className="flex flex-col items-center">
        //     <h1 className="text-2xl font-bold">Connect Solana wallet</h1>
        //     <p className="text-gray-500 text-sm">Connect your Solana wallet to continue</p>
        //     <WalletMultiButton/>
        // </div>

        <div className="flex flex-col items-center justify-center min-h-screen bg-blue-50">
            <h1 className="text-3xl text-blue-700 mb-4">Please connect your wallet</h1>
            <WalletMultiButton/>
        </div>
    );

export const Page: FC<PropsWithChildren> = ({children}) => {
    const wallet = useAnchorWallet();
    const content = wallet ? children : <ConnectWalletSection/>;

    return (
        <section className="flex-grow bg-white p-4 rounded-lg shadow-lg">
            {content}
        </section>
    );
};