import {ethers} from "ethers";

import {HOLDING_CONTRACT_ABI} from "../retirement-ui/src/lib/abi/holdingContract";

require("dotenv").config(({ path: ".env" }));
const POLYGON_PRIVATE_KEY = process.env.POLYGON_PRIVATE_KEY;
const POLYGON_NODE_URL = process.env.POLYGON_NODE_URL;

const ethProvider = new ethers.providers.JsonRpcProvider(POLYGON_NODE_URL);
const ethSigner = new ethers.Wallet(POLYGON_PRIVATE_KEY, ethProvider);

async function setSelectedTCO2() {
    const contract = new ethers.Contract(process.argv[2], HOLDING_CONTRACT_ABI, ethSigner);
    const tx = await contract.setTCO2(process.argv[3], { gasLimit: 10000000, gasPrice: ethers.utils.parseUnits('200', 'gwei') });
    const result = await tx.wait();
    return result.wait();
}

async function main() {
    setSelectedTCO2().then(receipt => {
        console.log('Receipt:', receipt);
    }).catch(console.error)
}

main();