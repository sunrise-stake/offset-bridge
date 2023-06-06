// const { ethers } = require("ethers");
// require("dotenv").config(({ path: ".env" }));
// const POLYGON_PRIVATE_KEY = process.env.POLYGON_PRIVATE_KEY;
// const POLYGON_NODE_URL = process.env.POLYGON_NODE_URL;
// const { POLYGON_NFT_BRIDGE_ADDRESS, TOUCAN_NFT_ADDRESS, TOUCAN_NFT_ABI, HOLDING_CONTRACT_ABI, HOLDING_CONTRACT_ADDRESS } = require("../constants");
// const Wormhole = require("@certusone/wormhole-sdk");

// const provider = new ethers.providers.JsonRpcProvider(POLYGON_NODE_URL);
// const signer = new ethers.Wallet(POLYGON_PRIVATE_KEY, provider);

// async function transferNFT() {
//     console.log("Transferring NFT from Polygon to Wormhole...");

//     const nftContract = new ethers.Contract(TOUCAN_NFT_ADDRESS, TOUCAN_NFT_ABI, provider);

//     // Approve the Wormhole NFT Bridge contract to transfer the NFT
//     // await nftContract.approve(POLYGON_NFT_BRIDGE_ADDRESS, tokenId); // TODO call this by proxy 

//     // const receipt = await Wormhole.redeemOnEth(POLYGON_TOKEN_BRIDGE_ADDRESS, signer, vaaBytes);
//     // const txid = receipt.transactionHash;
//     // console.log("Redeem was successful! Transaction: ", txid)
// }

// async function main() {
//     transferNFT().then(() => {
//         console.log('Transfer was successful!');
//     }).catch(err => {
//         console.error("Transfer failed:", err);
//         return;
//     })
// }

// main();