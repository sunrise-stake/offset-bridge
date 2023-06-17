import {useCallback, useEffect, useState} from "react";
import {NextButton} from "@/components/nextButton";
import {TCO2TokenResponse} from "toucan-sdk";
import {ToucanProjectsSelector} from "@/components/toucanProjectsSelector";
import {useHoldingContractFactory} from "@/hooks/holdingContract/useHoldingContractFactory";
import {useVerra} from "@/hooks/useVerra";
import {useToucan} from "@/hooks/useToucan";

export default function Step1() {
    const [selectedProject, setSelectedProject] = useState<TCO2TokenResponse>();
    const factory = useHoldingContractFactory();
    const verraDetails = useVerra(selectedProject);

    // TODO move out of here
    const { fetchRetirementNFTs } = useToucan();
    useEffect(() => {
        fetchRetirementNFTs("0x669dd15b1a25f34e87e6ecae2a855ae5a336d9e3").then(console.log)
    }, []);

    const createAccount = useCallback(async () => {
        factory?.create()
    }, [factory?.writeAsync, selectedProject]);

    return (<div>
        <h1 className="text-2xl mb-4">Step 1 - Create Account</h1>

        <ToucanProjectsSelector selectProject={setSelectedProject} />
        {factory?.isLoading && <div className="text-gray-500 mb-2">Loading...</div>}
        {factory?.error && <div className="text-red-500 mb-2">Error: {factory.error.message}</div>}
        {selectedProject && verraDetails && <div>Selected Project: <a href={verraDetails?.link} target="_blank" className="underline">{selectedProject?.name}</a></div>}

        <div className="flex items-center space-x-2 mb-2">
            <button
                className="btn btn-primary w-32"
                disabled={!selectedProject || !factory || factory?.isLoading}
                onClick={createAccount}
            >
                Create Account
            </button>
        </div>
        <div className="flex items-center space-x-2 mt-2">
            <NextButton disabled={ !factory || factory.contractAddress === undefined }/>
        </div>
    </div>)
}