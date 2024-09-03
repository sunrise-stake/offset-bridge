import { ethers } from "ethers";

import {ERC20_ABI} from "../ui/src/lib/abi/erc20";


require("dotenv").config(({ path: ".env" }));
const POLYGON_NODE_URL = process.env.POLYGON_NODE_URL;

const ethProvider = new ethers.providers.JsonRpcProvider(POLYGON_NODE_URL);

async function balanceOf() {
    const contract = new ethers.Contract(process.argv[2], ERC20_ABI, ethProvider);
    const result = await contract.balanceOf("0xD838290e877E0188a4A44700463419ED96c16107");
    console.log(result.toString());
}

async function main() {
    balanceOf().catch(console.error)
}

main();