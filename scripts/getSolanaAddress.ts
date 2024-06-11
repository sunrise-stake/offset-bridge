import { ContractReceipt, ethers } from "ethers";

import {HOLDING_CONTRACT_ABI} from "../retirement-ui/src/lib/abi/holdingContract";


require("dotenv").config(({ path: ".env" }));
const POLYGON_NODE_URL = process.env.POLYGON_NODE_URL;

const ethProvider = new ethers.providers.JsonRpcProvider(POLYGON_NODE_URL);

async function getSolanaAddress() {
    const contract = new ethers.Contract("0x4B80Db79eF59b3e04F95eA55aBfBa458c2d73C66", HOLDING_CONTRACT_ABI, ethProvider);
    const result = await contract.SolanaAccountAddress();
    console.log(result);
}

async function main() {
    getSolanaAddress().then(receipt => {
        console.log('Receipt:', receipt);
    }).catch(console.error)
}

main();