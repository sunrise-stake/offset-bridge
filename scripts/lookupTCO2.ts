import {NCT_TOKEN_ADDRESS} from "../ui/src/lib/constants";
import ToucanClient from "toucan-sdk";
import {gql} from "@urql/core";

require("dotenv").config(({ path: ".env" }));

const toucan = new ToucanClient("polygon")

const name = process.argv[2] ?? "";
console.log("Looking up TCO2 for project", name);

type PooledTCO2Token = {
    address: string,
    name: string,
    totalRetired: string
}

type PooledTokenLookup = {
    pooledTCO2Tokens: [{
        token: PooledTCO2Token,
        amount: string
    }]
}

const roundToThree = (amount: string) => {
    const num18 = Number(amount) / 10 ** 18;
    return Math.round(num18 * 1000) / 1000;
};

const fetchNCTTokens = async (name = "") => {
    const query = gql`
        query ($poolAddress: String, $namePrefix: String) {
            pooledTCO2Tokens(where: {poolAddress: $poolAddress, token_: {name_starts_with_nocase: $namePrefix}}) {
                token {
                    address
                    name
                    totalRetired
                }
                amount
            }
        }
    `;

    const result = await toucan.fetchCustomQuery<PooledTokenLookup>(query, {
        poolAddress: NCT_TOKEN_ADDRESS,
        namePrefix: "Toucan Protocol: TCO2-VCS-" + name
    });

    if (!result) return [];

    return result.pooledTCO2Tokens.map((pooledToken) => ({
        ...pooledToken.token,
        amount: roundToThree(pooledToken.amount),
        address: "https://polygonscan.com/token/" + pooledToken.token.address + "#balances"
    }));
}

async function lookupTCO2(projectName: string) {
    const allProjects = await fetchNCTTokens(projectName);
    const sortedProjects = allProjects.sort((a, b) => Number(b.amount) - Number(a.amount));

    console.log(sortedProjects);
}

async function main() {
    lookupTCO2(name).catch(console.error)
}

main();