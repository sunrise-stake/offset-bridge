import {useCallback, useEffect, useState} from "react";
import {NextButton} from "@/components/nextButton";
import {TCO2TokenResponse} from "toucan-sdk";
import {ToucanProjectsSelector} from "@/components/toucanProjectsSelector";
import {useHoldingContractFactory} from "@/hooks/holdingContract/useHoldingContractFactory";
import {useVerra} from "@/hooks/useVerra";
import {useToucan} from "@/hooks/useToucan";
import {useHoldingContract} from "@/hooks/holdingContract/useHoldingContract";
import {ConnectButton} from "@rainbow-me/rainbowkit";

export default function Step1() {
    const [selectedProject, setSelectedProject] = useState<TCO2TokenResponse>();
    const { allProjects, loading, error } = useToucan();
    const factory = useHoldingContractFactory();
    const holdingContract = useHoldingContract();
    const verraDetails = useVerra(selectedProject);

    useEffect(() => {
        if (holdingContract.tco2) {
            console.log("Looking for current project", holdingContract.tco2)
            const currentProject = allProjects.find((project) => project.address === holdingContract.tco2);
            console.log("Found current project", currentProject)
            setSelectedProject(currentProject);
        }
    }, [holdingContract.tco2, allProjects]);

    const createAccount = useCallback(async () => {
        factory?.create()
    }, [factory?.writeAsync, selectedProject]);

    return (<div>
        <h1 className="text-2xl mb-4">Step 1 - Create Account</h1>

        <ConnectButton/>
        <ToucanProjectsSelector selectProject={setSelectedProject} />
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