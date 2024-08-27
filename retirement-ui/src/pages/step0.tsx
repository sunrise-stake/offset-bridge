import {NextButton} from "@/components/nextButton";
import {HoldingContractDisplay} from "@/components/holdingContractDisplay";
import {useEffect, useState} from "react";
import { SolanaStateSelector } from "@/components/solanaStateSelector";
import {SolanaStateManager} from "@/components/solanaStateManager";
import {useSolanaRetirement} from "@/context/solanaRetirementContext";

export default function Step0() {
   // Detect an active process. If an active process exists, ask the user to start a new one or continue the old one.



    return (<div>
        <h1 className="text-2xl mb-4">Start</h1>

    </div>)
}