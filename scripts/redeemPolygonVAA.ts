// Transfer from Solana to Polygon using Wormhole SDK
import * as Wormhole from "@certusone/wormhole-sdk";
import {ethers} from "ethers";
import {
  POLYGON_TOKEN_BRIDGE_ADDRESS,
} from "./constants";

require("dotenv").config(({ path: ".env" }));

const POLYGON_PRIVATE_KEY = process.env.POLYGON_PRIVATE_KEY;
const POLYGON_NODE_URL = process.env.POLYGON_NODE_URL;

const vaaBytes = Buffer.from(process.argv[2], 'base64');

async function redeemPolygonVAA() {
  console.log('Redeeming VAA on Polygon...');
  console.log('VAA:', vaaBytes.toString('base64'));
  const ethProvider = new ethers.providers.JsonRpcProvider(POLYGON_NODE_URL);
  const ethSigner = new ethers.Wallet(POLYGON_PRIVATE_KEY, ethProvider);

  // Redeem on Ethereum (Polygon in this case)
  await Wormhole.redeemOnEth(POLYGON_TOKEN_BRIDGE_ADDRESS, ethSigner, vaaBytes);
}

async function main() {
  try {
    await redeemPolygonVAA();
    console.log('Redeem successful!');
  } catch (err) {
    console.error('Redeem failed:', err);
  }
}

main();