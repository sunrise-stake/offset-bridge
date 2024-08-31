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

const targetAddress = process.argv[2];
if (!targetAddress || !ethers.utils.isAddress(targetAddress)) {
    console.error('Usage: bun run scripts/sendMatic.ts <targetAddress>');
    process.exit(1);
}



async function main() {
    const gasPrice = ethers.utils.parseUnits('30', 'gwei');
    const gasLimit = 21000;

    // Get the wallet's balance
    const balance = await ethSigner.getBalance();

    // Calculate the transaction fee
    const txFee = gasPrice.mul(gasLimit);

    // Calculate the amount to send (total balance minus the fee)
    const valueToSend = balance.sub(txFee);

    // Create the transaction object
    const tx = {
        to: targetAddress,
        value: valueToSend,
        gasPrice: gasPrice,
        gasLimit: gasLimit,
        nonce: 0 // Use nonce 0 as requested
    };

    // Send the transaction
    const transaction = await ethSigner.sendTransaction(tx);

    console.log('Transaction:', transaction.hash);
    await transaction.wait();
    console.log('Transaction confirmed');
}

main().catch(console.error);