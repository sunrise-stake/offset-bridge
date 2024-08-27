import {ethers} from "ethers";

import {HOLDING_CONTRACT_ABI} from "../ui/src/lib/abi/holdingContract";

require("dotenv").config(({ path: ".env" }));
const POLYGON_NODE_URL = process.env.POLYGON_NODE_URL;

const ethProvider = new ethers.providers.JsonRpcProvider(POLYGON_NODE_URL);

async function getRetireContract() {
    const contract = new ethers.Contract(process.argv[2], HOLDING_CONTRACT_ABI, ethProvider);
    return contract.retireContract();
}

async function main() {
    getRetireContract().then(receipt => {
        console.log('Receipt:', receipt);
    }).catch(console.error)
}

main();