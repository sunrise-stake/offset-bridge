import {
    Connection,
    PublicKey,
    Keypair
} from '@solana/web3.js';
import {SOLANA_RPC_ENDPOINT} from "./constants";
import {Program, AnchorProvider} from "@coral-xyz/anchor";
import {SwapBridge} from "./types/swap_bridge";
import IDL from './idls/swap_bridge.json';
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import {BigNumber, ethers} from "ethers";
import {HOLDING_CONTRACT_ABI} from "../ui/src/lib/abi/holdingContract";
import {ERC20_ABI} from "../ui/src/lib/abi/erc20";
import {tokenAuthority} from "./util";

const POLYGON_NODE_URL = process.env.POLYGON_NODE_URL;
const ethProvider = new ethers.providers.JsonRpcProvider(POLYGON_NODE_URL);
const NCT_POOL_ADDRESS = "0xD838290e877E0188a4A44700463419ED96c16107";

const isValidPublicKey = (publicKey: string) => {
    try {
        new PublicKey(publicKey);
        return true;
    } catch (e) {
        return false;
    }
}

// read the state address from the command line
const stateAddress = process.argv[2] ?? "4U6vxUjMGhiaM8GzmH8KKvs8q7L3zxjDV5eRJnyfAtgF";
// ensure the state address is provided and is a valid PublicKey
if (!stateAddress || !isValidPublicKey(stateAddress)) {
    console.error('Usage: bun run scripts/getState.ts <stateAddress>');
    process.exit(1);
}

(async () => {
    // Setup Solana RPC connection
    const connection = new Connection(SOLANA_RPC_ENDPOINT);

    const provider = new AnchorProvider(connection, new NodeWallet(Keypair.generate()), {});
    const program = new Program<SwapBridge>(IDL as SwapBridge, provider);

    console.log("Fetching state on Solana...")

    const state = await program.account.state.fetch(new PublicKey(stateAddress));

    console.log("State Address:", stateAddress);
    console.log("Output Mint Address:", state.outputMint.toBase58());
    console.log("Chain ID:", state.tokenChainId);
    console.log("Holding Contract:", state.holdingContract);
    console.log("Upgrade Authority:", state.updateAuthority.toBase58())

    console.log("Token Authority", tokenAuthority(new PublicKey(stateAddress)).toBase58())

    console.log("Fetching holding contract state on Polygon...")
    const holdingContract = new ethers.Contract(state.holdingContract, HOLDING_CONTRACT_ABI, ethProvider);
    const owner = await holdingContract.owner();
    console.log("Owner:", owner);

    const retirementContract = await holdingContract.retireContract();
    console.log("Retirement Contract:", retirementContract);

    const tco2ContractAddress = await holdingContract.tco2();
    console.log("TCO2 Contract Address:", tco2ContractAddress);
    const tco2Contract = new ethers.Contract(tco2ContractAddress, ERC20_ABI, ethProvider);
    const result = await tco2Contract.balanceOf(NCT_POOL_ADDRESS);
    const decimals = await tco2Contract.decimals();

    const balance = BigNumber.from(result.toString());
    const balanceHuman = balance.div(BigNumber.from(10).pow(decimals)).toString();
    console.log("Available to retire va NCT:", balanceHuman);


})().catch((error) => {
    console.error(error);
    process.exit(1);
});