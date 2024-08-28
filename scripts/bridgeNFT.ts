import * as Wormhole from "@certusone/wormhole-sdk";
import { getForeignAssetSolana } from "@certusone/wormhole-sdk/lib/cjs/nft_bridge";
import { NodeHttpTransport } from "@improbable-eng/grpc-web-node-http-transport";
import {
    getAssociatedTokenAddressSync,
} from "spl-token-latest";
import { PublicKey, Connection } from "@solana/web3.js";


const { ethers } = require("ethers");
require("dotenv").config(({ path: ".env" }));
const POLYGON_PRIVATE_KEY = process.env.POLYGON_PRIVATE_KEY;
const POLYGON_NODE_URL = process.env.POLYGON_NODE_URL;
const { HOLDING_CONTRACT_ABI, HOLDING_CONTRACT_ADDRESS, POLYGON_BRIDGE_ADDRESS, POLYGON_NFT_BRIDGE_ADDRESS, WORMHOLE_RPC_HOSTS_MAINNET, SOLANA_RPC_ENDPOINT, CHAIN_ID_POLYGON, SOLANA_NFT_BRIDGE_ADDRESS, USER_KEYPAIR, RETIREMENT_CERT } = require("./constants");

const ethProvider = new ethers.providers.JsonRpcProvider(POLYGON_NODE_URL);
const ethSigner = new ethers.Wallet(POLYGON_PRIVATE_KEY, ethProvider);


const tokenId = BigInt(process.argv[2]);

async function getRecipient() {
    const solanaAsset = (await getForeignAssetSolana(
        SOLANA_NFT_BRIDGE_ADDRESS,
        CHAIN_ID_POLYGON,
        Wormhole.hexToUint8Array(Wormhole.nativeToHexString(RETIREMENT_CERT, CHAIN_ID_POLYGON)),
        tokenId
    )) || "";
    const solanaMintKey = new PublicKey(solanaAsset); // NFT token 

    // const tokenAuthority = PublicKey.findProgramAddressSync([Buffer.from("input_account"), STATE_ADDRESS.toBuffer()], PROGRAM_ID)[0];
    // const tokenAuthority = PublicKey.findProgramAddressSync([Buffer.from("input_account"), USER_KEYPAIR.publicKey.toBuffer()], TOKEN_PROGRAM_ID)[0];

    const recipientAddress = await getAssociatedTokenAddressSync( //associated token account
        solanaMintKey,
        USER_KEYPAIR.publicKey,
        true
    );

    // using this transfer will fail with "    'Program ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL failed: Provided owner is not allowed'"
    // let ata = await createAssociatedTokenAccount(
    //     solanaConnection,
    //     USER_KEYPAIR,
    //     solanaMintKey,
    //     USER_KEYPAIR.publicKey,
    //     // tokenAuthority,
    //     TOKEN_PROGRAM_ID,
    //     ASSOCIATED_TOKEN_PROGRAM_ID
    // )
    // const recipient = ata.toBytes();

    console.log("Recipient address: ", recipientAddress.toString());
    const recipient = recipientAddress.toBytes();
    console.log("Recipient address: ", recipient.toString());
    return recipient;
}


async function transferNFT() {
    console.log("Transferring NFT from Polygon to Wormhole...");
    const contract = new ethers.Contract(HOLDING_CONTRACT_ADDRESS, HOLDING_CONTRACT_ABI, ethSigner);
    const recipient = await getRecipient();
    const tx = await contract.bridgeNFT(tokenId, recipient, { gasLimit: 900000, gasPrice: ethers.utils.parseUnits("200", "gwei") });
    const receipt = await tx.wait();
    console.log("Transfer successful, tx hash: ", receipt.transactionHash);

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
    transferNFT().then(() => {
        console.log('Transfer was successful!');
    }).catch(err => {
        console.error("Transfer failed:", err);
        return;
    })
}

main();