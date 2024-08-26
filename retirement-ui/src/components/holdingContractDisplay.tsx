import React, {useState, useEffect, useCallback, FC} from 'react';
import {useHoldingContract} from "@/hooks/holdingContract/useHoldingContract";
import {ToucanProjectsSelector} from "@/components/toucanProjectsSelector";
import {TCO2TokenResponse} from "toucan-sdk";
import {useHoldingContractFactory} from "@/hooks/holdingContract/useHoldingContractFactory";
import {useVerra} from "@/hooks/useVerra";
import {PooledTCO2Token, useToucan} from "@/hooks/useToucan";
import {Address} from "abitype/src/abi";
import {FaWallet} from "react-icons/fa";
import {usePolygonWriteTransaction} from "@/hooks/usePolygonWriteTransaction";
import {useSelectedProjectNCTBalance} from "@/hooks/useSelectedProjectNCTBalance";

const addressesEqual = (address1: string, address2: string) => {
    return address1.toLowerCase() === address2.toLowerCase();
}

const stripProjectName = (name: string) => name.replace('Toucan Protocol: ', '')

export const HoldingContractDisplay:FC<{ setReady: (ready: boolean) => void }> = ({ setReady }) => {
    const factory = useHoldingContractFactory();
    // Holding contract created here with user wallet specified as retirement NFT's destination.
    const holdingContract = useHoldingContract();
    const [selectedProject, setSelectedProject] = useState<PooledTCO2Token>();
    const verraDetails = useVerra(selectedProject);
    const toucan = useToucan();
    const [changeShown, setChangeShown] = useState(false);
    const availableNCT = useSelectedProjectNCTBalance(selectedProject?.address);

    useEffect(() => {
        console.log("factory contract address", factory.contractAddress)
        if (factory.contractAddress) {
            setReady(true);
        }
    }, [factory.contractAddress]);

    const toggleChangeShown = () => setChangeShown(!changeShown)

    useEffect(() => {
        if (holdingContract.tco2 && toucan.allProjects.length > 0) {
            const currentProject = toucan
                .allProjects
                .find((project) => addressesEqual(project.address, holdingContract.tco2 as string));
            setSelectedProject(currentProject);
        }
    }, [holdingContract.tco2, toucan.allProjects.length, toucan.loading ]);

    // createAccount is a function that when called, will call the `create()` function on the factory, with the specified selectedProject
    const createAccount = usePolygonWriteTransaction(
        () => factory?.create(),
        'Create',
        [factory?.writeAsync, selectedProject],
        setReady
    );
    // selected project is specified/updated in the holding contract here
    const updateAccount = usePolygonWriteTransaction(
        async () => {
            if (selectedProject?.address) return holdingContract.updateTCO2(selectedProject.address as Address)
        },
        'Update',
        [selectedProject],
        setReady
    );

    return (
        <div className="p-4 space-y-4">
            {holdingContract.reads.isLoading ? (
                <div className="flex items-center space-x-2">
                    <span className="loading loading-spinner text-primary"/>
                    <span>Searching for account...</span>
                </div>
            ) : holdingContract.tco2 ? (
                <>
                    <div className="flex items-center space-x-2 w-full justify-between">
                        <FaWallet className="text-green text-lg"/>
                        {selectedProject && verraDetails && <div>Selected Project: <a href={verraDetails?.link} target="_blank" className="underline">
                            {stripProjectName(selectedProject?.name)}
                        </a></div>}
                        <button
                            className="btn btn-primary w-32"
                            disabled={!factory || factory?.isLoading}
                            onClick={toggleChangeShown}
                        >
                            Change
                        </button>
                    </div>
                    <div className="flex items-end space-x-2 w-full justify-between">
                        { changeShown &&
                            <>
                                <ToucanProjectsSelector selectProject={setSelectedProject} />
                                <button
                                    className="btn btn-primary w-32"
                                    disabled={!selectedProject || addressesEqual(selectedProject.address, holdingContract.tco2 as string)}
                                    onClick={updateAccount}
                                >
                                    Update
                                </button>
                            </>
                        }
                    </div>
                </>
            ) : (
                <div className="space-y-2">
                    <ToucanProjectsSelector selectProject={setSelectedProject} />
                    <button
                        className="btn btn-primary w-32"
                        disabled={!selectedProject || !factory || factory?.isLoading}
                        onClick={createAccount}
                    >
                        Create Account
                    </button>
                </div>
            )}
            <div>Available NCT in pool: {availableNCT}</div>
        </div>
    );
};
