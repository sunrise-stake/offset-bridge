import { type IdlAccounts } from "@coral-xyz/anchor";
import {TokenSwap} from "@/api/types/token_swap";

export type VAAResult = { vaaBytes: Uint8Array, sequence: string, emitterAddress: string, emitterChain: number };

export type SolanaStateAccount =
    IdlAccounts<TokenSwap>["state"];