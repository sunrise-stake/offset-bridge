import {useToucan} from "@/hooks/useToucan";
import {FC} from "react";
import {SearchableDropdown} from "@/components/searchableDropdown";
import {TCO2TokenResponse} from "toucan-sdk";
export const ToucanProjectsSelector: FC<{ selectProject: (project: TCO2TokenResponse) => void }> = ({ selectProject }) => {
    const { allProjects, loading, error } = useToucan();
    return (
        <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700">
                Select a project
            </label>
            <SearchableDropdown options={allProjects} loading={false} select={selectProject} />
        </div>
    );
};