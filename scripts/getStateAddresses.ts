import { PublicKey } from "@solana/web3.js";
import {WRAPPED_SOL_TOKEN_MINT, STATE_ADDRESS} from "./constants";
import {getAssociatedTokenAddressSync} from "spl-token-latest";
import {tokenAuthority} from "./util";

const wrappedSolATA = getAssociatedTokenAddressSync(new PublicKey(WRAPPED_SOL_TOKEN_MINT), tokenAuthority(STATE_ADDRESS), true);

console.log("state address: ", STATE_ADDRESS.toBase58())
console.log("tokenAuthority: ", tokenAuthority(STATE_ADDRESS).toBase58())
console.log("wrappedSolATA", wrappedSolATA.toBase58());