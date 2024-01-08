import { ContractReceipt, ethers } from "ethers";

import {HOLDING_CONTRACT_ABI} from "../retirement-ui/src/lib/abi/holdingContract";


require("dotenv").config(({ path: ".env" }));
const POLYGON_PRIVATE_KEY = process.env.POLYGON_PRIVATE_KEY;
const POLYGON_NODE_URL = process.env.POLYGON_NODE_URL;

const ethProvider = new ethers.providers.JsonRpcProvider(POLYGON_NODE_URL);
const ethSigner = new ethers.Wallet(POLYGON_PRIVATE_KEY, ethProvider);

// Call offset function on HoldingContract to retire carbon tokens using the funds 
async function setRetireContract() {
    const contract = new ethers.Contract("0xfef853578d8a6aef2599194ac0e2e339fb08c67c", HOLDING_CONTRACT_ABI, ethSigner);
    const tx = await contract.setRetireContract("0x70acbb1b1D75c6a210F2439901B4A153C49c712f", { gasLimit: 10000000, gasPrice: ethers.utils.parseUnits('200', 'gwei') });
    const receipt: ContractReceipt = await tx.wait();
    return receipt;
}

async function main() {
    setRetireContract().then(receipt => {
        console.log('Receipt:', receipt);
    }).catch(console.error)
}

main();