import ToucanClient, {TCO2TokenResponse} from "toucan-sdk";
import {useEffect, useMemo, useState} from "react";
import {gql} from "@urql/core";
export const useToucan = () => {
    const toucan = useMemo(() => new ToucanClient("polygon"), []);
    const [allProjects, setAllProjects] = useState<TCO2TokenResponse[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const fetchAllTCO2Tokens = async () => {
            const result = await toucan.fetchAllTCO2Tokens();
            setAllProjects(result);
        }
        setLoading(true);
        fetchAllTCO2Tokens().catch(setError).finally(() => setLoading(false));
    });

    const fetchRetirementNFTs = async (holdingContract: string) => {
        const query = gql`
            query ($beneficiary: String) {
                retirementCertificates(where: {beneficiary: $beneficiary}) {
                    id
                }
            }
        `;

        const result = await toucan.fetchCustomQuery(query, { $beneficiary: holdingContract });

        console.log(result)

        return result;
    }

    const getProjectById = async (id: string):Promise<TCO2TokenResponse | undefined> => toucan.fetchTCO2TokenByFullSymbol(id)

    return {
        loading,
        error,
        allProjects,
        getProjectById,
        fetchRetirementNFTs
    }
}