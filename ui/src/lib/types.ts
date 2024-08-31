import { type IdlAccounts } from "@coral-xyz/anchor";
import {SwapBridge} from "@/api/types/swap_bridge";

export type VAAResult = { vaaBytes: Uint8Array, sequence: string, emitterAddress: string, emitterChain: number };

export type SolanaStateAccount =
    IdlAccounts<SwapBridge>["state"];