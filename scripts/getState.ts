import {
    Connection,
    PublicKey,
    Keypair
} from '@solana/web3.js';
import {SOLANA_RPC_ENDPOINT} from "./constants";
import {Program, AnchorProvider} from "@coral-xyz/anchor";
import {TokenSwap} from "./types/token_swap";
import IDL from './idls/token_swap.json';
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import {BigNumber, ethers} from "ethers";
import {HOLDING_CONTRACT_ABI} from "../retirement-ui/src/lib/abi/holdingContract";
import {ERC20_ABI} from "../retirement-ui/src/lib/abi/erc20";

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
const stateAddress = process.argv[2];
// ensure the state address is provided and is a valid PublicKey
if (!stateAddress || !isValidPublicKey(stateAddress)) {
    console.error('Usage: bun run scripts/getState.ts <stateAddress>');
    process.exit(1);
}

(async () => {
    // Setup Solana RPC connection
    const connection = new Connection(SOLANA_RPC_ENDPOINT);

    const provider = new AnchorProvider(connection, new NodeWallet(Keypair.generate()), {});
    const program = new Program<TokenSwap>(IDL as TokenSwap, provider);

    console.log("Fetching state on Solana...")

    const state = await program.account.state.fetch(new PublicKey(stateAddress));

    console.log("Output Mint Address: ", state.outputMint);
    console.log("Chain ID: ", state.tokenChainId);
    console.log("Holding Contract", state.holdingContract);
    console.log("Upgrade Authority", state.updateAuthority.toBase58())

    console.log("Fetching holding contract state on Polygon...")
    const holdingContract = new ethers.Contract(state.holdingContract, HOLDING_CONTRACT_ABI, ethProvider);
    const retirementContract = await holdingContract.retireContract();

    console.log("Retirement TCO2 Contract", retirementContract);
    const tco2Contract = new ethers.Contract(retirementContract, ERC20_ABI, ethProvider);
    const result = await tco2Contract.balanceOf(NCT_POOL_ADDRESS);
    const decimals = await tco2Contract.decimals();

    const balance = BigNumber.from(result.toString());
    const balanceHuman = balance.div(BigNumber.from(10).pow(decimals)).toString();
    console.log("Available to retire va NCT:", balanceHuman);


})().catch((error) => {
    console.error(error);
    process.exit(1);
});