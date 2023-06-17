import {TCO2TokenResponse} from "toucan-sdk";
import {useEffect, useState} from "react";

const VERRA_API_URL = "https://registry.verra.org/uiapi/resource/resourceSummary/"
const VERRA_URL = "https://registry.verra.org/app/projectDetail/VCS/"

type VerraResource = {
    // resourceIdentifier: string
    // resourceName: string
    // description: string
    link: string
}

// example symbol: TCO2-VCS-725-2007
const projectToResourceId = (project: TCO2TokenResponse): string => project.symbol.split('-')[2]

export const useVerra = (project: TCO2TokenResponse | undefined): VerraResource | undefined => {
    // const [details, setDetails] = useState<VerraResource>();
    const [link, setLink] = useState<string>()

    useEffect(() => {
        console.log("project", project)
        if (!project) return;
        const resourceId = projectToResourceId(project);
        setLink(VERRA_URL + resourceId);
    }, [project]);

    // useEffect(() => {
    //     if (!project) return;
    //
    //     // example symbol: TCO2-VCS-725-2007
    //     const resourceId = projectToResourceId(project);
    //
    //     fetch(VERRA_API_URL + resourceId).then((response) => {
    //         if (response.ok) {
    //             return response.json();
    //         } else {
    //             throw new Error("Failed to fetch Verra details");
    //         }
    //     }).then((json) => {
    //         setDetails(json);
    //     }).catch(console.error);
    // }, [project]);

    if (!link) return undefined;

    return {
        // ...details,
        link,
    };
}