import * as Wormhole from "@certusone/wormhole-sdk";
import { getForeignAssetSolana } from "@certusone/wormhole-sdk/lib/cjs/nft_bridge";
import { NodeHttpTransport } from "@improbable-eng/grpc-web-node-http-transport";
import { type } from "os";
import {
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
    getAssociatedTokenAddressSync,
    // ASSOCIATED_TOKEN_PROGRAM_ID,
    // TOKEN_PROGRAM_ID,
} from "spl-token-latest";
import { PublicKey, Connection, Keypair, TransactionInstruction } from "@solana/web3.js";


const { ethers } = require("ethers");
require("dotenv").config(({ path: ".env" }));
const POLYGON_PRIVATE_KEY = process.env.POLYGON_PRIVATE_KEY;
const POLYGON_NODE_URL = process.env.POLYGON_NODE_URL;
const { HOLDING_CONTRACT_ABI, HOLDING_CONTRACT_ADDRESS, POLYGON_TEST_BRIDGE_ADDRESS, POLYGON_TEST_NFT_BRIDGE_ADDRESS, WORMHOLE_RPC_HOSTS_TESTNET, SOLANA_RPC_ENDPOINT, CHAIN_ID_POLYGON, SOLANA_TEST_NFT_BRIDGE_ADDRESS, USER_KEYPAIR } = require("./constants");
// const { createAssociatedTokenAccount } = require("./createATAs");

const ethProvider = new ethers.providers.JsonRpcProvider(POLYGON_NODE_URL);
const ethSigner = new ethers.Wallet(POLYGON_PRIVATE_KEY, ethProvider);


// const tokenId = parseInt(Buffer.from(process.argv[2]).toString());
const tokenId = BigInt(process.argv[2]);
const CONTRACT_ADDRESS = "0x5B6E9D8d8C73045065277785247784416650D8e9";
const CONTRACT_ABI = [
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "newTco2",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "newBeneficiary",
                "type": "address"
            },
            {
                "internalType": "string",
                "name": "newBeneficiaryName",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "newSolanaAccountAddress",
                "type": "string"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "inputs": [],
        "name": "InsufficientFunds",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "InvalidRetireContract",
        "type": "error"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "tco2",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "beneficiary",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "string",
                "name": "beneficiaryName",
                "type": "string"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "Offset",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "previousOwner",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "newOwner",
                "type": "address"
            }
        ],
        "name": "OwnershipTransferred",
        "type": "event"
    },
    {
        "inputs": [],
        "name": "SolanaAccountAddress",
        "outputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "beneficiary",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "beneficiaryName",
        "outputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "tokenId",
                "type": "uint256"
            },
            {
                "internalType": "bytes32",
                "name": "recipient",
                "type": "bytes32"
            }
        ],
        "name": "bridgeNFT",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "sequence",
                "type": "uint256"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "certificate",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "entity",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "message",
                "type": "string"
            }
        ],
        "name": "offset",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "owner",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "renounceOwnership",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "retireContract",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "newBeneficiary",
                "type": "address"
            },
            {
                "internalType": "string",
                "name": "newBeneficiaryName",
                "type": "string"
            }
        ],
        "name": "setBeneficiary",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "newRetireContract",
                "type": "address"
            }
        ],
        "name": "setRetireContract",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "newSolanaAccountAddress",
                "type": "string"
            }
        ],
        "name": "setSolanaAccountAddress",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "newTco2",
                "type": "address"
            }
        ],
        "name": "setTCO2",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "str",
                "type": "string"
            }
        ],
        "name": "stringToBytes32",
        "outputs": [
            {
                "internalType": "bytes32",
                "name": "result",
                "type": "bytes32"
            }
        ],
        "stateMutability": "pure",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "tco2",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "newOwner",
                "type": "address"
            }
        ],
        "name": "transferOwnership",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
];
const tokenAddress = "0xC15133D0Fc527AD38eaB2627ee89FD8faf728859"; //nft address on polygon

async function getRecipient() {
    const solanaConnection = new Connection(SOLANA_RPC_ENDPOINT, 'finalized');
    const solanaAsset = (await getForeignAssetSolana(
        SOLANA_TEST_NFT_BRIDGE_ADDRESS,
        CHAIN_ID_POLYGON,
        Wormhole.hexToUint8Array(Wormhole.nativeToHexString(tokenAddress, CHAIN_ID_POLYGON)),
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
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, ethSigner);
    const recipient = await getRecipient();
    const tx = await contract.bridgeNFT(tokenId, recipient, { gasLimit: 500000, gasPrice: ethers.utils.parseUnits("200", "gwei") });
    const receipt = await tx.wait();
    console.log("Transfer successful, tx hash: ", receipt.transactionHash);

    console.log("Getting VAA...");
    const emitterAddress = Wormhole.getEmitterAddressEth(POLYGON_TEST_NFT_BRIDGE_ADDRESS);
    const sequence = Wormhole.parseSequenceFromLogEth(receipt, POLYGON_TEST_BRIDGE_ADDRESS);
    console.log("sequence: ", sequence);
    // const vaaURL = `${config.wormhole.restAddress}/v1/signed_vaa/5/${emitterAddr}/${seq}`;
    // let vaaBytes = await (await Wormhole.fetch(vaaURL)).json();
    const { vaaBytes } = await Wormhole.getSignedVAAWithRetry(
        WORMHOLE_RPC_HOSTS_TESTNET,
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