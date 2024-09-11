import ToucanClient, {TCO2TokenResponse} from "toucan-sdk";
import {useEffect, useMemo, useState} from "react";
import {gql} from "@urql/core";
import {readContracts} from "wagmi";
import {NCT_TOKEN_ADDRESS, RETIREMENT_ERC721} from "@/lib/constants";
import {Address} from "abitype/src/abi";
import {ERC721_ABI} from "@/lib/abi/erc721";

const retirementERC721Contract = {
    address: RETIREMENT_ERC721,
    abi: ERC721_ABI,
}

export type PooledTCO2Token = {
    address: Address,
    name: string
}

type PooledTokenLookup = {
    pooledTCO2Tokens: [{
        token: PooledTCO2Token
    }]
}

export const useToucan = () => {
    const toucan = useMemo(() => new ToucanClient("polygon"), []);
    const [allProjects, setAllProjects] = useState<PooledTCO2Token[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        setLoading(true);

        const fetchAllNCTTokens = async () => {
            const query = gql`
                query ($poolAddress: String) {
                    pooledTCO2Tokens(where: {poolAddress: $poolAddress}) {
                        token {
                            address
                            name
                        }
                    }
                }
            `;

            const result = await toucan.fetchCustomQuery<PooledTokenLookup>(query, { poolAddress: NCT_TOKEN_ADDRESS });

            if (!result) return [];

            return result.pooledTCO2Tokens.map((pooledToken) => pooledToken.token);
        }

        setLoading(true);
        fetchAllNCTTokens()
            .then(setAllProjects)
            .catch(setError)
            .finally(() => setLoading(false));
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