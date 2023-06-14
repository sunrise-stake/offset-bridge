import * as Wormhole from "@certusone/wormhole-sdk";
import { ContractReceipt, ContractTransaction, ethers } from "ethers";
import {
    HOLDING_CONTRACT_ABI, HOLDING_CONTRACT_ADDRESS,
} from "./constants";
import { get } from "http";


require("dotenv").config(({ path: ".env" }));
const POLYGON_PRIVATE_KEY = process.env.POLYGON_PRIVATE_KEY;
const POLYGON_NODE_URL = process.env.POLYGON_NODE_URL;

const ethProvider = new ethers.providers.JsonRpcProvider(POLYGON_NODE_URL);
const ethSigner = new ethers.Wallet(POLYGON_PRIVATE_KEY, ethProvider);

// Call offset function on HoldingContract to retire carbon tokens using the funds 
async function retire() {
    const contract = new ethers.Contract(HOLDING_CONTRACT_ADDRESS, HOLDING_CONTRACT_ABI, ethSigner);
    console.log("Sending the funds to the Retire Contract and retiring carbon tokens on Toucan... ")
    const tx = await contract.offset("Sunrise", "Climate-Positive Staking on Solana", { gasLimit: 10000000, gasPrice: ethers.utils.parseUnits('200', 'gwei') });
    const receipt: ContractReceipt = await tx.wait();
    return receipt;
}

//take tx receipt and return the newly minted NFT token ID read out from the events 
function getTokenId(receipt: ContractReceipt) {
    const event = receipt.events.find((e: any) => e.event === "CertificateMinted");
    if (!event) {
        return null;
    }
    const tokenId = event.args[0];
    return tokenId;
}

async function main() {
    retire().then(receipt => {
        console.log('Retire successful!:', receipt.transactionHash);
        console.log('Receipt:', receipt);
        const tokenId = getTokenId(receipt);
        console.log('Token ID:', tokenId);
        return tokenId;
    }).catch(err => {
        console.error('Retire failed:', err);
        return;
    })
}

main();