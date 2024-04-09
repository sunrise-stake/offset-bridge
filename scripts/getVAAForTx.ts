import * as Wormhole from "@certusone/wormhole-sdk";
import { NodeHttpTransport } from "@improbable-eng/grpc-web-node-http-transport";

const { ethers } = require("ethers");
require("dotenv").config(({ path: ".env" }));
const POLYGON_NODE_URL = process.env.POLYGON_NODE_URL;
const {
    POLYGON_BRIDGE_ADDRESS, POLYGON_NFT_BRIDGE_ADDRESS, WORMHOLE_RPC_HOSTS_MAINNET,
    CHAIN_ID_POLYGON
} = require("./constants");

const ethProvider = new ethers.providers.JsonRpcProvider(POLYGON_NODE_URL);


async function getVAA() {
    const txHash = process.argv[2];
    console.log(`Getting VAA for Polygon Wormhole tx ${txHash}...`);
    const txResponse = await ethProvider.getTransaction(txHash);
    const receipt = await txResponse.wait();

    console.log("Getting VAA...");
    const emitterAddress = Wormhole.getEmitterAddressEth(POLYGON_NFT_BRIDGE_ADDRESS);
    const sequence = Wormhole.parseSequenceFromLogEth(receipt, POLYGON_BRIDGE_ADDRESS);
    console.log("sequence: ", sequence);
    // const vaaURL = `${config.wormhole.restAddress}/v1/signed_vaa/5/${emitterAddr}/${seq}`;
    // let vaaBytes = await (await Wormhole.fetch(vaaURL)).json();
    const { vaaBytes } = await Wormhole.getSignedVAAWithRetry(
        WORMHOLE_RPC_HOSTS_MAINNET,
        CHAIN_ID_POLYGON,
        emitterAddress,
        sequence,
        {
            transport: NodeHttpTransport(),
        }
    );
    console.log("Signed VAA:", Buffer.from(vaaBytes).toString("base64"));

}

async function main() {
    getVAA().catch(console.error)
}

main();