import {useToucan} from "@/hooks/useToucan";
import {FC} from "react";
import {SearchableDropdown} from "@/components/searchableDropdown";
export const ToucanProjectsSelector: FC = () => {
    const { allProjects, loading, error } = useToucan();

    return (
        <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700">
                Select a project
            </label>
            <SearchableDropdown options={allProjects} loading={false} />
        </div>
    );
};