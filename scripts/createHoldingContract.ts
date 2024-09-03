import { ContractReceipt, ethers } from "ethers";

import {HOLDING_CONTRACT_ABI} from "../ui/src/lib/abi/holdingContract";
import {
    HOLDING_CONTRACT_FACTORY_ADDRESS,
    holdingContractFactorySalt,
    RETIREMENT_CONTRACT
} from "../ui/src/lib/constants";
import {HOLDING_CONTRACT_FACTORY_ABI} from "../ui/src/lib/abi/holdingContractFactory";
import {PublicKey} from "@solana/web3.js";
import {solanaAddressToHex} from "./util";

require("dotenv").config(({ path: ".env" }));
const POLYGON_PRIVATE_KEY = process.env.POLYGON_PRIVATE_KEY;
const POLYGON_NODE_URL = process.env.POLYGON_NODE_URL;

const ethProvider = new ethers.providers.JsonRpcProvider(POLYGON_NODE_URL);
const ethSigner = new ethers.Wallet(POLYGON_PRIVATE_KEY, ethProvider);

const salt = holdingContractFactorySalt(ethSigner.address || '0x');
const dummySolanaAddress = solanaAddressToHex(
    new PublicKey("11111111111111111111111111111111")
);

// read the retirement project and beneficiary from the command line
const retirementProject = process.argv[2];
const beneficiary = process.argv[3];

// check that both are provided and that retirement project is a valid address
if (!retirementProject || !beneficiary || !ethers.utils.isAddress(retirementProject)) {
    console.error('Usage: node scripts/createHoldingContract.js <retirementProject> <beneficiary>');
    process.exit(1);
}

const factoryContract = new ethers.Contract(HOLDING_CONTRACT_FACTORY_ADDRESS, HOLDING_CONTRACT_FACTORY_ABI, ethSigner);
const args = [salt, retirementProject, beneficiary, dummySolanaAddress, RETIREMENT_CONTRACT]

async function createHoldingContract() {
    const tx = await factoryContract.createContract(...args, {
        // gasLimit: 500000,
        maxFeePerGas: ethers.utils.parseUnits('30', 'gwei'),
        maxPriorityFeePerGas: ethers.utils.parseUnits('30', 'gwei'),
    });
    const receipt: ContractReceipt = await tx.wait();
    return receipt;
}

async function findHoldingContract() {
    const contractAddress = await factoryContract.getContractAddress(salt, HOLDING_CONTRACT_FACTORY_ADDRESS);
    // check if there is a contract deployed at this address. If so, return the contract object
    const bytecode = await ethProvider.getCode(contractAddress);
    if (bytecode === '0x') return null;
    return new ethers.Contract(contractAddress, HOLDING_CONTRACT_ABI, ethSigner);
}

async function main() {
    // check if the user has a holding contract
    console.log("Finding holding contract for user ", ethSigner.address);
    const contract = await findHoldingContract();
    if (contract) {
        console.log('Holding contract already exists at', contract.address);
        return;
    }
    console.log('Creating holding contract...');
    const receipt = await createHoldingContract()
    console.log('Receipt:', receipt);
}

main().catch(console.error);