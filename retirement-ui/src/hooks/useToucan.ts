import ToucanClient, {TCO2TokenResponse} from "toucan-sdk";
import {useEffect, useMemo, useState} from "react";
import {gql} from "@urql/core";
import {readContracts} from "wagmi";
import {ERC721_ABI, RETIREMENT_ERC721} from "@/lib/constants";

const retirementERC721Contract = {
    address: RETIREMENT_ERC721,
    abi: ERC721_ABI,
}

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
    }, []);

    const fetchRetirementNFTs = async (holdingContract: string): Promise<number[]> => {
        const query = gql`
            query ($beneficiary: String) {
                retirementCertificates(where: {beneficiary_: {id: $beneficiary}}) {
                    id
                }
            }
        `;

        const result = await toucan.fetchCustomQuery<{ retirementCertificates: { id: string }[]}>(query, { beneficiary: holdingContract.toLowerCase() });
        const tokenIds = result?.retirementCertificates.map((retirementNFT: any) => Number(retirementNFT.id));

        if (!tokenIds) return [];

        const data = await readContracts({
            contracts: tokenIds.map((tokenId) => ({
                ...retirementERC721Contract,
                functionName: 'ownerOf',
                args: [tokenId]
            }))
        });

        console.log({tokenIds, data})

        if (!data) return [];

        return data
            .map((result, i) => ({ tokenId: tokenIds[i], owner: result.result }))
            .filter((result) => result.owner === holdingContract)
            .map((result) => result.tokenId);
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