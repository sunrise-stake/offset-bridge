import {Providers} from "@/app/providers";
import {FC, PropsWithChildren} from "react";
import {Navbar} from "@/components/navbar";
import {Footer} from "@/components/footer";

import '@/app/globals.css'
import '@solana/wallet-adapter-react-ui/styles.css';
import '@rainbow-me/rainbowkit/styles.css';

import {StepBar} from "@/components/stepBar";
import {Page} from "@/components/page";

export const Layout: FC<PropsWithChildren> = ({children}) => (
    <Providers>
        <div className="flex flex-col h-screen bg-blue-50">
            <Navbar/>
            <div className="pt-12 flex flex-grow overflow-auto">
                <StepBar/>
                <Page>{children}</Page>
            </div>
            <Footer/>
        </div>
    </Providers>
);