import {WalletMultiButton} from "@solana/wallet-adapter-react-ui";
import {ConnectButton} from "@rainbow-me/rainbowkit";
import {FC} from "react";
import clsx from "clsx";

export const Navbar: FC = () => (
    <div
        className={clsx(
            "fixed left-0 top-0 pb-6 pt-2 max-h-16",
            "flex justify-end w-full",
            "border-b border-gray-300 bg-gradient-to-b from-zinc-200 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30"
        )}>
        <WalletMultiButton/>
        <ConnectButton/>
    </div>
)