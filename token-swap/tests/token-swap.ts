import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Keypair } from "@solana/web3.js";
import { TokenSwap } from "../../scripts/types/token_swap";

describe("token-swap", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.TokenSwap as Program<TokenSwap>;

  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.methods.initialize(
        Keypair.generate().publicKey,
        0.99
    ).rpc();
    console.log("Your transaction signature", tx);
  });
});
