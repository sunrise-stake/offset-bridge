import {
    HOLDING_CONTRACT_ABI, HOLDING_CONTRACT_ADDRESS,
} from "./constants";

import * as Wormhole from "@certusone/wormhole-sdk";
import { ethers } from "ethers";

require("dotenv").config(({ path: ".env" }));
const POLYGON_PRIVATE_KEY = process.env.POLYGON_PRIVATE_KEY;
const POLYGON_NODE_URL = process.env.POLYGON_NODE_URL;
const SOLANA_PRIVATE_KEY = process.env.SOLANA_PRIVATE_KEY;

const provider = new ethers.providers.JsonRpcProvider(POLYGON_NODE_URL);
const signer = new ethers.Wallet(POLYGON_PRIVATE_KEY, provider);

// Call offset function on HoldingContract to retire carbon tokens using the funds 
async function retire() {
    console.log(SOLANA_PRIVATE_KEY);
    const contract = new ethers.Contract(HOLDING_CONTRACT_ADDRESS, HOLDING_CONTRACT_ABI, provider);
    console.log("Sending the funds to the Retire Contract and retiring carbon tokens on Toucan... ")
    const tx = await contract.connect(signer).offset("Sunrise", "Climate-Positive Staking on Solana").send();
}


async function main() {
    retire().then(() => {
        console.log('Retire successful!');
    }).catch(err => {
        console.error('Retire failed:', err);
        return;
    })
}

main();