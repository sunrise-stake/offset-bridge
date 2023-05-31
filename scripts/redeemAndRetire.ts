const { ethers } = require("ethers");
require("dotenv").config(({ path: ".env" }));
const POLYGON_PRIVATE_KEY = process.env.POLYGON_PRIVATE_KEY;
const POLYGON_NODE_URL = process.env.POLYGON_NODE_URL;
const { POLYGON_TOKEN_BRIDGE_ADDRESS, HOLDING_CONTRACT_ABI, HOLDING_CONTRACT_ADDRESS } = require("../constants");
const Wormhole = require("@certusone/wormhole-sdk");

const provider = new ethers.providers.JsonRpcProvider(POLYGON_NODE_URL);
const signer = new ethers.Wallet(POLYGON_PRIVATE_KEY, provider);

// Redeem Wormhole message to deposit bridged funds into HoldingContract on Polygon
async function redeem() {
    console.log("Redeeming Wormhole message on Polygon and depositing the funds into the Holding Contract...");
    const receipt = await Wormhole.redeemOnEth(POLYGON_TOKEN_BRIDGE_ADDRESS, signer, vaaBytes);
    // console.log("Redeem was successful! Transaction: ", txid)
}

// Call offset function on HoldingContract to retire carbon tokens using the funds 
async function retire() {
    const contract = new ethers.Contract(HOLDING_CONTRACT_ADDRESS, HOLDING_CONTRACT_ABI, provider);
    console.log("Sending the funds to the Retire Contract and retiring carbon tokens on Toucan... ")
    const tx = await contract.connect(signer).offset("Sunrise", "Climate-Positive Staking on Solana").send();
}


async function main() {
    redeem().then(() => {
        console.log('Redeem was successful!');
    }).catch(err => {
        console.error("Redeem failed:", err);
        return;
    })
    retire().then(() => {
        console.log('Retire was successful!');
    }).catch(err => {
        console.error('Retire failed:', err);
        return;
    })
}

main();