import React, {useState, useEffect, useCallback, FC} from 'react';
import {useHoldingContract} from "@/hooks/holdingContract/useHoldingContract";
import {ToucanProjectsSelector} from "@/components/toucanProjectsSelector";
import {TCO2TokenResponse} from "toucan-sdk";
import {useHoldingContractFactory} from "@/hooks/holdingContract/useHoldingContractFactory";
import {useVerra} from "@/hooks/useVerra";
import {useToucan} from "@/hooks/useToucan";
import {Address} from "abitype/src/abi";
import {FaWallet} from "react-icons/fa";
import {toast} from "react-toastify";
import {PolyExplorerLink} from "@/components/polyExplorerLink";
import {WriteContractResult, waitForTransaction} from "@wagmi/core";
import {TransactionReceipt} from "viem";

const addressesEqual = (address1: string, address2: string) => {
    return address1.toLowerCase() === address2.toLowerCase();
}

const stripProjectName = (name: string) => name.replace('Toucan Protocol: ', '')

export const HoldingContractDisplay:FC<{ setReady: (ready: boolean) => void }> = ({ setReady }) => {
    const factory = useHoldingContractFactory();
    const holdingContract = useHoldingContract();
    const [selectedProject, setSelectedProject] = useState<TCO2TokenResponse>();
    const verraDetails = useVerra(selectedProject);
    const toucan = useToucan();
    const [changeShown, setChangeShown] = useState(false);

    useEffect(() => {
        if (factory.contractAddress && !holdingContract.reads.isLoading) {
            setReady(true);
        }
    }, [holdingContract.contractAddress, holdingContract.reads.isLoading]);

    const toggleChangeShown = () => setChangeShown(!changeShown)

    useEffect(() => {
        if (holdingContract.tco2 && toucan.allProjects.length > 0) {
            const currentProject = toucan
                .allProjects
                .find((project) => addressesEqual(project.address, holdingContract.tco2 as string));
            setSelectedProject(currentProject);
        }
    }, [holdingContract.tco2, toucan.allProjects.length, toucan.loading ]);

    const createAccount = useCallback(async () => {
        factory?.create()
    }, [factory?.writeAsync, selectedProject]);

    const updateAccount = useCallback(async () => {
        const updateSuccessful = (receipt: TransactionReceipt) => {
            setReady(true);
            toast.success(<div>
                Update successful:{' '}<PolyExplorerLink address={receipt.transactionHash} type="tx"/>
            </div>);
        }

        const updateInProgress = (writeContractResult: WriteContractResult | undefined) => {
            if (!writeContractResult) return;
            setReady(false);

            toast.info(<div>
                Update in progress:{' '}<PolyExplorerLink address={writeContractResult.hash} type="tx"/>
            </div>);

            waitForTransaction({ hash :writeContractResult.hash }).then(updateSuccessful);
        }

        const updateFailed = (error: Error) => {
            toast.error(<div>
                Update failed: {error.message}
            </div>);
        }

        if (selectedProject?.address) {
            holdingContract.updateTCO2(selectedProject.address as Address).then(updateInProgress).catch(updateFailed);
        }
    }, [selectedProject]);

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
                            disabled={!selectedProject || !factory || factory?.isLoading}
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
        </div>
    );
};
