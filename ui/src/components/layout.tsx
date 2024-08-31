import {Providers} from "@/app/providers";
import {FC, PropsWithChildren} from "react";
import {Navbar} from "@/components/navbar";
import {Footer} from "@/components/footer";

import '@/app/globals.css'
import '@solana/wallet-adapter-react-ui/styles.css';
import '@rainbow-me/rainbowkit/styles.css';
import 'react-toastify/dist/ReactToastify.css';
import '@/app/wallet-adapter-styles.css';

import {StepBar} from "@/components/stepBar";
import {Page} from "@/components/page";
import {ToastContainer} from "react-toastify";

export const Layout: FC<PropsWithChildren> = ({children}) => (
    <Providers>
        <ToastContainer position="bottom-left"/>
        <div className="h-screen bg-gray-100 flex items-center justify-center">
            <div className="
            max-w-4xl w-full mx-4
            bg-white shadow-lg rounded-lg
            p-2 md:p-4
            min-h-[75%]
            max-h-screen md:max-h-[90%] lg:max-h-[75%]
               overflow-y-auto flex flex-col">
                <Navbar/>
                <div className="pt-12 flex flex-grow h-full">
                    <StepBar/>
                    <Page>{children}</Page>
                </div>
                <Footer/>
            </div>
        </div>
    </Providers>
);
