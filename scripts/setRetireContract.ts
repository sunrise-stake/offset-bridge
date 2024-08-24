import { ContractReceipt, ethers } from "ethers";

import {HOLDING_CONTRACT_ABI} from "../retirement-ui/src/lib/abi/holdingContract";


require("dotenv").config(({ path: ".env" }));
const POLYGON_PRIVATE_KEY = process.env.POLYGON_PRIVATE_KEY;
const POLYGON_NODE_URL = process.env.POLYGON_NODE_URL;

const ethProvider = new ethers.providers.JsonRpcProvider(POLYGON_NODE_URL);
const ethSigner = new ethers.Wallet(POLYGON_PRIVATE_KEY, ethProvider);

const holdingContract = process.argv[2];
const retirementContract = process.argv[3];
if (!holdingContract || !ethers.utils.isAddress(holdingContract) || !retirementContract || !ethers.utils.isAddress(retirementContract)) {
    console.error('Usage: bun run scripts/setRetireContract.ts <holdingContract> <retirementContract>');
    process.exit(1);
}

async function setRetireContract() {
    const contract = new ethers.Contract(holdingContract, HOLDING_CONTRACT_ABI, ethSigner);
    const tx = await contract.setRetireContract(retirementContract, {
        // gasLimit: 500000,
        maxFeePerGas: ethers.utils.parseUnits('30', 'gwei'),
        maxPriorityFeePerGas: ethers.utils.parseUnits('30', 'gwei'),
    });
    const receipt: ContractReceipt = await tx.wait();
    return receipt;
}

async function main() {
    setRetireContract().then(receipt => {
        console.log('Receipt:', receipt);
    }).catch(console.error)
}

main();