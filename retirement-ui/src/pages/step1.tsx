import {FC} from "react";
import {useAnchorWallet} from "@solana/wallet-adapter-react";

export default function Step1() {
    const wallet = useAnchorWallet();

    if (!wallet) {

    }

    return <div>Step 1</div>
}