import * as Wormhole from "@certusone/wormhole-sdk";
import { ethers } from "ethers";
import {
    HOLDING_CONTRACT_ABI, HOLDING_CONTRACT_ADDRESS,
} from "./constants";


require("dotenv").config(({ path: ".env" }));
const POLYGON_PRIVATE_KEY = process.env.POLYGON_PRIVATE_KEY;
const POLYGON_NODE_URL = process.env.POLYGON_NODE_URL;

const ethProvider = new ethers.providers.JsonRpcProvider(POLYGON_NODE_URL);
const ethSigner = new ethers.Wallet(POLYGON_PRIVATE_KEY, ethProvider);

// Call offset function on HoldingContract to retire carbon tokens using the funds 
async function retire() {
    const contract = new ethers.Contract(HOLDING_CONTRACT_ADDRESS, HOLDING_CONTRACT_ABI, ethSigner);
    console.log("Sending the funds to the Retire Contract and retiring carbon tokens on Toucan... ")
    const tx = await contract.offset("Sunrise", "Climate-Positive Staking on Solana", { gasLimit: 2000000, gasPrice: ethers.utils.parseUnits('150', 'gwei') });
    const receipt = await tx.wait();
    return receipt;
}


async function main() {
    retire().then(receipt => {
        console.log('Retire successful!:', receipt.transactionHash);
    }).catch(err => {
        console.error('Retire failed:', err);
        return;
    })
}

main();