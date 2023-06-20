import {TCO2TokenResponse} from "toucan-sdk";
import {useEffect, useState} from "react";
import {PooledTCO2Token} from "@/hooks/useToucan";

const VERRA_URL = "https://registry.verra.org/app/projectDetail/VCS/"

type VerraResource = {
    link: string
}

// example symbol: TCO2-VCS-725-2007
const projectToResourceId = (project: PooledTCO2Token): string => project.name.replace("Toucan Protocol: ", "").split('-')[2]

export const useVerra = (project: PooledTCO2Token | undefined): VerraResource | undefined => {
    const [link, setLink] = useState<string>()

    useEffect(() => {
        console.log("project", project)
        if (!project) return;
        const resourceId = projectToResourceId(project);
        setLink(VERRA_URL + resourceId);
    }, [project]);

    if (!link) return undefined;

    return {
        link,
    };
}